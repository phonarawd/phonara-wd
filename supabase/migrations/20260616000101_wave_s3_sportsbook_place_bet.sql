-- ============================================================
-- Migration: 20260616000101_wave_s3_sportsbook_place_bet
-- Wave-S3: sports_bets + rpc_place_sports_bet (prematch, combo ≤8)
-- ============================================================

SET search_path = public, pg_temp;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sports_bet_status') THEN
    CREATE TYPE sports_bet_status AS ENUM ('pending', 'won', 'lost', 'void', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sports_leg_status') THEN
    CREATE TYPE sports_leg_status AS ENUM ('pending', 'won', 'lost', 'void');
  END IF;
END;
$$;

INSERT INTO system_accounts (code, currency, description) VALUES
  ('sports_house_phon', 'PHON', 'Sportsbook house counterparty for PHON bets.'),
  ('sports_house_usdt', 'USDT', 'Sportsbook house counterparty for USDT bets.')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS sports_bets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  currency          currency NOT NULL,
  stake             TEXT NOT NULL
    CONSTRAINT sb_stake_pos CHECK (stake ~ '^\d+(\.\d+)?$'),
  combined_odds     TEXT NOT NULL
    CONSTRAINT sb_odds_pos CHECK (combined_odds ~ '^\d+(\.\d+)?$' AND combined_odds::NUMERIC > 1),
  potential_payout  TEXT NOT NULL
    CONSTRAINT sb_payout_pos CHECK (potential_payout ~ '^\d+(\.\d+)?$'),
  status            sports_bet_status NOT NULL DEFAULT 'pending',
  idempotency_key   TEXT NOT NULL,
  stake_lock_id     UUID REFERENCES wallet_ledger(id),
  payout_ledger_id  UUID REFERENCES wallet_ledger(id),
  house_transfer_id UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS sb_user_idem_key ON sports_bets (user_id, idempotency_key);
CREATE INDEX IF NOT EXISTS sb_user_created_idx ON sports_bets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sb_status_idx ON sports_bets (status, created_at DESC);

CREATE TABLE IF NOT EXISTS sports_bet_legs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id         UUID NOT NULL REFERENCES sports_bets(id) ON DELETE CASCADE,
  outcome_id     UUID NOT NULL REFERENCES sports_outcomes(id) ON DELETE RESTRICT,
  fixture_id     UUID NOT NULL REFERENCES sports_fixtures(id) ON DELETE RESTRICT,
  odds_at_bet    TEXT NOT NULL
    CONSTRAINT sbl_odds_pos CHECK (odds_at_bet ~ '^\d+(\.\d+)?$' AND odds_at_bet::NUMERIC > 1),
  leg_status     sports_leg_status NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sbl_bet_idx ON sports_bet_legs (bet_id);
CREATE INDEX IF NOT EXISTS sbl_fixture_idx ON sports_bet_legs (fixture_id, leg_status);

ALTER TABLE sports_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_bet_legs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own read sports_bets" ON sports_bets;
CREATE POLICY "own read sports_bets" ON sports_bets
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "admin read sports_bets" ON sports_bets;
CREATE POLICY "admin read sports_bets" ON sports_bets
  FOR SELECT USING (_is_admin());

DROP POLICY IF EXISTS "own read sports_bet_legs" ON sports_bet_legs;
CREATE POLICY "own read sports_bet_legs" ON sports_bet_legs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sports_bets b WHERE b.id = bet_id AND b.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "admin read sports_bet_legs" ON sports_bet_legs;
CREATE POLICY "admin read sports_bet_legs" ON sports_bet_legs
  FOR SELECT USING (_is_admin());

REVOKE ALL ON sports_bets, sports_bet_legs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON sports_bets, sports_bet_legs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sports_bets, sports_bet_legs TO service_role;

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_place_sports_bet', 20, 0.333, 1, 60)
ON CONFLICT (rpc_name) DO UPDATE
  SET capacity = EXCLUDED.capacity,
      refill_rate = EXCLUDED.refill_rate,
      cost = EXCLUDED.cost,
      window_sec = EXCLUDED.window_sec,
      is_active = TRUE;

CREATE OR REPLACE FUNCTION _sports_odds_max_age_sec()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_odds_snapshot_max_age_sec'), '')::INT,
    300
  );
$$;

REVOKE ALL ON FUNCTION _sports_odds_max_age_sec() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_sports_stake_limits(p_currency currency, p_stake NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_suffix TEXT := lower(p_currency::TEXT);
  v_min NUMERIC;
  v_max NUMERIC;
BEGIN
  v_min := _app_config_numeric('sports_min_stake_' || v_suffix, 0);
  v_max := _app_config_numeric('sports_max_stake_' || v_suffix, 999999999);
  IF p_stake < v_min OR p_stake > v_max THEN
    RAISE EXCEPTION 'stake_out_of_range' USING HINT = p_currency::TEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_sports_stake_limits(currency, NUMERIC) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_sports_payout_cap(p_currency currency, p_payout NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_suffix TEXT := lower(p_currency::TEXT);
  v_max NUMERIC;
BEGIN
  v_max := _app_config_numeric('sports_max_payout_' || v_suffix, 999999999);
  IF p_payout > v_max THEN
    RAISE EXCEPTION 'payout_out_of_range' USING HINT = p_currency::TEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_sports_payout_cap(currency, NUMERIC) FROM PUBLIC, anon, authenticated;

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
  v_client_odds NUMERIC;
  v_combined NUMERIC := 1;
  v_payout NUMERIC;
  v_bet_id UUID := gen_random_uuid();
  v_lock_id UUID;
  v_fixture_id UUID;
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

  IF p_legs IS NULL OR jsonb_typeof(p_legs) <> 'array' THEN
    RAISE EXCEPTION 'invalid_legs';
  END IF;

  v_leg_count := jsonb_array_length(p_legs);
  IF v_leg_count < 1 OR v_leg_count > 8 THEN
    RAISE EXCEPTION 'invalid_leg_count';
  END IF;

  v_max_age := _sports_odds_max_age_sec();

  FOR v_i IN 0 .. v_leg_count - 1 LOOP
    v_leg := p_legs->v_i;
    v_outcome_id := (v_leg->>'outcome_id')::UUID;
    IF v_outcome_id IS NULL THEN RAISE EXCEPTION 'invalid_outcome_id'; END IF;

    SELECT * INTO v_outcome FROM sports_outcomes WHERE id = v_outcome_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'outcome_not_found'; END IF;

    SELECT * INTO v_market FROM sports_markets WHERE id = v_outcome.market_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;
    IF v_market.status <> 'open' THEN RAISE EXCEPTION 'market_not_open'; END IF;

    SELECT * INTO v_fixture FROM sports_fixtures WHERE id = v_market.fixture_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;
    IF v_fixture.status <> 'scheduled' THEN RAISE EXCEPTION 'fixture_not_prematch'; END IF;
    IF v_fixture.kickoff_at <= NOW() THEN RAISE EXCEPTION 'kickoff_passed'; END IF;

    SELECT * INTO v_latest FROM _sports_latest_odds(v_outcome_id);
    IF v_latest.odds IS NULL THEN RAISE EXCEPTION 'odds_unavailable'; END IF;
    IF v_latest.captured_at < NOW() - make_interval(secs => v_max_age) THEN
      RAISE EXCEPTION 'odds_stale';
    END IF;

    v_client_odds := (v_leg->>'odds_at_bet')::NUMERIC;
    IF v_client_odds IS NULL OR v_client_odds <= 1 THEN RAISE EXCEPTION 'invalid_odds_at_bet'; END IF;
    IF v_latest.odds::NUMERIC <> v_client_odds THEN
      RAISE EXCEPTION 'odds_changed'
        USING DETAIL = format('expected=%s client=%s', v_latest.odds, v_leg->>'odds_at_bet');
    END IF;

    v_combined := v_combined * v_client_odds;
  END LOOP;

  v_payout := trunc(v_stake * v_combined, 6);
  PERFORM _assert_sports_payout_cap(v_ccy, v_payout);

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
    VALUES (v_bet_id, v_outcome_id, v_fixture_id, v_leg->>'odds_at_bet');
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

CREATE OR REPLACE FUNCTION rpc_list_my_sports_bets(p_limit INT DEFAULT 50)
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'bet_id', b.id,
    'currency', b.currency,
    'stake', b.stake,
    'combined_odds', b.combined_odds,
    'potential_payout', b.potential_payout,
    'status', b.status,
    'created_at', b.created_at,
    'settled_at', b.settled_at,
    'legs', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'outcome_id', l.outcome_id,
        'fixture_id', l.fixture_id,
        'odds_at_bet', l.odds_at_bet,
        'leg_status', l.leg_status
      ) ORDER BY l.created_at), '[]'::JSONB)
      FROM sports_bet_legs l
      WHERE l.bet_id = b.id
    )
  )
  FROM sports_bets b
  WHERE b.user_id = v_user_id
  ORDER BY b.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
END;
$$;

REVOKE ALL ON FUNCTION rpc_list_my_sports_bets(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_list_my_sports_bets(INT) TO authenticated, service_role;
