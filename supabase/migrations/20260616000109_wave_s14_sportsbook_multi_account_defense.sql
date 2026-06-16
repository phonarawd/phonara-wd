-- ============================================================
-- Migration: 20260616000109_wave_s14_sportsbook_multi_account_defense
-- Wave-S14: device/IP correlation · linked-account block · audit
-- ============================================================

SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT);

CREATE TABLE IF NOT EXISTS sports_device_signals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bet_id        UUID NOT NULL REFERENCES sports_bets(id) ON DELETE CASCADE,
  device_hash   TEXT NOT NULL
    CONSTRAINT sds_device_hash CHECK (length(btrim(device_hash)) >= 16),
  ip_hash       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sds_device_created_idx
  ON sports_device_signals (device_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS sds_ip_created_idx
  ON sports_device_signals (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS sds_user_created_idx
  ON sports_device_signals (user_id, created_at DESC);

ALTER TABLE sports_device_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read sports_device_signals" ON sports_device_signals;
CREATE POLICY "admin read sports_device_signals" ON sports_device_signals
  FOR SELECT USING (_is_admin());
DROP POLICY IF EXISTS "service_role all sports_device_signals" ON sports_device_signals;
CREATE POLICY "service_role all sports_device_signals" ON sports_device_signals
  FOR ALL USING (auth.role() = 'service_role');

REVOKE ALL ON sports_device_signals FROM PUBLIC, anon, authenticated;
GRANT SELECT ON sports_device_signals TO authenticated;
GRANT SELECT, INSERT, DELETE ON sports_device_signals TO service_role;

INSERT INTO app_config (key, value, description) VALUES
  ('sports_device_max_users_per_hash', '2', 'Max distinct users per device_hash in correlation window.'),
  ('sports_device_correlation_days', '14', 'Lookback days for linked-account detection.'),
  ('sports_ip_max_users_per_hash', '3', 'Max distinct users per ip_hash in correlation window.')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION _assert_sports_device_signals(
  p_user_id UUID,
  p_device_hash TEXT,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_device TEXT := NULLIF(btrim(p_device_hash), '');
  v_ip TEXT := NULLIF(btrim(p_ip_hash), '');
  v_window_days INT;
  v_max_device_users INT;
  v_max_ip_users INT;
  v_since TIMESTAMPTZ;
  v_device_users INT;
  v_ip_users INT;
  v_banned_link BOOLEAN;
BEGIN
  IF v_device IS NULL AND v_ip IS NULL THEN
    RETURN;
  END IF;

  v_window_days := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_device_correlation_days'), '')::INT,
    14
  );
  v_max_device_users := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_device_max_users_per_hash'), '')::INT,
    2
  );
  v_max_ip_users := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_ip_max_users_per_hash'), '')::INT,
    3
  );
  v_since := NOW() - make_interval(days => v_window_days);

  IF v_device IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM sports_device_signals s
      JOIN sports_user_risk_profiles r ON r.user_id = s.user_id
      WHERE s.device_hash = v_device
        AND s.created_at >= v_since
        AND s.user_id <> p_user_id
        AND r.tier = 'banned'
    ) INTO v_banned_link;

    IF v_banned_link THEN
      PERFORM _sports_log_risk_event(
        p_user_id,
        'bet_blocked_banned_device_link',
        jsonb_build_object('device_hash', left(v_device, 8))
      );
      RAISE EXCEPTION 'linked_banned_device';
    END IF;

    SELECT COUNT(DISTINCT s.user_id)
      INTO v_device_users
      FROM sports_device_signals s
     WHERE s.device_hash = v_device
       AND s.created_at >= v_since;

    IF v_device_users >= v_max_device_users
       AND NOT EXISTS (
         SELECT 1 FROM sports_device_signals
         WHERE device_hash = v_device AND user_id = p_user_id AND created_at >= v_since
       ) THEN
      PERFORM _sports_log_risk_event(
        p_user_id,
        'bet_blocked_linked_device',
        jsonb_build_object('device_users', v_device_users, 'max', v_max_device_users)
      );
      RAISE EXCEPTION 'linked_account_device';
    END IF;
  END IF;

  IF v_ip IS NOT NULL THEN
    SELECT COUNT(DISTINCT s.user_id)
      INTO v_ip_users
      FROM sports_device_signals s
     WHERE s.ip_hash = v_ip
       AND s.created_at >= v_since;

    IF v_ip_users >= v_max_ip_users
       AND NOT EXISTS (
         SELECT 1 FROM sports_device_signals
         WHERE ip_hash = v_ip AND user_id = p_user_id AND created_at >= v_since
       ) THEN
      PERFORM _sports_log_risk_event(
        p_user_id,
        'bet_blocked_linked_ip',
        jsonb_build_object('ip_users', v_ip_users, 'max', v_max_ip_users)
      );
      RAISE EXCEPTION 'linked_account_ip';
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_sports_device_signals(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _record_sports_device_signal(
  p_user_id UUID,
  p_bet_id UUID,
  p_device_hash TEXT,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_device TEXT := NULLIF(btrim(p_device_hash), '');
BEGIN
  IF v_device IS NULL OR length(v_device) < 16 THEN
    RETURN;
  END IF;

  INSERT INTO sports_device_signals (user_id, bet_id, device_hash, ip_hash)
  VALUES (p_user_id, p_bet_id, v_device, NULLIF(btrim(p_ip_hash), ''));
END;
$$;

REVOKE ALL ON FUNCTION _record_sports_device_signal(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_place_sports_bet(
  p_legs            JSONB,
  p_stake           TEXT,
  p_currency        TEXT,
  p_idempotency_key TEXT,
  p_device_hash     TEXT DEFAULT NULL,
  p_ip_hash         TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing sports_bets%ROWTYPE;
  v_ccy currency;
  v_stake NUMERIC;
  v_leg_count INT;
  v_i INT;
  v_leg JSONB;
  v_outcome_id UUID;
  v_outcome sports_outcomes%ROWTYPE;
  v_market sports_markets%ROWTYPE;
  v_fixture sports_fixtures%ROWTYPE;
  v_latest RECORD;
  v_max_age INT;
  v_client_odds TEXT;
  v_combined NUMERIC := 1;
  v_payout NUMERIC;
  v_bet_id UUID := gen_random_uuid();
  v_lock_id UUID;
  v_fixture_id UUID;
  v_seen_outcomes UUID[] := '{}';
  v_seen_fixtures UUID[] := '{}';
  v_is_live BOOLEAN;
  v_leg_outcomes UUID[] := '{}';
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  SELECT * INTO v_existing FROM sports_bets
  WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'bet_id', v_existing.id,
      'status', v_existing.status,
      'combined_odds', v_existing.combined_odds,
      'potential_payout', v_existing.potential_payout,
      'already_placed', TRUE
    );
  END IF;

  PERFORM _assert_sports_user_risk_allowed(v_user_id);
  PERFORM _assert_sports_device_signals(v_user_id, p_device_hash, p_ip_hash);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_place_sports_bet');
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('sports');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_stake);

  BEGIN
    v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_currency';
  END;
  IF v_ccy NOT IN ('PHON', 'USDT') THEN
    RAISE EXCEPTION 'invalid_currency';
  END IF;

  PERFORM _assert_rg_domain_entry_allowed(v_user_id, 'sports', v_ccy);

  v_stake := p_stake::NUMERIC;
  IF v_stake <= 0 THEN RAISE EXCEPTION 'invalid_stake'; END IF;
  PERFORM _assert_sports_stake_limits(v_ccy, v_stake);
  PERFORM _assert_sports_risk_stake_cap(v_user_id, v_ccy, v_stake);
  PERFORM _assert_sports_user_daily_limits(v_user_id, v_ccy, v_stake);

  IF p_legs IS NULL OR jsonb_typeof(p_legs) <> 'array' THEN
    RAISE EXCEPTION 'invalid_legs';
  END IF;

  v_leg_count := jsonb_array_length(p_legs);
  IF v_leg_count < 1 OR v_leg_count > 8 THEN
    RAISE EXCEPTION 'invalid_leg_count';
  END IF;

  FOR v_i IN 0 .. v_leg_count - 1 LOOP
    v_leg := p_legs->v_i;
    v_outcome_id := (v_leg->>'outcome_id')::UUID;
    IF v_outcome_id IS NULL THEN RAISE EXCEPTION 'invalid_outcome_id'; END IF;

    IF v_outcome_id = ANY(v_seen_outcomes) THEN
      RAISE EXCEPTION 'duplicate_outcome';
    END IF;
    v_seen_outcomes := array_append(v_seen_outcomes, v_outcome_id);

    SELECT * INTO v_outcome FROM sports_outcomes WHERE id = v_outcome_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'outcome_not_found'; END IF;

    SELECT * INTO v_market FROM sports_markets WHERE id = v_outcome.market_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

    SELECT * INTO v_fixture FROM sports_fixtures WHERE id = v_market.fixture_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;

    PERFORM _sports_assert_market_placeable(v_market.id, v_fixture.id);
    PERFORM _assert_sports_no_market_hedge(v_user_id, v_market.id);

    v_is_live := v_fixture.status = 'live';
    IF v_fixture.status NOT IN ('scheduled', 'live') THEN
      RAISE EXCEPTION 'fixture_not_open';
    END IF;

    IF NOT v_is_live THEN
      IF v_fixture.kickoff_at <= NOW() THEN RAISE EXCEPTION 'kickoff_passed'; END IF;
      v_max_age := _sports_odds_max_age_sec();
    ELSE
      v_max_age := COALESCE(
        NULLIF((SELECT value FROM app_config WHERE key = 'sports_live_odds_max_age_sec'), '')::INT,
        15
      );
    END IF;

    SELECT * INTO v_latest FROM _sports_latest_odds(v_outcome_id);
    IF v_latest.odds IS NULL THEN RAISE EXCEPTION 'odds_unavailable'; END IF;
    IF v_latest.captured_at < NOW() - make_interval(secs => v_max_age) THEN
      RAISE EXCEPTION 'odds_stale';
    END IF;

    v_client_odds := btrim(v_leg->>'odds_at_bet');
    IF v_client_odds IS NULL OR v_client_odds !~ '^\d+(\.\d+)?$' THEN
      RAISE EXCEPTION 'invalid_odds_at_bet';
    END IF;
    IF v_client_odds::NUMERIC <= 1 THEN RAISE EXCEPTION 'invalid_odds_at_bet'; END IF;
    IF NOT _sports_odds_exact_match(v_latest.odds, v_client_odds) THEN
      RAISE EXCEPTION 'odds_changed'
        USING DETAIL = format('expected=%s client=%s', v_latest.odds, v_client_odds);
    END IF;

    IF v_leg_count > 1 AND v_fixture.id = ANY(v_seen_fixtures) THEN
      RAISE EXCEPTION 'duplicate_fixture';
    END IF;
    v_seen_fixtures := array_append(v_seen_fixtures, v_fixture.id);

    v_combined := v_combined * v_client_odds::NUMERIC;
    v_leg_outcomes := array_append(v_leg_outcomes, v_outcome_id);
  END LOOP;

  v_payout := trunc(v_stake * v_combined, 6);
  PERFORM _assert_sports_payout_cap(v_ccy, v_payout);
  PERFORM _assert_sports_house_exposure(v_ccy, v_payout);

  FOR v_i IN 1 .. array_length(v_leg_outcomes, 1) LOOP
    PERFORM _assert_sports_outcome_liability(v_leg_outcomes[v_i], v_ccy, v_payout);
  END LOOP;

  PERFORM _sports_live_acceptance_delay(v_user_id, v_ccy, v_stake, v_is_live);

  v_lock_id := _lock_wallet_internal(
    v_user_id,
    v_ccy,
    _fmt6(v_stake),
    'sports_stake_lock',
    'sbet_lock:' || v_user_id::TEXT || ':' || p_idempotency_key
  );

  INSERT INTO sports_bets (
    id, user_id, currency, stake, combined_odds, potential_payout,
    status, idempotency_key, stake_lock_id
  ) VALUES (
    v_bet_id, v_user_id, v_ccy, _fmt6(v_stake), _fmt6(v_combined), _fmt6(v_payout),
    'pending', p_idempotency_key, v_lock_id
  );

  FOR v_i IN 0 .. v_leg_count - 1 LOOP
    v_leg := p_legs->v_i;
    v_outcome_id := (v_leg->>'outcome_id')::UUID;

    SELECT m.fixture_id INTO v_fixture_id
    FROM sports_outcomes o
    JOIN sports_markets m ON m.id = o.market_id
    WHERE o.id = v_outcome_id;

    INSERT INTO sports_bet_legs (bet_id, outcome_id, fixture_id, odds_at_bet)
    VALUES (v_bet_id, v_outcome_id, v_fixture_id, btrim(v_leg->>'odds_at_bet'));
  END LOOP;

  PERFORM _record_sports_device_signal(v_user_id, v_bet_id, p_device_hash, p_ip_hash);

  RETURN jsonb_build_object(
    'bet_id', v_bet_id,
    'status', 'pending',
    'combined_odds', _fmt6(v_combined),
    'potential_payout', _fmt6(v_payout),
    'already_placed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_list_linked_device_users(
  p_device_hash TEXT,
  p_limit INT DEFAULT 50
)
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_device TEXT := NULLIF(btrim(p_device_hash), '');
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF v_device IS NULL OR length(v_device) < 16 THEN
    RAISE EXCEPTION 'invalid_device_hash';
  END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'user_id', s.user_id,
    'bet_count', COUNT(*),
    'last_seen', MAX(s.created_at),
    'risk_tier', COALESCE(r.tier::TEXT, 'normal')
  )
  FROM sports_device_signals s
  LEFT JOIN sports_user_risk_profiles r ON r.user_id = s.user_id
  WHERE s.device_hash = v_device
  GROUP BY s.user_id, r.tier
  ORDER BY MAX(s.created_at) DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_linked_device_users(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_admin_list_linked_device_users(TEXT, INT) TO authenticated, service_role;
