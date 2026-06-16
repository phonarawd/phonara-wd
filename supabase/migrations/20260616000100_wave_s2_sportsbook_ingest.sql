-- ============================================================
-- Migration: 20260616000100_wave_s2_sportsbook_ingest
-- Wave-S2: C1 ingest RPC (service_role) + ingest cursor
-- ============================================================

SET search_path = public, pg_temp;

CREATE TABLE IF NOT EXISTS sports_ingest_cursors (
  vendor        TEXT NOT NULL,
  league_code   TEXT NOT NULL,
  last_seq      TEXT,
  last_success  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vendor, league_code)
);

ALTER TABLE sports_ingest_cursors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role all sports_ingest_cursors" ON sports_ingest_cursors;
CREATE POLICY "service_role all sports_ingest_cursors" ON sports_ingest_cursors
  FOR ALL USING (auth.role() = 'service_role');

REVOKE ALL ON sports_ingest_cursors FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sports_ingest_cursors TO service_role;

CREATE OR REPLACE FUNCTION _sports_map_selection(p_name TEXT)
RETURNS sports_selection
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v TEXT := lower(btrim(COALESCE(p_name, '')));
BEGIN
  IF v IN ('draw', 'x', 'tie') THEN RETURN 'draw'; END IF;
  IF v LIKE '%over%' THEN RETURN 'over'; END IF;
  IF v LIKE '%under%' THEN RETURN 'under'; END IF;
  IF v LIKE '%away%' THEN RETURN 'away'; END IF;
  RETURN 'home';
END;
$$;

REVOKE ALL ON FUNCTION _sports_map_selection(TEXT) FROM PUBLIC, anon, authenticated;

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

REVOKE ALL ON FUNCTION rpc_ingest_sports_c1(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_ingest_sports_c1(JSONB) TO service_role;

CREATE OR REPLACE FUNCTION rpc_ingest_sports_c1_batch(p_messages JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_i INT;
  v_msg JSONB;
  v_processed INT := 0;
  v_results JSONB := '[]'::JSONB;
BEGIN
  IF p_messages IS NULL OR jsonb_typeof(p_messages) <> 'array' THEN
    RAISE EXCEPTION 'invalid_batch';
  END IF;

  FOR v_i IN 0 .. jsonb_array_length(p_messages) - 1 LOOP
    v_msg := p_messages->v_i;
    v_results := v_results || jsonb_build_array(rpc_ingest_sports_c1(v_msg));
    v_processed := v_processed + 1;
  END LOOP;

  RETURN jsonb_build_object('processed', v_processed, 'results', v_results);
END;
$$;

REVOKE ALL ON FUNCTION rpc_ingest_sports_c1_batch(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_ingest_sports_c1_batch(JSONB) TO service_role;
