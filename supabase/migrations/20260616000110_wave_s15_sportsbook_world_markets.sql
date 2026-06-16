-- ============================================================
-- Migration: 20260616000110_wave_s15_sportsbook_world_markets
-- Wave-S15: Bet365/1xBet-grade market registry + multi-market settle
-- ============================================================

SET search_path = public, pg_temp;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'sports_selection' AND e.enumlabel = 'yes'
  ) THEN
    ALTER TYPE sports_selection ADD VALUE 'yes';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'sports_selection' AND e.enumlabel = 'no'
  ) THEN
    ALTER TYPE sports_selection ADD VALUE 'no';
  END IF;
END;
$$;

ALTER TABLE sports_markets
  ADD COLUMN IF NOT EXISTS line TEXT,
  ADD COLUMN IF NOT EXISTS period TEXT NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS prop_key TEXT,
  ADD COLUMN IF NOT EXISTS prop_meta JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE TABLE IF NOT EXISTS sports_market_type_registry (
  market_type     TEXT PRIMARY KEY,
  category        TEXT NOT NULL,
  settle_handler  TEXT NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  description     TEXT
);

INSERT INTO sports_market_type_registry (market_type, category, settle_handler, description) VALUES
  ('match_1x2', 'match', 'match_1x2', 'Full-time 1X2'),
  ('totals_2_5', 'totals', 'totals', 'Legacy OU 2.5'),
  ('totals', 'totals', 'totals', 'Generic over/under with market.line'),
  ('spread', 'spread', 'spread', 'Point spread / handicap'),
  ('handicap', 'spread', 'spread', 'Alias for spread'),
  ('asian_handicap', 'spread', 'asian_handicap', 'Asian handicap with push'),
  ('btts', 'match', 'btts', 'Both teams to score'),
  ('both_teams_score', 'match', 'btts', 'Alias for BTTS')
ON CONFLICT (market_type) DO NOTHING;

CREATE OR REPLACE FUNCTION _sports_market_total_line(
  p_market_type TEXT,
  p_market_line TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_match TEXT[];
BEGIN
  IF p_market_line IS NOT NULL AND btrim(p_market_line) <> '' THEN
    RETURN p_market_line::NUMERIC;
  END IF;

  IF p_market_type = 'totals_2_5' THEN
    RETURN 2.5;
  END IF;

  IF p_market_type ~ '^totals_[0-9]+(_[0-9]+)?$' THEN
    v_match := regexp_match(p_market_type, '^totals_([0-9]+)_([0-9]+)$');
    IF v_match IS NOT NULL THEN
      RETURN (v_match[1] || '.' || v_match[2])::NUMERIC;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION _sports_market_total_line(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_spread_margin(
  p_selection sports_selection,
  p_line NUMERIC,
  p_home_goals INT,
  p_away_goals INT
)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_selection = 'home'::sports_selection THEN (p_home_goals::NUMERIC + p_line) - p_away_goals::NUMERIC
    WHEN p_selection = 'away'::sports_selection THEN (p_away_goals::NUMERIC + p_line) - p_home_goals::NUMERIC
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION _sports_spread_margin(sports_selection, NUMERIC, INT, INT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_leg_result_from_margin(p_margin NUMERIC, p_line NUMERIC)
RETURNS sports_leg_status
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_margin IS NULL THEN
    RETURN 'void'::sports_leg_status;
  END IF;
  IF p_margin > 0 THEN
    RETURN 'won'::sports_leg_status;
  END IF;
  IF p_margin < 0 THEN
    RETURN 'lost'::sports_leg_status;
  END IF;
  IF p_line IS NOT NULL AND p_line = trunc(p_line) THEN
    RETURN 'void'::sports_leg_status;
  END IF;
  RETURN 'void'::sports_leg_status;
END;
$$;

REVOKE ALL ON FUNCTION _sports_leg_result_from_margin(NUMERIC, NUMERIC)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_settle_match_1x2_legs(
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
  v_selection sports_selection;
  v_updated INT := 0;
BEGIN
  v_selection := CASE
    WHEN p_home_goals > p_away_goals THEN 'home'::sports_selection
    WHEN p_home_goals < p_away_goals THEN 'away'::sports_selection
    ELSE 'draw'::sports_selection
  END;

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

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION _sports_settle_match_1x2_legs(UUID, INT, INT)
  FROM PUBLIC, anon, authenticated;

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
    WHEN o.selection = 'over'::sports_selection
      AND p_total_goals > _sports_market_total_line(m.market_type, m.line) THEN 'won'::sports_leg_status
    WHEN o.selection = 'under'::sports_selection
      AND p_total_goals < _sports_market_total_line(m.market_type, m.line) THEN 'won'::sports_leg_status
    WHEN _sports_market_total_line(m.market_type, m.line) = trunc(_sports_market_total_line(m.market_type, m.line))
      AND p_total_goals = trunc(_sports_market_total_line(m.market_type, m.line))::INT THEN 'void'::sports_leg_status
    ELSE 'lost'::sports_leg_status
  END
  FROM sports_outcomes o
  JOIN sports_markets m ON m.id = o.market_id
  WHERE l.outcome_id = o.id
    AND l.fixture_id = p_fixture_id
    AND l.leg_status = 'pending'
    AND (
      m.market_type IN ('totals', 'totals_2_5')
      OR m.market_type ~ '^totals_[0-9]+(_[0-9]+)?$'
    )
    AND _sports_market_total_line(m.market_type, m.line) IS NOT NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION _sports_settle_totals_legs(UUID, INT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_settle_spread_legs(
  p_fixture_id UUID,
  p_home_goals INT,
  p_away_goals INT,
  p_asian BOOLEAN DEFAULT FALSE
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
  SET leg_status = _sports_leg_result_from_margin(
    _sports_spread_margin(
      o.selection,
      COALESCE(NULLIF(o.line, '')::NUMERIC, NULLIF(m.line, '')::NUMERIC, 0),
      p_home_goals,
      p_away_goals
    ),
    COALESCE(NULLIF(o.line, '')::NUMERIC, NULLIF(m.line, '')::NUMERIC, 0)
  )
  FROM sports_outcomes o
  JOIN sports_markets m ON m.id = o.market_id
  WHERE l.outcome_id = o.id
    AND l.fixture_id = p_fixture_id
    AND l.leg_status = 'pending'
    AND o.selection IN ('home', 'away')
    AND (
      (NOT p_asian AND m.market_type IN ('spread', 'handicap'))
      OR (p_asian AND m.market_type = 'asian_handicap')
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION _sports_settle_spread_legs(UUID, INT, INT, BOOLEAN)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _sports_settle_btts_legs(
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
  v_yes BOOLEAN := p_home_goals > 0 AND p_away_goals > 0;
  v_updated INT := 0;
BEGIN
  UPDATE sports_bet_legs l
  SET leg_status = CASE
    WHEN o.selection = 'yes'::sports_selection AND v_yes THEN 'won'::sports_leg_status
    WHEN o.selection = 'no'::sports_selection AND NOT v_yes THEN 'won'::sports_leg_status
    ELSE 'lost'::sports_leg_status
  END
  FROM sports_outcomes o
  JOIN sports_markets m ON m.id = o.market_id
  WHERE l.outcome_id = o.id
    AND l.fixture_id = p_fixture_id
    AND l.leg_status = 'pending'
    AND m.market_type IN ('btts', 'both_teams_score');

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION _sports_settle_btts_legs(UUID, INT, INT)
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
    'btts', _sports_settle_btts_legs(p_fixture_id, p_home_goals, p_away_goals)
  );
END;
$$;

REVOKE ALL ON FUNCTION _sports_settle_all_score_markets(UUID, INT, INT)
  FROM PUBLIC, anon, authenticated;

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
  v_settle JSONB;
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

  UPDATE sports_fixtures SET
    status = 'finished',
    result_home_goals = p_home_goals,
    result_away_goals = p_away_goals,
    updated_at = NOW()
  WHERE id = p_fixture_id;

  UPDATE sports_markets SET status = 'closed', updated_at = NOW()
  WHERE fixture_id = p_fixture_id AND status <> 'closed';

  v_settle := _sports_settle_all_score_markets(p_fixture_id, p_home_goals, p_away_goals);

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
        'markets', v_settle
      ));
  END IF;

  RETURN jsonb_build_object(
    'fixture_id', p_fixture_id,
    'home_goals', p_home_goals,
    'away_goals', p_away_goals,
    'markets', v_settle
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_settle_sports_fixture_scores(UUID, INT, INT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_settle_sports_fixture_scores(UUID, INT, INT, TEXT)
  TO service_role;

ALTER TABLE sports_market_type_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role all sports_market_type_registry" ON sports_market_type_registry;
CREATE POLICY "service_role all sports_market_type_registry" ON sports_market_type_registry
  FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "authenticated read sports_market_type_registry" ON sports_market_type_registry;
CREATE POLICY "authenticated read sports_market_type_registry" ON sports_market_type_registry
  FOR SELECT USING (TRUE);

REVOKE ALL ON sports_market_type_registry FROM PUBLIC, anon, authenticated;
GRANT SELECT ON sports_market_type_registry TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON sports_market_type_registry TO service_role;

CREATE OR REPLACE FUNCTION rpc_list_sports_market_types()
RETURNS SETOF JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'market_type', market_type,
    'category', category,
    'settle_handler', settle_handler,
    'enabled', enabled,
    'description', description
  )
  FROM sports_market_type_registry
  WHERE enabled
  ORDER BY category, market_type;
$$;

REVOKE ALL ON FUNCTION rpc_list_sports_market_types() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_list_sports_market_types() TO anon, authenticated, service_role;
