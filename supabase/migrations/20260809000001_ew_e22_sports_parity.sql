-- ============================================================
-- Migration: ew_e22_sports_parity
-- E22 Sports parity — odds acceptance · partial cashout · correct_score · catalog
-- EXISTS (migration 0): rpc_cashout_sports_bet · _sports_cashout_offer (do NOT remigrate)
-- Plan: ew-e22-sports-parity-wave · ADR-016
-- ============================================================

SET search_path = public, pg_temp;

-- ─── A. Odds acceptance enum + config ────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE sports_odds_acceptance AS ENUM ('strict', 'accept_any', 'accept_better');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO app_config (key, value, description) VALUES
  (
    'sports_odds_acceptance_default',
    'strict',
    'E22 — default odds acceptance when rpc_place_sports_bet p_odds_acceptance is NULL.'
  )
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION _sports_resolve_place_odds(
  p_client_odds TEXT,
  p_latest_odds TEXT,
  p_policy sports_odds_acceptance
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_policy = 'strict'::sports_odds_acceptance THEN
    IF NOT _sports_odds_exact_match(p_latest_odds, p_client_odds) THEN
      RAISE EXCEPTION 'odds_changed'
        USING DETAIL = format('expected=%s client=%s', p_latest_odds, p_client_odds);
    END IF;
    RETURN p_latest_odds;
  ELSIF p_policy = 'accept_any'::sports_odds_acceptance THEN
    RETURN p_latest_odds;
  ELSIF p_policy = 'accept_better'::sports_odds_acceptance THEN
    IF p_latest_odds::NUMERIC >= p_client_odds::NUMERIC THEN
      RETURN p_latest_odds;
    END IF;
    RAISE EXCEPTION 'odds_changed'
      USING DETAIL = format('expected>=%s latest=%s', p_client_odds, p_latest_odds);
  END IF;

  RAISE EXCEPTION 'invalid_odds_acceptance';
END;
$$;

REVOKE ALL ON FUNCTION _sports_resolve_place_odds(TEXT, TEXT, sports_odds_acceptance)
  FROM PUBLIC, anon, authenticated;

-- Drop prior PIR signature then recreate with p_odds_acceptance (NEW only).
DROP FUNCTION IF EXISTS rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION rpc_place_sports_bet(
  p_legs             JSONB,
  p_stake            TEXT,
  p_currency         TEXT,
  p_idempotency_key  TEXT,
  p_device_hash      TEXT DEFAULT NULL,
  p_ip_hash          TEXT DEFAULT NULL,
  p_bet_kind         TEXT DEFAULT NULL,
  p_odds_acceptance  TEXT DEFAULT NULL
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
  v_resolved TEXT;
  v_resolved_odds TEXT[] := '{}';
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
  v_dup JSONB;
  v_policy_text TEXT;
  v_policy sports_odds_acceptance;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  v_dup := _pir_sports_bet_already_placed(v_user_id, p_idempotency_key);
  IF v_dup IS NOT NULL THEN
    RETURN v_dup;
  END IF;

  PERFORM _assert_sports_user_risk_allowed(v_user_id);
  PERFORM _assert_sports_device_signals(v_user_id, p_device_hash, p_ip_hash);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_place_sports_bet');
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('sports');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_stake);

  v_policy_text := NULLIF(btrim(COALESCE(p_odds_acceptance, '')), '');
  IF v_policy_text IS NULL THEN
    v_policy_text := COALESCE(
      NULLIF(btrim((SELECT value FROM app_config WHERE key = 'sports_odds_acceptance_default')), ''),
      'strict'
    );
  END IF;
  BEGIN
    v_policy := lower(v_policy_text)::sports_odds_acceptance;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_odds_acceptance';
  END;

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

  -- M2: anti-arb delay BEFORE acquiring fixture row locks
  IF _sports_any_live_leg(p_legs) THEN
    PERFORM _sports_live_acceptance_delay(v_user_id, v_ccy, v_stake, TRUE);
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

    v_resolved := _sports_resolve_place_odds(v_client_odds, v_latest.odds, v_policy);
    v_resolved_odds := array_append(v_resolved_odds, v_resolved);

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

    v_combined := v_combined * v_resolved::NUMERIC;
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

  v_lock_id := _lock_wallet_internal(
    v_user_id,
    v_ccy,
    _fmt6(v_stake),
    'sports_stake_lock',
    'sbet_lock:' || v_user_id::TEXT || ':' || p_idempotency_key
  );

  BEGIN
    INSERT INTO sports_bets (
      id, user_id, currency, stake, combined_odds, potential_payout,
      status, idempotency_key, stake_lock_id, bet_kind
    ) VALUES (
      v_bet_id, v_user_id, v_ccy, _fmt6(v_stake), _fmt6(v_combined), _fmt6(v_payout),
      'pending', p_idempotency_key, v_lock_id, v_kind
    );
  EXCEPTION WHEN unique_violation THEN
    v_dup := _pir_sports_bet_already_placed(v_user_id, p_idempotency_key);
    IF v_dup IS NULL THEN
      RAISE;
    END IF;
    RETURN v_dup;
  END;

  FOR v_i IN 0 .. v_leg_count - 1 LOOP
    v_leg := p_legs->v_i;
    v_outcome_id := (v_leg->>'outcome_id')::UUID;

    SELECT m.fixture_id INTO v_fixture_id
    FROM sports_outcomes o
    JOIN sports_markets m ON m.id = o.market_id
    WHERE o.id = v_outcome_id;

    INSERT INTO sports_bet_legs (bet_id, outcome_id, fixture_id, odds_at_bet)
    VALUES (v_bet_id, v_outcome_id, v_fixture_id, v_resolved_odds[v_i + 1]);
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

REVOKE ALL ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

-- ─── B. Partial cashout (NEW RPCs — leave full cashout intact) ───────────────

ALTER TABLE sports_bets
  ADD COLUMN IF NOT EXISTS original_stake TEXT,
  ADD COLUMN IF NOT EXISTS partial_cashout_total TEXT NOT NULL DEFAULT '0.000000';

COMMENT ON COLUMN sports_bets.original_stake IS
  'E22 — stake at first partial cashout; NULL until first partial.';
COMMENT ON COLUMN sports_bets.partial_cashout_total IS
  'E22 — cumulative partial cashout offers credited to user.';

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_preview_sports_partial_cashout', 60, 1, 1, 60),
  ('rpc_partial_cashout_sports_bet', 20, 0.333, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

CREATE OR REPLACE FUNCTION rpc_preview_sports_partial_cashout(
  p_bet_id UUID,
  p_stake_portion TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_bet sports_bets%ROWTYPE;
  v_portion NUMERIC;
  v_stake NUMERIC;
  v_full_offer NUMERIC;
  v_portion_offer NUMERIC;
  v_remaining NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_preview_sports_partial_cashout');

  SELECT * INTO v_bet FROM sports_bets WHERE id = p_bet_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'bet_not_found'; END IF;
  IF v_bet.user_id <> v_user_id AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF v_bet.status <> 'pending' THEN
    RAISE EXCEPTION 'bet_not_pending';
  END IF;

  PERFORM _assert_amount_text(p_stake_portion);
  v_portion := p_stake_portion::NUMERIC;
  v_stake := v_bet.stake::NUMERIC;
  IF v_portion <= 0 OR v_portion >= v_stake THEN
    RAISE EXCEPTION 'invalid_stake_portion'
      USING DETAIL = 'portion must be strictly between 0 and current stake; use full cashout for entire stake';
  END IF;

  v_full_offer := _sports_cashout_offer(p_bet_id);
  IF v_full_offer IS NULL THEN
    RAISE EXCEPTION 'cashout_unavailable';
  END IF;

  v_portion_offer := trunc(v_full_offer * v_portion / v_stake, 6);
  v_remaining := trunc(v_stake - v_portion, 6);

  RETURN jsonb_build_object(
    'bet_id', p_bet_id,
    'stake_portion', _fmt6(v_portion),
    'cashout_amount', _fmt6(v_portion_offer),
    'currency', v_bet.currency,
    'remaining_stake', _fmt6(v_remaining),
    'potential_payout', _fmt6(trunc(v_remaining * v_bet.combined_odds::NUMERIC, 6))
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_preview_sports_partial_cashout(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_preview_sports_partial_cashout(UUID, TEXT)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_partial_cashout_sports_bet(
  p_bet_id UUID,
  p_stake_portion TEXT,
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
  v_portion NUMERIC;
  v_stake NUMERIC;
  v_full_offer NUMERIC;
  v_portion_offer NUMERIC;
  v_client NUMERIC;
  v_remaining NUMERIC;
  v_house_account TEXT;
  v_transfer_id UUID := gen_random_uuid();
  v_unlock_id UUID;
  v_debit_id UUID;
  v_credit_id UUID;
  v_house NUMERIC;
  v_portion_key TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  PERFORM _enforce_rate_limit(v_user_id, 'rpc_partial_cashout_sports_bet');

  SELECT * INTO v_bet FROM sports_bets WHERE id = p_bet_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'bet_not_found'; END IF;
  IF v_bet.user_id <> v_user_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF v_bet.status <> 'pending' THEN RAISE EXCEPTION 'bet_not_pending'; END IF;

  PERFORM _assert_amount_text(p_stake_portion);
  v_portion := p_stake_portion::NUMERIC;
  v_stake := v_bet.stake::NUMERIC;
  IF v_portion <= 0 OR v_portion >= v_stake THEN
    RAISE EXCEPTION 'invalid_stake_portion'
      USING DETAIL = 'portion must be strictly between 0 and current stake; use full cashout for entire stake';
  END IF;

  v_full_offer := _sports_cashout_offer(p_bet_id);
  IF v_full_offer IS NULL OR v_full_offer <= 0 THEN
    RAISE EXCEPTION 'cashout_unavailable';
  END IF;

  v_portion_offer := trunc(v_full_offer * v_portion / v_stake, 6);
  PERFORM _assert_amount_text(p_cashout_amount);
  v_client := p_cashout_amount::NUMERIC;
  IF trunc(v_client, 6) <> trunc(v_portion_offer, 6) THEN
    RAISE EXCEPTION 'cashout_amount_changed'
      USING DETAIL = format('expected=%s client=%s', _fmt6(v_portion_offer), p_cashout_amount);
  END IF;

  v_remaining := trunc(v_stake - v_portion, 6);
  v_portion_key := _fmt6(v_portion);
  v_house_account := CASE
    WHEN v_bet.currency = 'PHON' THEN 'sports_house_phon'
    ELSE 'sports_house_usdt'
  END;
  v_house := v_portion - v_client;

  v_unlock_id := _unlock_wallet_internal(
    v_bet.user_id, v_bet.currency, _fmt6(v_portion),
    'sports_stake_unlock',
    'sbet_pcashout_unlock:' || p_bet_id::TEXT || ':' || v_portion_key
  );
  v_debit_id := _debit_wallet_internal(
    v_bet.user_id, v_bet.currency, _fmt6(v_portion),
    'sports_stake_cashout',
    'sbet_pcashout_debit:' || p_bet_id::TEXT || ':' || v_portion_key
  );
  v_credit_id := _credit_wallet_internal(
    v_bet.user_id, v_bet.currency, _fmt6(v_client),
    'sports_cashout',
    'sbet_pcashout:' || p_bet_id::TEXT || ':' || v_portion_key || ':' || p_idempotency_key
  );

  IF v_house >= 0 THEN
    PERFORM _credit_system_account(
      v_house_account, _fmt6(v_house), 'sports_house_cashout',
      v_bet.user_id,
      p_bet_id::TEXT || ':partial:' || v_portion_key,
      v_transfer_id
    );
  ELSE
    PERFORM _debit_system_account(
      v_house_account, _fmt6(abs(v_house)), 'sports_house_cashout',
      v_bet.user_id,
      p_bet_id::TEXT || ':partial:' || v_portion_key,
      v_transfer_id
    );
  END IF;

  UPDATE sports_bets SET
    original_stake = COALESCE(original_stake, stake),
    stake = _fmt6(v_remaining),
    potential_payout = _fmt6(trunc(v_remaining * combined_odds::NUMERIC, 6)),
    partial_cashout_total = _fmt6(
      COALESCE(NULLIF(partial_cashout_total, ''), '0')::NUMERIC + v_client
    )
  WHERE id = p_bet_id;

  RETURN jsonb_build_object(
    'bet_id', p_bet_id,
    'status', 'pending',
    'cashout_amount', _fmt6(v_client),
    'remaining_stake', _fmt6(v_remaining),
    'partial', TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_partial_cashout_sports_bet(UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_partial_cashout_sports_bet(UUID, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

-- ─── C. Correct score market catalog + settle ────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'sports_selection' AND e.enumlabel = 'score'
  ) THEN
    ALTER TYPE sports_selection ADD VALUE 'score';
  END IF;
END;
$$;

INSERT INTO sports_market_type_registry (market_type, category, settle_handler, description) VALUES
  ('correct_score', 'score', 'correct_score', 'Exact final score (selection=score, line=H-A)')
ON CONFLICT (market_type) DO NOTHING;

CREATE OR REPLACE FUNCTION _sports_settle_correct_score_legs(
  p_fixture_id UUID,
  p_home_goals INT,
  p_away_goals INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_line TEXT := format('%s-%s', p_home_goals, p_away_goals);
  v_updated INT := 0;
BEGIN
  UPDATE sports_bet_legs l
  SET leg_status = CASE
    WHEN o.selection = 'score'::sports_selection
      AND o.line = v_line THEN 'won'::sports_leg_status
    ELSE 'lost'::sports_leg_status
  END
  FROM sports_outcomes o
  JOIN sports_markets m ON m.id = o.market_id
  WHERE l.outcome_id = o.id
    AND l.fixture_id = p_fixture_id
    AND l.leg_status = 'pending'
    AND m.market_type = 'correct_score'
    AND o.selection = 'score'::sports_selection;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION _sports_settle_correct_score_legs(UUID, INT, INT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_settle_all_score_markets(
  p_fixture_id UUID,
  p_home_goals INT,
  p_away_goals INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total INT := p_home_goals + p_away_goals;
BEGIN
  RETURN jsonb_build_object(
    'match_1x2', _sports_settle_match_1x2_legs(p_fixture_id, p_home_goals, p_away_goals),
    'totals', _sports_settle_totals_legs(p_fixture_id, v_total),
    'spread', _sports_settle_spread_legs(p_fixture_id, p_home_goals, p_away_goals, FALSE),
    'asian_handicap', _sports_settle_spread_legs(p_fixture_id, p_home_goals, p_away_goals, TRUE),
    'btts', _sports_settle_btts_legs(p_fixture_id, p_home_goals, p_away_goals),
    'correct_score', _sports_settle_correct_score_legs(p_fixture_id, p_home_goals, p_away_goals)
  );
END;
$$;

REVOKE ALL ON FUNCTION _sports_settle_all_score_markets(UUID, INT, INT)
  FROM PUBLIC, anon, authenticated;

-- ─── D. Sport catalog ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sports_sport_catalog (
  sport_code   TEXT PRIMARY KEY,
  i18n_key     TEXT NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INT NOT NULL DEFAULT 100,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO sports_sport_catalog (sport_code, i18n_key, enabled, sort_order) VALUES
  ('football', 'sports.catalog.football', TRUE, 10),
  ('soccer', 'sports.catalog.football', TRUE, 15),
  ('basketball', 'sports.catalog.basketball', TRUE, 20),
  ('american_football', 'sports.catalog.american_football', TRUE, 30),
  ('baseball', 'sports.catalog.baseball', TRUE, 40),
  ('tennis', 'sports.catalog.tennis', TRUE, 50),
  ('default', 'sports.catalog.default', FALSE, 999)
ON CONFLICT (sport_code) DO NOTHING;

ALTER TABLE sports_sport_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role all sports_sport_catalog" ON sports_sport_catalog;
CREATE POLICY "service_role all sports_sport_catalog" ON sports_sport_catalog
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "authenticated read sports_sport_catalog" ON sports_sport_catalog;
CREATE POLICY "authenticated read sports_sport_catalog" ON sports_sport_catalog
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "anon read sports_sport_catalog" ON sports_sport_catalog;
CREATE POLICY "anon read sports_sport_catalog" ON sports_sport_catalog
  FOR SELECT USING (TRUE);

REVOKE ALL ON sports_sport_catalog FROM PUBLIC, anon, authenticated;
GRANT SELECT ON sports_sport_catalog TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sports_sport_catalog TO service_role;

CREATE OR REPLACE FUNCTION rpc_list_sports_catalog()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'sport_code', sport_code,
        'i18n_key', i18n_key,
        'enabled', enabled,
        'sort_order', sort_order
      )
      ORDER BY sort_order, sport_code
    ),
    '[]'::JSONB
  )
  FROM sports_sport_catalog
  WHERE enabled;
$$;

REVOKE ALL ON FUNCTION rpc_list_sports_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_list_sports_catalog()
  TO authenticated, anon, service_role;
