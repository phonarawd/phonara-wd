-- ============================================================
-- Migration: 20260616000111_wave_s16_s22_sportsbook_world_engine
-- Wave S16–S22: live TTL · cashout · SGP · system · props · admin desk
-- ============================================================

SET search_path = public, pg_temp;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sports_bet_kind') THEN
    CREATE TYPE sports_bet_kind AS ENUM ('single', 'combo', 'sgp', 'system');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'sports_bet_status' AND e.enumlabel = 'cashed_out'
  ) THEN
    ALTER TYPE sports_bet_status ADD VALUE 'cashed_out';
  END IF;
END;
$$;

ALTER TABLE sports_bets
  ADD COLUMN IF NOT EXISTS bet_kind sports_bet_kind NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS system_group_id UUID,
  ADD COLUMN IF NOT EXISTS system_line_index INT,
  ADD COLUMN IF NOT EXISTS cashout_amount TEXT,
  ADD COLUMN IF NOT EXISTS cashed_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cashout_ledger_id UUID REFERENCES wallet_ledger(id);

CREATE INDEX IF NOT EXISTS sb_system_group_idx ON sports_bets (system_group_id)
  WHERE system_group_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS sports_live_ttl_by_sport (
  sport_code           TEXT PRIMARY KEY,
  prematch_max_age_sec INT NOT NULL DEFAULT 300,
  live_max_age_sec     INT NOT NULL DEFAULT 15,
  live_delay_ms        INT NOT NULL DEFAULT 0
);

INSERT INTO sports_live_ttl_by_sport (sport_code, prematch_max_age_sec, live_max_age_sec, live_delay_ms) VALUES
  ('football', 300, 15, 0),
  ('soccer', 300, 15, 0),
  ('basketball', 180, 8, 500),
  ('american_football', 300, 12, 1000),
  ('baseball', 300, 20, 1500),
  ('tennis', 120, 5, 0),
  ('default', 300, 15, 0)
ON CONFLICT (sport_code) DO NOTHING;

INSERT INTO app_config (key, value, description) VALUES
  ('sports_cashout_margin', '0.050000', 'House margin on cashout offer (5%).'),
  ('sports_sgp_max_legs', '12', 'Max legs for same-game parlay.'),
  ('sports_system_max_lines', '128', 'Max system combination lines per ticket.'),
  ('sports_system_max_legs', '16', 'Max legs in a system bet.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO sports_market_type_registry (market_type, category, settle_handler, description) VALUES
  ('prop_over_under', 'prop', 'prop_ou', 'Player/team prop over/under'),
  ('prop_yes_no', 'prop', 'prop_yes_no', 'Player/team prop yes/no')
ON CONFLICT (market_type) DO NOTHING;

ALTER TABLE sports_live_ttl_by_sport ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read sports_live_ttl_by_sport" ON sports_live_ttl_by_sport;
CREATE POLICY "read sports_live_ttl_by_sport" ON sports_live_ttl_by_sport
  FOR SELECT USING (TRUE);
REVOKE ALL ON sports_live_ttl_by_sport FROM PUBLIC, anon, authenticated;
GRANT SELECT ON sports_live_ttl_by_sport TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON sports_live_ttl_by_sport TO service_role;

CREATE OR REPLACE FUNCTION _sports_league_sport_code(p_league_code TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_league_code IN ('nba', 'kbl') THEN 'basketball'
    WHEN p_league_code IN ('nfl', 'ncaaf') THEN 'american_football'
    WHEN p_league_code IN ('mlb', 'kbo', 'npb') THEN 'baseball'
    WHEN p_league_code IN ('epl', 'k-league', 'bundesliga', 'la-liga', 'serie-a', 'ligue-1', 'ucl', 'mls', 'j-league') THEN 'football'
    ELSE 'default'
  END;
$$;

REVOKE ALL ON FUNCTION _sports_league_sport_code(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_odds_max_age_for_fixture(p_fixture_id UUID, p_is_live BOOLEAN)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_league TEXT;
  v_sport TEXT;
  v_row sports_live_ttl_by_sport%ROWTYPE;
BEGIN
  SELECT league_code INTO v_league FROM sports_fixtures WHERE id = p_fixture_id;
  v_sport := _sports_league_sport_code(COALESCE(v_league, 'default'));
  SELECT * INTO v_row FROM sports_live_ttl_by_sport WHERE sport_code = v_sport;
  IF NOT FOUND THEN
    SELECT * INTO v_row FROM sports_live_ttl_by_sport WHERE sport_code = 'default';
  END IF;
  IF p_is_live THEN
    RETURN v_row.live_max_age_sec;
  END IF;
  RETURN v_row.prematch_max_age_sec;
END;
$$;

REVOKE ALL ON FUNCTION _sports_odds_max_age_for_fixture(UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_cashout_offer(p_bet_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bet sports_bets%ROWTYPE;
  v_leg RECORD;
  v_product NUMERIC := 1;
  v_margin NUMERIC;
  v_offer NUMERIC;
  v_latest RECORD;
BEGIN
  SELECT * INTO v_bet FROM sports_bets WHERE id = p_bet_id;
  IF NOT FOUND OR v_bet.status <> 'pending' THEN
    RETURN NULL;
  END IF;

  v_margin := _app_config_numeric('sports_cashout_margin', 0.05);

  FOR v_leg IN
    SELECT l.leg_status, l.odds_at_bet, l.outcome_id
    FROM sports_bet_legs l
    WHERE l.bet_id = p_bet_id
    ORDER BY l.created_at
  LOOP
    IF v_leg.leg_status = 'won' THEN
      v_product := v_product * v_leg.odds_at_bet::NUMERIC;
    ELSIF v_leg.leg_status = 'void' THEN
      v_product := v_product * 1;
    ELSIF v_leg.leg_status = 'pending' THEN
      SELECT * INTO v_latest FROM _sports_latest_odds(v_leg.outcome_id);
      IF v_latest.odds IS NULL THEN
        RETURN NULL;
      END IF;
      v_product := v_product * v_latest.odds::NUMERIC;
    ELSE
      RETURN 0;
    END IF;
  END LOOP;

  v_offer := trunc(v_bet.stake::NUMERIC * v_product * (1 - v_margin), 6);
  IF v_offer <= 0 THEN
    RETURN 0;
  END IF;
  IF v_offer > v_bet.potential_payout::NUMERIC THEN
    v_offer := v_bet.potential_payout::NUMERIC;
  END IF;
  RETURN v_offer;
END;
$$;

REVOKE ALL ON FUNCTION _sports_cashout_offer(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_preview_sports_cashout(p_bet_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_bet sports_bets%ROWTYPE;
  v_offer NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  SELECT * INTO v_bet FROM sports_bets WHERE id = p_bet_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'bet_not_found'; END IF;
  IF v_bet.user_id <> v_user_id AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF v_bet.status <> 'pending' THEN
    RAISE EXCEPTION 'bet_not_pending';
  END IF;

  v_offer := _sports_cashout_offer(p_bet_id);
  IF v_offer IS NULL THEN
    RAISE EXCEPTION 'cashout_unavailable';
  END IF;

  RETURN jsonb_build_object(
    'bet_id', p_bet_id,
    'cashout_amount', _fmt6(v_offer),
    'currency', v_bet.currency,
    'potential_payout', v_bet.potential_payout
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_preview_sports_cashout(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_preview_sports_cashout(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_cashout_sports_bet(
  p_bet_id UUID,
  p_cashout_amount TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_bet sports_bets%ROWTYPE;
  v_offer NUMERIC;
  v_client NUMERIC;
  v_house_account TEXT;
  v_transfer_id UUID := gen_random_uuid();
  v_unlock_id UUID;
  v_debit_id UUID;
  v_credit_id UUID;
  v_house NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  SELECT * INTO v_bet FROM sports_bets WHERE id = p_bet_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'bet_not_found'; END IF;
  IF v_bet.user_id <> v_user_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF v_bet.status <> 'pending' THEN RAISE EXCEPTION 'bet_not_pending'; END IF;

  v_offer := _sports_cashout_offer(p_bet_id);
  IF v_offer IS NULL OR v_offer <= 0 THEN
    RAISE EXCEPTION 'cashout_unavailable';
  END IF;

  PERFORM _assert_amount_text(p_cashout_amount);
  v_client := p_cashout_amount::NUMERIC;
  IF trunc(v_client, 6) <> trunc(v_offer, 6) THEN
    RAISE EXCEPTION 'cashout_amount_changed'
      USING DETAIL = format('expected=%s client=%s', _fmt6(v_offer), p_cashout_amount);
  END IF;

  v_house_account := CASE WHEN v_bet.currency = 'PHON' THEN 'sports_house_phon' ELSE 'sports_house_usdt' END;
  v_house := v_bet.stake::NUMERIC - v_client;

  v_unlock_id := _unlock_wallet_internal(
    v_bet.user_id, v_bet.currency, v_bet.stake,
    'sports_stake_unlock', 'sbet_cashout_unlock:' || p_bet_id::TEXT
  );
  v_debit_id := _debit_wallet_internal(
    v_bet.user_id, v_bet.currency, v_bet.stake,
    'sports_stake_cashout', 'sbet_cashout_debit:' || p_bet_id::TEXT
  );
  v_credit_id := _credit_wallet_internal(
    v_bet.user_id, v_bet.currency, _fmt6(v_client),
    'sports_cashout', 'sbet_cashout:' || p_bet_id::TEXT || ':' || p_idempotency_key
  );

  IF v_house >= 0 THEN
    PERFORM _credit_system_account(
      v_house_account, _fmt6(v_house), 'sports_house_cashout',
      v_bet.user_id, p_bet_id::TEXT, v_transfer_id
    );
  ELSE
    PERFORM _debit_system_account(
      v_house_account, _fmt6(abs(v_house)), 'sports_house_cashout',
      v_bet.user_id, p_bet_id::TEXT, v_transfer_id
    );
  END IF;

  UPDATE sports_bet_legs SET leg_status = 'void'
  WHERE bet_id = p_bet_id AND leg_status = 'pending';

  UPDATE sports_bets SET
    status = 'cashed_out',
    cashout_amount = _fmt6(v_client),
    cashed_out_at = NOW(),
    cashout_ledger_id = v_credit_id,
    house_transfer_id = v_transfer_id,
    settled_at = NOW(),
    potential_payout = _fmt6(v_client)
  WHERE id = p_bet_id;

  RETURN jsonb_build_object(
    'bet_id', p_bet_id,
    'status', 'cashed_out',
    'cashout_amount', _fmt6(v_client)
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_cashout_sports_bet(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_cashout_sports_bet(UUID, TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION _sports_system_combinations(p_n INT, p_k INT)
RETURNS INT[][]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_result INT[][] := '{}';
  v_combo INT[];
  v_i INT;
  v_start INT;
BEGIN
  IF p_k < 1 OR p_k > p_n THEN
    RETURN v_result;
  END IF;

  IF p_k = 1 THEN
    FOR v_i IN 0 .. p_n - 1 LOOP
      v_result := array_append(v_result, ARRAY[v_i]);
    END LOOP;
    RETURN v_result;
  END IF;

  FOR v_i IN 0 .. p_n - p_k LOOP
    FOREACH v_combo SLICE 1 IN ARRAY _sports_system_combinations(p_n - v_i - 1, p_k - 1) LOOP
      v_result := array_append(v_result, ARRAY[v_i] || v_combo);
    END LOOP;
  END LOOP;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION _sports_system_combinations(INT, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_settle_sports_prop_outcomes(
  p_market_id UUID,
  p_winning_outcome_ids UUID[],
  p_reason TEXT DEFAULT 'prop_result'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_market sports_markets%ROWTYPE;
  v_bet_id UUID;
  v_updated INT := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO v_market FROM sports_markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  UPDATE sports_markets SET status = 'closed', updated_at = NOW()
  WHERE id = p_market_id;

  UPDATE sports_bet_legs l
  SET leg_status = CASE
    WHEN l.outcome_id = ANY(p_winning_outcome_ids) THEN 'won'::sports_leg_status
    ELSE 'lost'::sports_leg_status
  END
  WHERE l.outcome_id IN (SELECT id FROM sports_outcomes WHERE market_id = p_market_id)
    AND l.leg_status = 'pending';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  FOR v_bet_id IN
    SELECT DISTINCT l.bet_id
    FROM sports_bet_legs l
    JOIN sports_outcomes o ON o.id = l.outcome_id
    WHERE o.market_id = p_market_id
  LOOP
    PERFORM _finalize_sports_bet(v_bet_id);
  END LOOP;

  IF auth.uid() IS NOT NULL THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (auth.uid(), 'sports_prop_settle', 'sports_markets', p_market_id,
      jsonb_build_object('reason', p_reason, 'legs_updated', v_updated));
  END IF;

  RETURN jsonb_build_object('market_id', p_market_id, 'legs_updated', v_updated);
END;
$$;

REVOKE ALL ON FUNCTION rpc_settle_sports_prop_outcomes(UUID, UUID[], TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_settle_sports_prop_outcomes(UUID, UUID[], TEXT) TO service_role;

CREATE OR REPLACE FUNCTION rpc_admin_suspend_sports_market(
  p_market_id UUID,
  p_duration_ms INT,
  p_reason TEXT DEFAULT 'admin_suspend'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_until TIMESTAMPTZ := NOW() + make_interval(secs => (GREATEST(p_duration_ms, 0)::NUMERIC / 1000.0));
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  UPDATE sports_markets SET
    suspended_until = GREATEST(COALESCE(suspended_until, NOW()), v_until),
    suspend_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_market_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'sports_market_suspend', 'sports_markets', p_market_id,
    jsonb_build_object('duration_ms', p_duration_ms, 'reason', p_reason));

  RETURN jsonb_build_object('market_id', p_market_id, 'suspended_until', v_until);
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_suspend_sports_market(UUID, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_admin_suspend_sports_market(UUID, INT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_list_sports_exposure(p_currency TEXT DEFAULT NULL)
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'currency', b.currency,
    'pending_bets', COUNT(*),
    'pending_stake', COALESCE(SUM(b.stake::NUMERIC), 0),
    'pending_liability', COALESCE(SUM(b.potential_payout::NUMERIC), 0)
  )
  FROM sports_bets b
  WHERE b.status = 'pending'
    AND (p_currency IS NULL OR b.currency::TEXT = upper(btrim(p_currency)))
  GROUP BY b.currency;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_sports_exposure(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_admin_list_sports_exposure(TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_list_outcome_liability(
  p_outcome_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_currency currency;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  RETURN jsonb_build_object(
    'outcome_id', p_outcome_id,
    'rows', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'bet_id', b.id,
        'user_id', b.user_id,
        'currency', b.currency,
        'potential_payout', b.potential_payout,
        'stake', b.stake,
        'created_at', b.created_at
      ) ORDER BY b.created_at DESC)
      FROM sports_bet_legs l
      JOIN sports_bets b ON b.id = l.bet_id
      WHERE l.outcome_id = p_outcome_id AND b.status = 'pending'
      LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))
    ), '[]'::JSONB)
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_outcome_liability(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_admin_list_outcome_liability(UUID, INT) TO authenticated, service_role;

-- Replace place-bet with bet_kind / SGP / sport TTL (S14 6-arg → 7-arg)
DROP FUNCTION IF EXISTS rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION rpc_place_sports_bet(
  p_legs            JSONB,
  p_stake           TEXT,
  p_currency        TEXT,
  p_idempotency_key TEXT,
  p_device_hash     TEXT DEFAULT NULL,
  p_ip_hash         TEXT DEFAULT NULL,
  p_bet_kind        TEXT DEFAULT NULL
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
  v_sgp_fixture UUID;
  v_seen_outcomes UUID[] := '{}';
  v_seen_fixtures UUID[] := '{}';
  v_is_live BOOLEAN;
  v_leg_outcomes UUID[] := '{}';
  v_kind sports_bet_kind;
  v_max_legs INT := 8;
  v_sgp_max INT;
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
      'bet_kind', v_existing.bet_kind,
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
  v_sgp_max := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_sgp_max_legs'), '')::INT,
    12
  );

  IF p_bet_kind IS NULL OR btrim(p_bet_kind) = '' THEN
    v_kind := CASE
      WHEN v_leg_count = 1 THEN 'single'::sports_bet_kind
      ELSE 'combo'::sports_bet_kind
    END;
  ELSE
    BEGIN
      v_kind := lower(btrim(p_bet_kind))::sports_bet_kind;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'invalid_bet_kind';
    END;
  END IF;

  v_max_legs := CASE WHEN v_kind = 'sgp' THEN v_sgp_max ELSE 8 END;
  IF v_leg_count < 1 OR v_leg_count > v_max_legs THEN
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
    END IF;
    v_max_age := _sports_odds_max_age_for_fixture(v_fixture.id, v_is_live);

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

    IF v_kind = 'sgp' THEN
      IF v_sgp_fixture IS NULL THEN
        v_sgp_fixture := v_fixture.id;
      ELSIF v_sgp_fixture <> v_fixture.id THEN
        RAISE EXCEPTION 'sgp_fixture_mismatch';
      END IF;
    ELSIF v_kind = 'combo' AND v_leg_count > 1 AND v_fixture.id = ANY(v_seen_fixtures) THEN
      RAISE EXCEPTION 'duplicate_fixture';
    END IF;
    v_seen_fixtures := array_append(v_seen_fixtures, v_fixture.id);

    v_combined := v_combined * v_client_odds::NUMERIC;
    v_leg_outcomes := array_append(v_leg_outcomes, v_outcome_id);
  END LOOP;

  IF v_kind = 'sgp' AND v_leg_count < 2 THEN
    RAISE EXCEPTION 'sgp_min_legs';
  END IF;

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
    status, idempotency_key, stake_lock_id, bet_kind
  ) VALUES (
    v_bet_id, v_user_id, v_ccy, _fmt6(v_stake), _fmt6(v_combined), _fmt6(v_payout),
    'pending', p_idempotency_key, v_lock_id, v_kind
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
    'bet_kind', v_kind,
    'combined_odds', _fmt6(v_combined),
    'potential_payout', _fmt6(v_payout),
    'already_placed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_place_sports_system_bet(
  p_legs            JSONB,
  p_system_sizes    INT[],
  p_stake_per_line  TEXT,
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
  v_ccy currency;
  v_stake_line NUMERIC;
  v_leg_count INT;
  v_group_id UUID := gen_random_uuid();
  v_max_legs INT;
  v_max_lines INT;
  v_size INT;
  v_combos INT[][];
  v_combo INT[];
  v_combo_legs JSONB;
  v_i INT;
  v_j INT;
  v_line_idx INT := 0;
  v_result JSONB := '[]'::JSONB;
  v_place JSONB;
  v_idem TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  v_max_legs := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_system_max_legs'), '')::INT,
    16
  );
  v_max_lines := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_system_max_lines'), '')::INT,
    128
  );

  v_leg_count := jsonb_array_length(p_legs);
  IF v_leg_count < 2 OR v_leg_count > v_max_legs THEN
    RAISE EXCEPTION 'invalid_leg_count';
  END IF;
  IF p_system_sizes IS NULL OR array_length(p_system_sizes, 1) IS NULL THEN
    RAISE EXCEPTION 'invalid_system_sizes';
  END IF;

  BEGIN
    v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_currency';
  END;

  PERFORM _assert_amount_text(p_stake_per_line);
  v_stake_line := p_stake_per_line::NUMERIC;
  IF v_stake_line <= 0 THEN RAISE EXCEPTION 'invalid_stake'; END IF;

  FOREACH v_size IN ARRAY p_system_sizes LOOP
    IF v_size < 1 OR v_size > v_leg_count THEN
      RAISE EXCEPTION 'invalid_system_size';
    END IF;
    v_combos := _sports_system_combinations(v_leg_count, v_size);
    IF array_length(v_combos, 1) IS NULL THEN
      CONTINUE;
    END IF;
    IF v_line_idx + array_length(v_combos, 1) > v_max_lines THEN
      RAISE EXCEPTION 'system_too_many_lines';
    END IF;

    FOREACH v_combo SLICE 1 IN ARRAY v_combos LOOP
      v_line_idx := v_line_idx + 1;
      v_combo_legs := '[]'::JSONB;
      FOR v_j IN 1 .. array_length(v_combo, 1) LOOP
        v_combo_legs := v_combo_legs || jsonb_build_array(p_legs->v_combo[v_j]);
      END LOOP;
      v_idem := p_idempotency_key || ':sys:' || v_line_idx::TEXT;
      v_place := rpc_place_sports_bet(
        v_combo_legs,
        _fmt6(v_stake_line),
        p_currency,
        v_idem,
        p_device_hash,
        p_ip_hash,
        CASE WHEN array_length(v_combo, 1) = 1 THEN 'single' ELSE 'combo' END
      );
      UPDATE sports_bets SET
        bet_kind = 'system',
        system_group_id = v_group_id,
        system_line_index = v_line_idx
      WHERE id = (v_place->>'bet_id')::UUID;
      v_result := v_result || jsonb_build_array(v_place);
    END LOOP;
  END LOOP;

  IF v_line_idx = 0 THEN
    RAISE EXCEPTION 'system_no_lines';
  END IF;

  RETURN jsonb_build_object(
    'system_group_id', v_group_id,
    'lines', v_line_idx,
    'bets', v_result
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_sports_system_bet(JSONB, INT[], TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_sports_system_bet(JSONB, INT[], TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_void_sports_fixture_dead_heat(
  p_fixture_id UUID,
  p_market_id UUID,
  p_reason TEXT DEFAULT 'dead_heat'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bet_id UUID;
  v_updated INT := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  UPDATE sports_bet_legs l
  SET leg_status = 'void'
  FROM sports_outcomes o
  WHERE l.outcome_id = o.id
    AND o.market_id = p_market_id
    AND l.fixture_id = p_fixture_id
    AND l.leg_status = 'pending';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  FOR v_bet_id IN
    SELECT DISTINCT l.bet_id
    FROM sports_bet_legs l
    JOIN sports_outcomes o ON o.id = l.outcome_id
    WHERE o.market_id = p_market_id AND l.fixture_id = p_fixture_id
  LOOP
    PERFORM _finalize_sports_bet(v_bet_id);
  END LOOP;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'sports_dead_heat_void', 'sports_fixtures', p_fixture_id,
    jsonb_build_object('market_id', p_market_id, 'reason', p_reason, 'legs_voided', v_updated));

  RETURN jsonb_build_object('fixture_id', p_fixture_id, 'market_id', p_market_id, 'legs_voided', v_updated);
END;
$$;

REVOKE ALL ON FUNCTION rpc_void_sports_fixture_dead_heat(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_void_sports_fixture_dead_heat(UUID, UUID, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION _sports_map_selection(p_name TEXT)
RETURNS sports_selection
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v TEXT := lower(btrim(COALESCE(p_name, '')));
BEGIN
  IF v IN ('draw', 'x', 'tie') THEN RETURN 'draw'; END IF;
  IF v IN ('yes', 'y') THEN RETURN 'yes'; END IF;
  IF v IN ('no', 'n') THEN RETURN 'no'; END IF;
  IF v LIKE '%over%' THEN RETURN 'over'; END IF;
  IF v LIKE '%under%' THEN RETURN 'under'; END IF;
  IF v LIKE '%away%' THEN RETURN 'away'; END IF;
  RETURN 'home';
END;
$$;

CREATE OR REPLACE FUNCTION rpc_ingest_sports_c1(p_message JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type TEXT := p_message->>'type';
  v_fixture_id UUID;
  v_market_id UUID;
  v_outcome_id UUID;
  v_fixture JSONB;
  v_markets JSONB;
  v_market JSONB;
  v_outcome JSONB;
  v_i INT;
  v_j INT;
BEGIN
  IF v_type IS NULL THEN
    RAISE EXCEPTION 'invalid_ingest_message';
  END IF;

  IF v_type = 'event_upsert' THEN
    v_fixture := p_message->'fixture';
    v_markets := p_message->'markets';

    INSERT INTO sports_fixtures (
      canonical_fixture_id, league_code, home_name, away_name,
      kickoff_at, status, source_vendor, updated_at
    ) VALUES (
      v_fixture->>'fixtureId',
      COALESCE(v_fixture->>'leagueCode', 'unknown'),
      COALESCE(v_fixture->>'homeName', 'Home'),
      COALESCE(v_fixture->>'awayName', 'Away'),
      (v_fixture->>'kickoffAt')::TIMESTAMPTZ,
      COALESCE((v_fixture->>'status')::sports_fixture_status, 'scheduled'),
      split_part(v_fixture->>'fixtureId', ':', 1),
      NOW()
    )
    ON CONFLICT (canonical_fixture_id) DO UPDATE SET
      league_code = EXCLUDED.league_code,
      home_name = EXCLUDED.home_name,
      away_name = EXCLUDED.away_name,
      kickoff_at = EXCLUDED.kickoff_at,
      status = EXCLUDED.status,
      source_vendor = EXCLUDED.source_vendor,
      updated_at = NOW()
    RETURNING id INTO v_fixture_id;

    FOR v_i IN 0 .. COALESCE(jsonb_array_length(v_markets), 0) - 1 LOOP
      v_market := v_markets->v_i;

      INSERT INTO sports_markets (
        fixture_id, canonical_market_id, market_type, status, line, period, prop_key, prop_meta, updated_at
      ) VALUES (
        v_fixture_id,
        v_market->>'marketId',
        COALESCE(v_market->>'marketType', 'unknown'),
        COALESCE((v_market->>'status')::sports_market_status, 'open'),
        NULLIF(v_market->>'line', ''),
        COALESCE(NULLIF(v_market->>'period', ''), 'full'),
        NULLIF(v_market->>'propKey', ''),
        COALESCE(v_market->'propMeta', '{}'::JSONB),
        NOW()
      )
      ON CONFLICT (canonical_market_id) DO UPDATE SET
        fixture_id = EXCLUDED.fixture_id,
        market_type = EXCLUDED.market_type,
        status = EXCLUDED.status,
        line = COALESCE(EXCLUDED.line, sports_markets.line),
        period = EXCLUDED.period,
        prop_key = COALESCE(EXCLUDED.prop_key, sports_markets.prop_key),
        prop_meta = CASE
          WHEN EXCLUDED.prop_meta = '{}'::JSONB THEN sports_markets.prop_meta
          ELSE EXCLUDED.prop_meta
        END,
        updated_at = NOW()
      RETURNING id INTO v_market_id;

      FOR v_j IN 0 .. COALESCE(jsonb_array_length(v_market->'outcomes'), 0) - 1 LOOP
        v_outcome := v_market->'outcomes'->v_j;

        INSERT INTO sports_outcomes (
          market_id, canonical_outcome_id, selection, line
        ) VALUES (
          v_market_id,
          v_outcome->>'outcomeId',
          COALESCE(
            NULLIF(v_outcome->>'selection', '')::sports_selection,
            _sports_map_selection(v_outcome->>'selection')
          ),
          v_outcome->>'line'
        )
        ON CONFLICT (canonical_outcome_id) DO UPDATE SET
          market_id = EXCLUDED.market_id,
          selection = EXCLUDED.selection,
          line = EXCLUDED.line
        RETURNING id INTO v_outcome_id;
      END LOOP;
    END LOOP;

    RETURN jsonb_build_object('type', v_type, 'fixture_id', v_fixture_id);

  ELSIF v_type = 'odds_upsert' THEN
    SELECT o.id, m.id INTO v_outcome_id, v_market_id
    FROM sports_outcomes o
    JOIN sports_markets m ON m.id = o.market_id
    WHERE o.canonical_outcome_id = p_message->>'outcomeId';

    IF v_outcome_id IS NULL THEN
      RAISE EXCEPTION 'outcome_not_found' USING HINT = p_message->>'outcomeId';
    END IF;

    INSERT INTO sports_odds_snapshots (outcome_id, odds, captured_at, source_vendor)
    VALUES (
      v_outcome_id,
      p_message->>'odds',
      COALESCE((p_message->>'capturedAt')::TIMESTAMPTZ, NOW()),
      split_part(p_message->>'outcomeId', ':', 1)
    );

    PERFORM _sports_guard_market_after_odds(v_outcome_id);

    RETURN jsonb_build_object('type', v_type, 'outcome_id', v_outcome_id);

  ELSIF v_type = 'event_remove' THEN
    UPDATE sports_fixtures SET status = 'void', updated_at = NOW()
    WHERE canonical_fixture_id = p_message->>'fixtureId';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'fixture_not_found' USING HINT = p_message->>'fixtureId';
    END IF;

    RETURN jsonb_build_object('type', v_type, 'fixture_id', p_message->>'fixtureId');

  ELSE
    RAISE EXCEPTION 'unsupported_ingest_type' USING HINT = v_type;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION rpc_ingest_sports_c1(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_ingest_sports_c1(JSONB) TO service_role;
