-- ============================================================
-- Migration: 20260616000104_wave_s6_sportsbook_major_hardening
-- Wave-S6: OU 2.5 settle · parlay rules · suspend · exposure · admin
-- ============================================================

SET search_path = public, pg_temp;

ALTER TABLE sports_fixtures
  ADD COLUMN IF NOT EXISTS result_home_goals INT,
  ADD COLUMN IF NOT EXISTS result_away_goals INT,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspend_reason TEXT;

ALTER TABLE sports_markets
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspend_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS sbl_bet_outcome_unique
  ON sports_bet_legs (bet_id, outcome_id);

INSERT INTO app_config (key, value, description) VALUES
  ('sports_house_exposure_cap_phon', '5000000.000000', 'Max aggregate pending sports payout exposure PHON.'),
  ('sports_house_exposure_cap_usdt', '500000.000000', 'Max aggregate pending sports payout exposure USDT.'),
  ('sports_live_odds_max_age_sec', '15', 'Max odds snapshot age for in-play place (S5).'),
  ('sports_suspend_default_ms', '8000', 'Default market suspend window on live events.')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION _sports_odds_exact_match(p_server TEXT, p_client TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trunc(p_server::NUMERIC, 6) = trunc(p_client::NUMERIC, 6);
$$;

CREATE OR REPLACE FUNCTION _assert_sports_house_exposure(p_currency currency, p_new_payout NUMERIC)
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
  v_cap := _app_config_numeric('sports_house_exposure_cap_' || v_suffix, 999999999);
  SELECT COALESCE(SUM(potential_payout::NUMERIC), 0)
    INTO v_pending
    FROM sports_bets
   WHERE status = 'pending' AND currency = p_currency;

  IF v_pending + p_new_payout > v_cap THEN
    RAISE EXCEPTION 'house_exposure_cap' USING HINT = p_currency::TEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_sports_house_exposure(currency, NUMERIC) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_assert_market_placeable(p_market_id UUID, p_fixture_id UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_market sports_markets%ROWTYPE;
  v_fixture sports_fixtures%ROWTYPE;
BEGIN
  SELECT * INTO v_market FROM sports_markets WHERE id = p_market_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;
  IF v_market.status <> 'open' THEN RAISE EXCEPTION 'market_not_open'; END IF;
  IF v_market.suspended_until IS NOT NULL AND v_market.suspended_until > NOW() THEN
    RAISE EXCEPTION 'market_suspended';
  END IF;

  SELECT * INTO v_fixture FROM sports_fixtures WHERE id = p_fixture_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;
  IF v_fixture.suspended_until IS NOT NULL AND v_fixture.suspended_until > NOW() THEN
    RAISE EXCEPTION 'market_suspended';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _sports_assert_market_placeable(UUID, UUID) FROM PUBLIC, anon, authenticated;

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
  END LOOP;

  v_payout := trunc(v_stake * v_combined, 6);
  PERFORM _assert_sports_payout_cap(v_ccy, v_payout);
  PERFORM _assert_sports_house_exposure(v_ccy, v_payout);

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

CREATE OR REPLACE FUNCTION _sports_settle_totals_legs(
  p_fixture_id UUID,
  p_total_goals INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated INT := 0;
BEGIN
  UPDATE sports_bet_legs l
  SET leg_status = CASE
    WHEN o.selection = 'over' AND p_total_goals > 2 THEN 'won'::sports_leg_status
    WHEN o.selection = 'under' AND p_total_goals < 3 THEN 'won'::sports_leg_status
    WHEN o.selection = 'over' AND p_total_goals < 3 THEN 'lost'::sports_leg_status
    WHEN o.selection = 'under' AND p_total_goals >= 3 THEN 'lost'::sports_leg_status
    ELSE 'void'::sports_leg_status
  END
  FROM sports_outcomes o
  JOIN sports_markets m ON m.id = o.market_id
  WHERE l.outcome_id = o.id
    AND l.fixture_id = p_fixture_id
    AND l.leg_status = 'pending'
    AND m.market_type = 'totals_2_5';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION _sports_settle_totals_legs(UUID, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_settle_sports_fixture_scores(
  p_fixture_id  UUID,
  p_home_goals  INT,
  p_away_goals  INT,
  p_reason      TEXT DEFAULT 'ft_result'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fixture sports_fixtures%ROWTYPE;
  v_selection sports_selection;
  v_1x2_updated INT := 0;
  v_totals_updated INT := 0;
  v_bet_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF p_home_goals < 0 OR p_away_goals < 0 THEN
    RAISE EXCEPTION 'invalid_score';
  END IF;

  SELECT * INTO v_fixture FROM sports_fixtures WHERE id = p_fixture_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;
  IF v_fixture.status = 'finished' AND v_fixture.result_home_goals IS NOT NULL THEN
    RETURN jsonb_build_object(
      'fixture_id', p_fixture_id,
      'already_settled', TRUE,
      'home_goals', v_fixture.result_home_goals,
      'away_goals', v_fixture.result_away_goals
    );
  END IF;

  v_selection := CASE
    WHEN p_home_goals > p_away_goals THEN 'home'::sports_selection
    WHEN p_home_goals < p_away_goals THEN 'away'::sports_selection
    ELSE 'draw'::sports_selection
  END;

  UPDATE sports_fixtures SET
    status = 'finished',
    result_home_goals = p_home_goals,
    result_away_goals = p_away_goals,
    updated_at = NOW()
  WHERE id = p_fixture_id;

  UPDATE sports_markets SET status = 'closed', updated_at = NOW()
  WHERE fixture_id = p_fixture_id AND status <> 'closed';

  UPDATE sports_bet_legs l
  SET leg_status = CASE
    WHEN o.selection = v_selection THEN 'won'::sports_leg_status
    ELSE 'lost'::sports_leg_status
  END
  FROM sports_outcomes o
  JOIN sports_markets m ON m.id = o.market_id
  WHERE l.outcome_id = o.id
    AND l.fixture_id = p_fixture_id
    AND l.leg_status = 'pending'
    AND m.market_type = 'match_1x2';

  GET DIAGNOSTICS v_1x2_updated = ROW_COUNT;
  v_totals_updated := _sports_settle_totals_legs(p_fixture_id, p_home_goals + p_away_goals);

  FOR v_bet_id IN
    SELECT DISTINCT l.bet_id FROM sports_bet_legs l WHERE l.fixture_id = p_fixture_id
  LOOP
    PERFORM _finalize_sports_bet(v_bet_id);
  END LOOP;

  IF auth.uid() IS NOT NULL THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (auth.uid(), 'sports_fixture_settle_scores', 'sports_fixtures', p_fixture_id,
      jsonb_build_object(
        'home_goals', p_home_goals,
        'away_goals', p_away_goals,
        'reason', p_reason,
        'legs_1x2', v_1x2_updated,
        'legs_totals', v_totals_updated
      ));
  END IF;

  RETURN jsonb_build_object(
    'fixture_id', p_fixture_id,
    'home_goals', p_home_goals,
    'away_goals', p_away_goals,
    'match_1x2_result', v_selection::TEXT,
    'legs_1x2_updated', v_1x2_updated,
    'legs_totals_updated', v_totals_updated
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_settle_sports_fixture_scores(UUID, INT, INT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_settle_sports_fixture_scores(UUID, INT, INT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION rpc_suspend_sports_fixture(
  p_fixture_id UUID,
  p_duration_ms INT,
  p_reason TEXT DEFAULT 'live_event'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_until TIMESTAMPTZ := NOW() + make_interval(secs => (GREATEST(p_duration_ms, 0)::NUMERIC / 1000.0));
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  UPDATE sports_fixtures SET
    suspended_until = GREATEST(COALESCE(suspended_until, NOW()), v_until),
    suspend_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_fixture_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;

  UPDATE sports_markets SET
    suspended_until = GREATEST(COALESCE(suspended_until, NOW()), v_until),
    suspend_reason = p_reason,
    updated_at = NOW()
  WHERE fixture_id = p_fixture_id AND status = 'open';

  RETURN jsonb_build_object('fixture_id', p_fixture_id, 'suspended_until', v_until);
END;
$$;

REVOKE ALL ON FUNCTION rpc_suspend_sports_fixture(UUID, INT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_suspend_sports_fixture(UUID, INT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION rpc_admin_list_unsettled_sports_fixtures(p_limit INT DEFAULT 100)
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
    'fixture_id', f.id,
    'league_code', f.league_code,
    'home_name', f.home_name,
    'away_name', f.away_name,
    'kickoff_at', f.kickoff_at,
    'status', f.status,
    'pending_bets', (
      SELECT COUNT(DISTINCT l.bet_id)
      FROM sports_bet_legs l
      JOIN sports_bets b ON b.id = l.bet_id
      WHERE l.fixture_id = f.id AND b.status = 'pending'
    )
  )
  FROM sports_fixtures f
  WHERE f.status IN ('scheduled', 'live')
    AND f.kickoff_at < NOW() - INTERVAL '2 hours'
  ORDER BY f.kickoff_at ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500));
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_unsettled_sports_fixtures(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_admin_list_unsettled_sports_fixtures(INT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_get_sports_bet(p_bet_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_bet sports_bets%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  SELECT * INTO v_bet FROM sports_bets WHERE id = p_bet_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'bet_not_found'; END IF;
  IF v_bet.user_id <> v_user_id AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  RETURN jsonb_build_object(
    'bet_id', v_bet.id,
    'currency', v_bet.currency,
    'stake', v_bet.stake,
    'combined_odds', v_bet.combined_odds,
    'potential_payout', v_bet.potential_payout,
    'status', v_bet.status,
    'created_at', v_bet.created_at,
    'settled_at', v_bet.settled_at,
    'legs', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'outcome_id', l.outcome_id,
        'fixture_id', l.fixture_id,
        'odds_at_bet', l.odds_at_bet,
        'leg_status', l.leg_status,
        'home_name', f.home_name,
        'away_name', f.away_name,
        'market_type', m.market_type,
        'selection', o.selection
      ) ORDER BY l.created_at), '[]'::JSONB)
      FROM sports_bet_legs l
      JOIN sports_outcomes o ON o.id = l.outcome_id
      JOIN sports_markets m ON m.id = o.market_id
      JOIN sports_fixtures f ON f.id = l.fixture_id
      WHERE l.bet_id = v_bet.id
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_sports_bet(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_get_sports_bet(UUID) TO authenticated, service_role;
