-- ============================================================
-- Sportsbook RLS + READ RPC smoke test (Wave-S1)
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_fixture_id UUID;
  v_list_count INT;
  v_detail JSONB;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:fixture-1',
      'leagueCode', 'epl',
      'homeName', 'Arsenal',
      'awayName', 'Chelsea',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:fixture-1:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:fixture-1:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:fixture-1:match_1x2:draw', 'selection', 'draw'),
        jsonb_build_object('outcomeId', 'test-vendor:fixture-1:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  SELECT id INTO v_fixture_id
  FROM sports_fixtures
  WHERE canonical_fixture_id = 'test-vendor:fixture-1';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:fixture-1:match_1x2:home',
    'odds', '2.100000',
    'capturedAt', NOW()::TEXT
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:fixture-1:match_1x2:draw',
    'odds', '3.400000',
    'capturedAt', NOW()::TEXT
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:fixture-1:match_1x2:away',
    'odds', '3.200000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT COUNT(*) INTO v_list_count
  FROM rpc_list_sports_fixtures(NULL, 'epl', 'scheduled');
  ASSERT v_list_count >= 1, 'list fixtures empty';

  SELECT rpc_get_fixture_markets(v_fixture_id) INTO v_detail;
  ASSERT v_detail->>'home_name' = 'Arsenal', 'fixture detail mismatch';

  ASSERT has_table_privilege('anon', 'public.sports_fixtures', 'SELECT'),
    'anon may SELECT sports_fixtures for realtime display';
  ASSERT has_table_privilege('authenticated', 'public.sports_fixtures', 'SELECT'),
    'authenticated may SELECT sports_fixtures for realtime display';
  ASSERT NOT has_table_privilege('anon', 'public.sports_fixtures', 'INSERT'),
    'anon must NOT INSERT sports_fixtures directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_fixtures', 'INSERT'),
    'authenticated must NOT INSERT sports_fixtures directly';

  ASSERT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sports_fixtures'
  ), 'sports_fixtures must be in supabase_realtime publication';
  ASSERT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sports_markets'
  ), 'sports_markets must be in supabase_realtime publication';
  ASSERT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sports_odds_snapshots'
  ), 'sports_odds_snapshots must be in supabase_realtime publication';
END;
$$;

ROLLBACK;
