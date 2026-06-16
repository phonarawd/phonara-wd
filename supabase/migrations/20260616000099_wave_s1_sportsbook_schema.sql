-- ============================================================
-- Migration: 20260616000099_wave_s1_sportsbook_schema
-- Wave-S1: Sportsbook schema + prematch READ RPCs (no place/settle)
-- ============================================================
-- Separated from game_bets / game_rounds (F1).
-- Odds stored as TEXT Decimal (F2). Client reads via RPC only (F3).
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sports_fixture_status') THEN
    CREATE TYPE sports_fixture_status AS ENUM (
      'scheduled', 'live', 'finished', 'void', 'cancelled'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sports_market_status') THEN
    CREATE TYPE sports_market_status AS ENUM ('open', 'suspended', 'closed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sports_selection') THEN
    CREATE TYPE sports_selection AS ENUM ('home', 'draw', 'away', 'over', 'under');
  END IF;
END;
$$;

-- ─── sports_fixtures ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sports_fixtures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_fixture_id  TEXT NOT NULL UNIQUE,
  league_code           TEXT NOT NULL,
  home_name             TEXT NOT NULL,
  away_name             TEXT NOT NULL,
  kickoff_at            TIMESTAMPTZ NOT NULL,
  status                sports_fixture_status NOT NULL DEFAULT 'scheduled',
  source_vendor         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sf_league_kickoff_idx
  ON sports_fixtures (league_code, kickoff_at);
CREATE INDEX IF NOT EXISTS sf_status_kickoff_idx
  ON sports_fixtures (status, kickoff_at);

-- ─── sports_markets ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sports_markets (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id           UUID NOT NULL REFERENCES sports_fixtures(id) ON DELETE CASCADE,
  canonical_market_id  TEXT NOT NULL UNIQUE,
  market_type          TEXT NOT NULL,
  status               sports_market_status NOT NULL DEFAULT 'open',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sm_fixture_idx ON sports_markets (fixture_id, market_type);

-- ─── sports_outcomes ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sports_outcomes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id             UUID NOT NULL REFERENCES sports_markets(id) ON DELETE CASCADE,
  canonical_outcome_id  TEXT NOT NULL UNIQUE,
  selection             sports_selection NOT NULL,
  line                  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS so_market_idx ON sports_outcomes (market_id, selection);

-- ─── sports_odds_snapshots (append-only) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS sports_odds_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome_id     UUID NOT NULL REFERENCES sports_outcomes(id) ON DELETE CASCADE,
  odds           TEXT NOT NULL
    CONSTRAINT sos_odds_pos CHECK (odds ~ '^\d+(\.\d+)?$' AND odds::NUMERIC > 1),
  captured_at    TIMESTAMPTZ NOT NULL,
  source_vendor  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sos_outcome_captured_idx
  ON sports_odds_snapshots (outcome_id, captured_at DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE sports_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_odds_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role all sports_fixtures" ON sports_fixtures;
CREATE POLICY "service_role all sports_fixtures" ON sports_fixtures
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role all sports_markets" ON sports_markets;
CREATE POLICY "service_role all sports_markets" ON sports_markets
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role all sports_outcomes" ON sports_outcomes;
CREATE POLICY "service_role all sports_outcomes" ON sports_outcomes
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role all sports_odds_snapshots" ON sports_odds_snapshots;
CREATE POLICY "service_role all sports_odds_snapshots" ON sports_odds_snapshots
  FOR ALL USING (auth.role() = 'service_role');

REVOKE ALL ON sports_fixtures, sports_markets, sports_outcomes, sports_odds_snapshots
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sports_fixtures, sports_markets, sports_outcomes, sports_odds_snapshots
  TO service_role;

-- ─── Latest odds helper ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _sports_latest_odds(p_outcome_id UUID)
RETURNS TABLE (odds TEXT, captured_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.odds, s.captured_at
  FROM sports_odds_snapshots s
  WHERE s.outcome_id = p_outcome_id
  ORDER BY s.captured_at DESC, s.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION _sports_latest_odds(UUID) FROM PUBLIC, anon, authenticated;

-- ─── READ RPC: list fixtures ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_list_sports_fixtures(
  p_date   DATE DEFAULT NULL,
  p_league TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object(
    'fixture_id', f.id,
    'league_code', f.league_code,
    'home_name', f.home_name,
    'away_name', f.away_name,
    'kickoff_at', f.kickoff_at,
    'status', f.status::TEXT,
    'match_1x2', COALESCE(
      (
        SELECT jsonb_object_agg(o.selection::TEXT, jsonb_build_object(
          'outcome_id', o.id,
          'odds', lo.odds,
          'captured_at', lo.captured_at
        ))
        FROM sports_markets m
        JOIN sports_outcomes o ON o.market_id = m.id
        LEFT JOIN LATERAL _sports_latest_odds(o.id) lo ON TRUE
        WHERE m.fixture_id = f.id
          AND m.market_type = 'match_1x2'
          AND lo.odds IS NOT NULL
      ),
      '{}'::JSONB
    )
  )
  FROM sports_fixtures f
  WHERE (p_date IS NULL OR f.kickoff_at::DATE = p_date)
    AND (p_league IS NULL OR f.league_code = p_league)
    AND (p_status IS NULL OR f.status::TEXT = p_status)
  ORDER BY f.kickoff_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION rpc_list_sports_fixtures(DATE, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_list_sports_fixtures(DATE, TEXT, TEXT) TO anon, authenticated, service_role;

-- ─── READ RPC: fixture markets ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_get_fixture_markets(p_fixture_id UUID)
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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'fixture_not_found';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'market_id', m.id,
      'market_type', m.market_type,
      'status', m.status::TEXT,
      'outcomes', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'outcome_id', o.id,
            'selection', o.selection::TEXT,
            'line', o.line,
            'odds', lo.odds,
            'captured_at', lo.captured_at
          )
          ORDER BY o.selection::TEXT
        ), '[]'::JSONB)
        FROM sports_outcomes o
        LEFT JOIN LATERAL _sports_latest_odds(o.id) lo ON TRUE
        WHERE o.market_id = m.id
      )
    )
    ORDER BY m.market_type
  ), '[]'::JSONB)
  INTO v_markets
  FROM sports_markets m
  WHERE m.fixture_id = p_fixture_id;

  RETURN jsonb_build_object(
    'fixture_id', v_fixture.id,
    'league_code', v_fixture.league_code,
    'home_name', v_fixture.home_name,
    'away_name', v_fixture.away_name,
    'kickoff_at', v_fixture.kickoff_at,
    'status', v_fixture.status::TEXT,
    'markets', v_markets
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_fixture_markets(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_get_fixture_markets(UUID) TO anon, authenticated, service_role;

-- ─── Feature flag (default enabled) ───────────────────────────────────────────

INSERT INTO app_config (key, value, description) VALUES
  ('feature_sports_enabled', 'true', 'Sportsbook kill switch. false disables rpc_place_sports_bet.'),
  ('sports_odds_snapshot_max_age_sec', '300', 'Max age (seconds) for odds snapshot at place-bet time (S3).'),
  ('sports_min_stake_phon', '1.000000', 'Minimum PHON sports stake.'),
  ('sports_max_stake_phon', '100000.000000', 'Maximum PHON sports stake.'),
  ('sports_min_stake_usdt', '0.010000', 'Minimum USDT sports stake.'),
  ('sports_max_stake_usdt', '10000.000000', 'Maximum USDT sports stake.'),
  ('sports_max_payout_phon', '1000000.000000', 'Maximum PHON sports payout per bet.'),
  ('sports_max_payout_usdt', '100000.000000', 'Maximum USDT sports payout per bet.')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION rpc_set_feature_enabled(
  p_feature TEXT,
  p_enabled BOOLEAN,
  p_reason  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_key   TEXT;
  v_rows  INT;
BEGIN
  IF NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF p_feature NOT IN ('spot','futures','staking','game','referral','deposit','withdrawal','sports') THEN
    RAISE EXCEPTION 'invalid_feature' USING HINT = p_feature;
  END IF;

  v_key := 'feature_' || p_feature || '_enabled';
  UPDATE app_config SET value = CASE WHEN p_enabled THEN 'true' ELSE 'false' END, updated_at = NOW()
  WHERE key = v_key;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'invalid_feature' USING HINT = p_feature;
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (v_actor, 'feature_toggle', 'app_config', NULL,
    jsonb_build_object('feature', p_feature, 'enabled', p_enabled, 'reason', p_reason));

  RETURN jsonb_build_object('feature', p_feature, 'enabled', p_enabled);
END;
$$;
