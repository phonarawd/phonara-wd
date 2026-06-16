-- ============================================================
-- Migration: 20260616000108_wave_s13_sportsbook_anti_arb_defense
-- Wave-S13: anti-arbitrage · hedge block · liability · risk tiers
-- ============================================================

SET search_path = public, pg_temp;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sports_risk_tier') THEN
    CREATE TYPE sports_risk_tier AS ENUM ('normal', 'restricted', 'sharp', 'banned');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS sports_user_risk_profiles (
  user_id           UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tier              sports_risk_tier NOT NULL DEFAULT 'normal',
  stake_multiplier  NUMERIC NOT NULL DEFAULT 1
    CONSTRAINT surp_stake_mult CHECK (stake_multiplier > 0 AND stake_multiplier <= 1),
  live_delay_ms     INT NOT NULL DEFAULT 0
    CONSTRAINT surp_live_delay CHECK (live_delay_ms >= 0 AND live_delay_ms <= 120000),
  notes             TEXT,
  updated_by        UUID REFERENCES profiles(id),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sports_risk_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  detail      JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sre_user_created_idx ON sports_risk_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sre_type_created_idx ON sports_risk_events (event_type, created_at DESC);

ALTER TABLE sports_user_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_risk_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read sports_user_risk_profiles" ON sports_user_risk_profiles;
CREATE POLICY "admin read sports_user_risk_profiles" ON sports_user_risk_profiles
  FOR SELECT USING (_is_admin());
DROP POLICY IF EXISTS "service_role all sports_user_risk_profiles" ON sports_user_risk_profiles;
CREATE POLICY "service_role all sports_user_risk_profiles" ON sports_user_risk_profiles
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin read sports_risk_events" ON sports_risk_events;
CREATE POLICY "admin read sports_risk_events" ON sports_risk_events
  FOR SELECT USING (_is_admin());
DROP POLICY IF EXISTS "service_role all sports_risk_events" ON sports_risk_events;
CREATE POLICY "service_role all sports_risk_events" ON sports_risk_events
  FOR ALL USING (auth.role() = 'service_role');

REVOKE ALL ON sports_user_risk_profiles, sports_risk_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON sports_user_risk_profiles, sports_risk_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sports_user_risk_profiles, sports_risk_events TO service_role;

INSERT INTO app_config (key, value, description) VALUES
  ('sports_min_implied_sum', '1.030000', 'Min sum(1/odds) per market — below = arb/surebet; auto-suspend.'),
  ('sports_odds_velocity_ms', '2000', 'If odds change within this ms window, suspend market briefly.'),
  ('sports_velocity_suspend_ms', '10000', 'Auto-suspend duration on rapid odds movement.'),
  ('sports_outcome_liability_cap_phon', '250000.000000', 'Max pending payout exposure per outcome PHON.'),
  ('sports_outcome_liability_cap_usdt', '25000.000000', 'Max pending payout exposure per outcome USDT.'),
  ('sports_user_max_daily_bets', '500', 'Max sports bets per user per UTC day.'),
  ('sports_user_max_daily_stake_phon', '500000.000000', 'Max aggregate sports stake per user per day PHON.'),
  ('sports_user_max_daily_stake_usdt', '50000.000000', 'Max aggregate sports stake per user per day USDT.'),
  ('sports_large_stake_threshold_phon', '5000.000000', 'Live acceptance delay threshold PHON.'),
  ('sports_large_stake_threshold_usdt', '500.000000', 'Live acceptance delay threshold USDT.'),
  ('sports_large_stake_live_delay_ms', '5000', 'Extra live bet delay for large stakes (ms).'),
  ('sports_risk_restricted_stake_mult', '0.500000', 'Default stake multiplier for restricted tier.'),
  ('sports_risk_sharp_stake_mult', '0.250000', 'Default stake multiplier for sharp tier.'),
  ('sports_risk_sharp_live_delay_ms', '8000', 'Default live delay ms for sharp tier.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_place_sports_bet', 15, 0.25, 1, 60)
ON CONFLICT (rpc_name) DO UPDATE
  SET capacity = LEAST(rpc_rate_limit_configs.capacity, EXCLUDED.capacity),
      refill_rate = LEAST(rpc_rate_limit_configs.refill_rate, EXCLUDED.refill_rate),
      is_active = TRUE;

CREATE OR REPLACE FUNCTION _sports_log_risk_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_detail JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO sports_risk_events (user_id, event_type, detail)
  VALUES (p_user_id, p_event_type, COALESCE(p_detail, '{}'::JSONB));
END;
$$;

REVOKE ALL ON FUNCTION _sports_log_risk_event(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_user_risk_profile(p_user_id UUID)
RETURNS sports_user_risk_profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row sports_user_risk_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM sports_user_risk_profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    v_row.user_id := p_user_id;
    v_row.tier := 'normal';
    v_row.stake_multiplier := 1;
    v_row.live_delay_ms := 0;
  END IF;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION _sports_user_risk_profile(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_sports_user_risk_allowed(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile sports_user_risk_profiles;
BEGIN
  v_profile := _sports_user_risk_profile(p_user_id);
  IF v_profile.tier = 'banned' THEN
    PERFORM _sports_log_risk_event(p_user_id, 'bet_blocked_banned', jsonb_build_object('tier', v_profile.tier));
    RAISE EXCEPTION 'sports_user_banned';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_sports_user_risk_allowed(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_sports_risk_stake_cap(
  p_user_id UUID,
  p_currency currency,
  p_stake NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile sports_user_risk_profiles;
  v_suffix TEXT := lower(p_currency::TEXT);
  v_max NUMERIC;
  v_effective_max NUMERIC;
BEGIN
  v_profile := _sports_user_risk_profile(p_user_id);
  v_max := _app_config_numeric('sports_max_stake_' || v_suffix, 999999999);
  v_effective_max := trunc(v_max * v_profile.stake_multiplier, 6);

  IF p_stake > v_effective_max THEN
    PERFORM _sports_log_risk_event(
      p_user_id,
      'bet_blocked_stake_tier',
      jsonb_build_object(
        'tier', v_profile.tier,
        'stake', p_stake,
        'effective_max', v_effective_max,
        'currency', p_currency::TEXT
      )
    );
    RAISE EXCEPTION 'stake_out_of_range' USING HINT = p_currency::TEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_sports_risk_stake_cap(UUID, currency, NUMERIC) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_sports_no_market_hedge(p_user_id UUID, p_market_id UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing UUID;
BEGIN
  SELECT l.id INTO v_existing
  FROM sports_bet_legs l
  JOIN sports_bets b ON b.id = l.bet_id
  JOIN sports_outcomes o ON o.id = l.outcome_id
  WHERE b.user_id = p_user_id
    AND b.status = 'pending'
    AND l.leg_status = 'pending'
    AND o.market_id = p_market_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    PERFORM _sports_log_risk_event(
      p_user_id,
      'bet_blocked_market_hedge',
      jsonb_build_object('market_id', p_market_id)
    );
    RAISE EXCEPTION 'market_hedge_blocked';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_sports_no_market_hedge(UUID, UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_sports_outcome_liability(
  p_outcome_id UUID,
  p_currency currency,
  p_new_payout NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_suffix TEXT := lower(p_currency::TEXT);
  v_cap NUMERIC;
  v_pending NUMERIC;
BEGIN
  v_cap := _app_config_numeric('sports_outcome_liability_cap_' || v_suffix, 999999999);

  SELECT COALESCE(SUM(b.potential_payout::NUMERIC), 0)
    INTO v_pending
    FROM sports_bet_legs l
    JOIN sports_bets b ON b.id = l.bet_id
   WHERE l.outcome_id = p_outcome_id
     AND b.status = 'pending'
     AND l.leg_status = 'pending'
     AND b.currency = p_currency;

  IF v_pending + p_new_payout > v_cap THEN
    RAISE EXCEPTION 'outcome_liability_cap' USING HINT = p_outcome_id::TEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_sports_outcome_liability(UUID, currency, NUMERIC) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_sports_user_daily_limits(
  p_user_id UUID,
  p_currency currency,
  p_stake NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_day_start TIMESTAMPTZ := date_trunc('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_max_bets INT;
  v_max_stake NUMERIC;
  v_bet_count INT;
  v_stake_sum NUMERIC;
  v_suffix TEXT := lower(p_currency::TEXT);
BEGIN
  v_max_bets := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_user_max_daily_bets'), '')::INT,
    500
  );
  v_max_stake := _app_config_numeric('sports_user_max_daily_stake_' || v_suffix, 999999999);

  SELECT COUNT(*), COALESCE(SUM(stake::NUMERIC), 0)
    INTO v_bet_count, v_stake_sum
    FROM sports_bets
   WHERE user_id = p_user_id
     AND currency = p_currency
     AND created_at >= v_day_start;

  IF v_bet_count >= v_max_bets THEN
    PERFORM _sports_log_risk_event(p_user_id, 'bet_blocked_daily_bet_count', jsonb_build_object('count', v_bet_count));
    RAISE EXCEPTION 'daily_bet_limit';
  END IF;

  IF v_stake_sum + p_stake > v_max_stake THEN
    PERFORM _sports_log_risk_event(
      p_user_id,
      'bet_blocked_daily_stake',
      jsonb_build_object('stake_sum', v_stake_sum, 'new_stake', p_stake)
    );
    RAISE EXCEPTION 'daily_stake_limit';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_sports_user_daily_limits(UUID, currency, NUMERIC) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_live_acceptance_delay(
  p_user_id UUID,
  p_currency currency,
  p_stake NUMERIC,
  p_is_live BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile sports_user_risk_profiles;
  v_suffix TEXT := lower(p_currency::TEXT);
  v_threshold NUMERIC;
  v_delay_ms INT := 0;
BEGIN
  IF NOT p_is_live THEN
    RETURN;
  END IF;

  v_profile := _sports_user_risk_profile(p_user_id);
  v_threshold := _app_config_numeric('sports_large_stake_threshold_' || v_suffix, 999999999);

  IF p_stake >= v_threshold THEN
    v_delay_ms := GREATEST(
      v_delay_ms,
      COALESCE(NULLIF((SELECT value FROM app_config WHERE key = 'sports_large_stake_live_delay_ms'), '')::INT, 5000)
    );
  END IF;

  IF v_profile.tier = 'sharp' THEN
    v_delay_ms := GREATEST(
      v_delay_ms,
      v_profile.live_delay_ms,
      COALESCE(NULLIF((SELECT value FROM app_config WHERE key = 'sports_risk_sharp_live_delay_ms'), '')::INT, 8000)
    );
  ELSE
    v_delay_ms := GREATEST(v_delay_ms, v_profile.live_delay_ms);
  END IF;

  IF v_delay_ms > 0 THEN
    PERFORM pg_sleep(v_delay_ms::NUMERIC / 1000.0);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _sports_live_acceptance_delay(UUID, currency, NUMERIC, BOOLEAN) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_guard_market_after_odds(p_outcome_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_market_id UUID;
  v_implied_sum NUMERIC := 0;
  v_outcome_count INT := 0;
  v_min_sum NUMERIC;
  v_velocity_ms INT;
  v_suspend_ms INT;
  v_prev_odds TEXT;
  v_prev_at TIMESTAMPTZ;
  v_curr_odds TEXT;
  v_curr_at TIMESTAMPTZ;
  v_until TIMESTAMPTZ;
BEGIN
  SELECT o.market_id INTO v_market_id
  FROM sports_outcomes o
  WHERE o.id = p_outcome_id;

  IF v_market_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(1.0 / lo.odds::NUMERIC), 0)
    INTO v_outcome_count, v_implied_sum
    FROM sports_outcomes o
    JOIN LATERAL (
      SELECT s.odds
      FROM sports_odds_snapshots s
      WHERE s.outcome_id = o.id
      ORDER BY s.captured_at DESC
      LIMIT 1
    ) lo ON lo.odds IS NOT NULL
   WHERE o.market_id = v_market_id;

  v_min_sum := _app_config_numeric('sports_min_implied_sum', 1.03);

  IF v_outcome_count >= 2 AND v_implied_sum < v_min_sum THEN
    v_until := NOW() + make_interval(secs => 30);
    UPDATE sports_markets SET
      status = 'suspended',
      suspended_until = GREATEST(COALESCE(suspended_until, NOW()), v_until),
      suspend_reason = 'arb_implied_sum',
      updated_at = NOW()
    WHERE id = v_market_id;
    RETURN;
  END IF;

  v_velocity_ms := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_odds_velocity_ms'), '')::INT,
    2000
  );
  v_suspend_ms := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_velocity_suspend_ms'), '')::INT,
    10000
  );

  SELECT odds, captured_at INTO v_curr_odds, v_curr_at
  FROM sports_odds_snapshots
  WHERE outcome_id = p_outcome_id
  ORDER BY captured_at DESC
  LIMIT 1;

  SELECT odds, captured_at INTO v_prev_odds, v_prev_at
  FROM sports_odds_snapshots
  WHERE outcome_id = p_outcome_id
  ORDER BY captured_at DESC
  OFFSET 1
  LIMIT 1;

  IF v_prev_odds IS NOT NULL
     AND v_curr_odds IS NOT NULL
     AND v_prev_odds <> v_curr_odds
     AND EXTRACT(EPOCH FROM (v_curr_at - v_prev_at)) * 1000 < v_velocity_ms THEN
    v_until := NOW() + make_interval(secs => (v_suspend_ms::NUMERIC / 1000.0));
    UPDATE sports_markets SET
      suspended_until = GREATEST(COALESCE(suspended_until, NOW()), v_until),
      suspend_reason = 'odds_velocity',
      updated_at = NOW()
    WHERE id = v_market_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _sports_guard_market_after_odds(UUID) FROM PUBLIC, anon, authenticated;

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
        fixture_id, canonical_market_id, market_type, status, updated_at
      ) VALUES (
        v_fixture_id,
        v_market->>'marketId',
        COALESCE(v_market->>'marketType', 'unknown'),
        COALESCE((v_market->>'status')::sports_market_status, 'open'),
        NOW()
      )
      ON CONFLICT (canonical_market_id) DO UPDATE SET
        fixture_id = EXCLUDED.fixture_id,
        market_type = EXCLUDED.market_type,
        status = EXCLUDED.status,
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
    SELECT o.id INTO v_outcome_id
    FROM sports_outcomes o
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
    UPDATE sports_fixtures
    SET status = 'cancelled', updated_at = NOW()
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

CREATE OR REPLACE FUNCTION rpc_place_sports_bet(
  p_legs            JSONB,
  p_stake           TEXT,
  p_currency        TEXT,
  p_idempotency_key TEXT
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

  RETURN jsonb_build_object(
    'bet_id', v_bet_id,
    'status', 'pending',
    'combined_odds', _fmt6(v_combined),
    'potential_payout', _fmt6(v_payout),
    'already_placed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_set_sports_risk_tier(
  p_user_id UUID,
  p_tier TEXT,
  p_reason TEXT,
  p_stake_multiplier TEXT DEFAULT NULL,
  p_live_delay_ms INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tier sports_risk_tier;
  v_mult NUMERIC;
  v_delay INT;
  v_actor UUID := auth.uid();
BEGIN
  IF v_actor IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  BEGIN
    v_tier := lower(btrim(p_tier))::sports_risk_tier;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_tier';
  END;

  v_mult := CASE v_tier
    WHEN 'restricted' THEN _app_config_numeric('sports_risk_restricted_stake_mult', 0.5)
    WHEN 'sharp' THEN _app_config_numeric('sports_risk_sharp_stake_mult', 0.25)
    WHEN 'banned' THEN 0.000001
    ELSE 1
  END;

  IF p_stake_multiplier IS NOT NULL AND btrim(p_stake_multiplier) <> '' THEN
    v_mult := LEAST(1, GREATEST(0, p_stake_multiplier::NUMERIC));
  END IF;

  v_delay := COALESCE(p_live_delay_ms, 0);
  IF v_tier = 'sharp' AND p_live_delay_ms IS NULL THEN
    v_delay := COALESCE(
      NULLIF((SELECT value FROM app_config WHERE key = 'sports_risk_sharp_live_delay_ms'), '')::INT,
      8000
    );
  END IF;

  INSERT INTO sports_user_risk_profiles (
    user_id, tier, stake_multiplier, live_delay_ms, notes, updated_by, updated_at
  ) VALUES (
    p_user_id, v_tier, v_mult, v_delay, p_reason, v_actor, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    stake_multiplier = EXCLUDED.stake_multiplier,
    live_delay_ms = EXCLUDED.live_delay_ms,
    notes = EXCLUDED.notes,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    v_actor, 'sports_risk_tier_set', 'profiles', p_user_id,
    jsonb_build_object(
      'tier', v_tier::TEXT,
      'stake_multiplier', v_mult,
      'live_delay_ms', v_delay,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'tier', v_tier::TEXT,
    'stake_multiplier', v_mult,
    'live_delay_ms', v_delay
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_set_sports_risk_tier(UUID, TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_set_sports_risk_tier(UUID, TEXT, TEXT, TEXT, INT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_list_sports_risk_events(p_limit INT DEFAULT 100)
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
    'id', e.id,
    'user_id', e.user_id,
    'event_type', e.event_type,
    'detail', e.detail,
    'created_at', e.created_at
  )
  FROM sports_risk_events e
  ORDER BY e.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500));
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_sports_risk_events(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_admin_list_sports_risk_events(INT) TO authenticated, service_role;
