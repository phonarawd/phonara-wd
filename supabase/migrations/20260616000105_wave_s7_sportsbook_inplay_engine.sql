-- ============================================================
-- Migration: 20260616000105_wave_s7_sportsbook_inplay_engine
-- Wave-S7: live status ingest · fixture events · auto-settle path
-- ============================================================

SET search_path = public, pg_temp;

CREATE TABLE IF NOT EXISTS sports_fixture_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id   UUID NOT NULL REFERENCES sports_fixtures(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sfe_fixture_idx ON sports_fixture_events (fixture_id, created_at DESC);

ALTER TABLE sports_fixture_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin read sports_fixture_events" ON sports_fixture_events;
CREATE POLICY "admin read sports_fixture_events" ON sports_fixture_events
  FOR SELECT USING (_is_admin());
DROP POLICY IF EXISTS "service_role all sports_fixture_events" ON sports_fixture_events;
CREATE POLICY "service_role all sports_fixture_events" ON sports_fixture_events
  FOR ALL USING (auth.role() = 'service_role');

REVOKE ALL ON sports_fixture_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON sports_fixture_events TO authenticated;
GRANT SELECT, INSERT ON sports_fixture_events TO service_role;

CREATE OR REPLACE FUNCTION rpc_get_live_fixture_state(p_fixture_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fixture sports_fixtures%ROWTYPE;
  v_markets JSONB;
BEGIN
  SELECT * INTO v_fixture FROM sports_fixtures WHERE id = p_fixture_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'market_id', m.id,
    'market_type', m.market_type,
    'status', m.status,
    'suspended_until', m.suspended_until,
    'suspend_reason', m.suspend_reason
  ) ORDER BY m.market_type), '[]'::JSONB)
  INTO v_markets
  FROM sports_markets m
  WHERE m.fixture_id = p_fixture_id;

  RETURN jsonb_build_object(
    'fixture_id', v_fixture.id,
    'league_code', v_fixture.league_code,
    'home_name', v_fixture.home_name,
    'away_name', v_fixture.away_name,
    'kickoff_at', v_fixture.kickoff_at,
    'status', v_fixture.status,
    'suspended_until', v_fixture.suspended_until,
    'suspend_reason', v_fixture.suspend_reason,
    'result_home_goals', v_fixture.result_home_goals,
    'result_away_goals', v_fixture.result_away_goals,
    'markets', v_markets
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_live_fixture_state(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_get_live_fixture_state(UUID) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_ingest_sports_fixture_status(
  p_canonical_fixture_id TEXT,
  p_status               TEXT,
  p_home_goals           INT DEFAULT NULL,
  p_away_goals           INT DEFAULT NULL,
  p_suspend_ms           INT DEFAULT NULL,
  p_reason               TEXT DEFAULT NULL,
  p_auto_settle          BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fixture sports_fixtures%ROWTYPE;
  v_status sports_fixture_status;
  v_until TIMESTAMPTZ;
  v_settle JSONB;
BEGIN
  BEGIN
    v_status := lower(btrim(p_status))::sports_fixture_status;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_status';
  END;

  SELECT * INTO v_fixture FROM sports_fixtures
  WHERE canonical_fixture_id = p_canonical_fixture_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'fixture_not_found' USING HINT = p_canonical_fixture_id;
  END IF;

  UPDATE sports_fixtures SET
    status = v_status,
    updated_at = NOW(),
    result_home_goals = COALESCE(p_home_goals, result_home_goals),
    result_away_goals = COALESCE(p_away_goals, result_away_goals)
  WHERE id = v_fixture.id
  RETURNING * INTO v_fixture;

  IF p_suspend_ms IS NOT NULL AND p_suspend_ms > 0 THEN
    v_until := NOW() + make_interval(secs => (p_suspend_ms::NUMERIC / 1000.0));
    UPDATE sports_fixtures SET
      suspended_until = GREATEST(COALESCE(suspended_until, NOW()), v_until),
      suspend_reason = COALESCE(p_reason, suspend_reason)
    WHERE id = v_fixture.id;
    UPDATE sports_markets SET
      suspended_until = GREATEST(COALESCE(suspended_until, NOW()), v_until),
      suspend_reason = COALESCE(p_reason, suspend_reason),
      updated_at = NOW()
    WHERE fixture_id = v_fixture.id AND status = 'open';
  END IF;

  IF v_status = 'live' THEN
    UPDATE sports_markets SET status = 'open', updated_at = NOW()
    WHERE fixture_id = v_fixture.id AND status <> 'closed';
  END IF;

  INSERT INTO sports_fixture_events (fixture_id, event_type, payload)
  VALUES (
    v_fixture.id,
    'status_' || v_status::TEXT,
    jsonb_build_object(
      'canonical_fixture_id', p_canonical_fixture_id,
      'home_goals', p_home_goals,
      'away_goals', p_away_goals,
      'suspend_ms', p_suspend_ms,
      'reason', p_reason
    )
  );

  v_settle := NULL;
  IF p_auto_settle
     AND v_status = 'finished'
     AND p_home_goals IS NOT NULL
     AND p_away_goals IS NOT NULL
     AND v_fixture.status = 'finished' THEN
    v_settle := rpc_settle_sports_fixture_scores(
      v_fixture.id, p_home_goals, p_away_goals, COALESCE(p_reason, 'ingest_auto_settle')
    );
  END IF;

  RETURN jsonb_build_object(
    'fixture_id', v_fixture.id,
    'status', v_status,
    'auto_settle', v_settle
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_ingest_sports_fixture_status(TEXT, TEXT, INT, INT, INT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_ingest_sports_fixture_status(TEXT, TEXT, INT, INT, INT, TEXT, BOOLEAN) TO service_role;

CREATE OR REPLACE FUNCTION rpc_transition_fixture_live(p_fixture_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  UPDATE sports_fixtures SET status = 'live', updated_at = NOW()
  WHERE id = p_fixture_id AND status = 'scheduled';

  IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_scheduled'; END IF;

  INSERT INTO sports_fixture_events (fixture_id, event_type, payload)
  VALUES (p_fixture_id, 'transition_live', '{}'::JSONB);

  RETURN rpc_get_live_fixture_state(p_fixture_id);
END;
$$;

REVOKE ALL ON FUNCTION rpc_transition_fixture_live(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_transition_fixture_live(UUID) TO service_role;

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_place_sports_bet', 30, 0.5, 1, 60)
ON CONFLICT (rpc_name) DO UPDATE
  SET capacity = GREATEST(rpc_rate_limit_configs.capacity, EXCLUDED.capacity),
      refill_rate = GREATEST(rpc_rate_limit_configs.refill_rate, EXCLUDED.refill_rate),
      is_active = TRUE;
