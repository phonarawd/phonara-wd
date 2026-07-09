-- Step 5 — sports quorum mismatch persistence + admin manual settle wrapper + fixture liability

CREATE TABLE IF NOT EXISTS sports_score_quorum_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_fixture_id TEXT NOT NULL,
  league_code TEXT,
  primary_home INT,
  primary_away INT,
  secondary_home INT,
  secondary_away INT,
  primary_source TEXT NOT NULL DEFAULT 'primary',
  secondary_source TEXT NOT NULL DEFAULT 'secondary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_sports_score_quorum_events_fixture
  ON sports_score_quorum_events (canonical_fixture_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sports_score_quorum_events_unresolved
  ON sports_score_quorum_events (created_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE sports_score_quorum_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sports_score_quorum_events_admin_read ON sports_score_quorum_events;
CREATE POLICY sports_score_quorum_events_admin_read ON sports_score_quorum_events
  FOR SELECT TO authenticated
  USING (_is_admin());

REVOKE ALL ON sports_score_quorum_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON sports_score_quorum_events TO authenticated;
GRANT ALL ON sports_score_quorum_events TO service_role;

CREATE OR REPLACE FUNCTION rpc_record_sports_score_quorum_mismatch(
  p_canonical_fixture_id TEXT,
  p_league_code TEXT,
  p_primary_home INT,
  p_primary_away INT,
  p_secondary_home INT,
  p_secondary_away INT,
  p_primary_source TEXT DEFAULT 'primary',
  p_secondary_source TEXT DEFAULT 'secondary'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  INSERT INTO sports_score_quorum_events (
    canonical_fixture_id,
    league_code,
    primary_home,
    primary_away,
    secondary_home,
    secondary_away,
    primary_source,
    secondary_source
  )
  VALUES (
    btrim(p_canonical_fixture_id),
    NULLIF(btrim(p_league_code), ''),
    p_primary_home,
    p_primary_away,
    p_secondary_home,
    p_secondary_away,
    COALESCE(NULLIF(btrim(p_primary_source), ''), 'primary'),
    COALESCE(NULLIF(btrim(p_secondary_source), ''), 'secondary')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION rpc_record_sports_score_quorum_mismatch(TEXT, TEXT, INT, INT, INT, INT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_record_sports_score_quorum_mismatch(TEXT, TEXT, INT, INT, INT, INT, TEXT, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION rpc_admin_settle_sports_fixture_quorum(
  p_fixture_id UUID,
  p_home_goals INT,
  p_away_goals INT,
  p_reason TEXT,
  p_force_quorum BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fixture sports_fixtures%ROWTYPE;
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF p_home_goals < 0 OR p_away_goals < 0 THEN
    RAISE EXCEPTION 'invalid_score';
  END IF;

  SELECT * INTO v_fixture FROM sports_fixtures WHERE id = p_fixture_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;

  IF p_force_quorum THEN
    UPDATE sports_score_quorum_events SET
      resolved_at = NOW(),
      resolved_by = auth.uid(),
      resolution_reason = btrim(p_reason)
    WHERE canonical_fixture_id = v_fixture.canonical_fixture_id
      AND resolved_at IS NULL;

    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (
      auth.uid(),
      'sports_score_quorum_override',
      'sports_fixtures',
      p_fixture_id,
      jsonb_build_object(
        'home_goals', p_home_goals,
        'away_goals', p_away_goals,
        'reason', btrim(p_reason),
        'canonical_fixture_id', v_fixture.canonical_fixture_id
      )
    );
  END IF;

  v_result := rpc_settle_sports_fixture_scores(
    p_fixture_id,
    p_home_goals,
    p_away_goals,
    btrim(p_reason)
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_settle_sports_fixture_quorum(UUID, INT, INT, TEXT, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_settle_sports_fixture_quorum(UUID, INT, INT, TEXT, BOOLEAN)
  TO authenticated, service_role;

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
    ),
    'pending_liability', (
      SELECT COALESCE(SUM(b.potential_payout::NUMERIC), 0)
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

REVOKE ALL ON FUNCTION rpc_admin_list_unsettled_sports_fixtures(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_list_unsettled_sports_fixtures(INT) TO authenticated, service_role;
