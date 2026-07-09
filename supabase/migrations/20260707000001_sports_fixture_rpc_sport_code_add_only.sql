-- add-only: rpc_list_sports_fixtures sport_code key + world-cup → football mapping
-- SSOT: docs/SSOT/SPORT_CODE_IMPACT.md · signature/GRANT/RLS/DDL unchanged

CREATE OR REPLACE FUNCTION _sports_league_sport_code(p_league_code TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_league_code IN ('nba', 'kbl') THEN 'basketball'
    WHEN p_league_code IN ('nfl', 'ncaaf') THEN 'american_football'
    WHEN p_league_code IN ('mlb', 'kbo', 'npb') THEN 'baseball'
    WHEN p_league_code IN (
      'epl', 'k-league', 'world-cup',
      'bundesliga', 'la-liga', 'serie-a', 'ligue-1', 'ucl', 'mls', 'j-league'
    ) THEN 'football'
    ELSE 'default'
  END;
$$;

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
    'sport_code', _sports_league_sport_code(f.league_code),
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
