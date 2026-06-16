-- ============================================================
-- Sportsbook in-play suspend blocks place
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_fixture_id UUID;
  v_outcome UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_inplay_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '1000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:live-1', 'leagueCode', 'epl',
      'homeName', 'LiveH', 'awayName', 'LiveA',
      'kickoffAt', (NOW() - INTERVAL '10 minutes')::TEXT, 'status', 'live'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:live-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:live-1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:live-1:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:live-1';
  SELECT id INTO v_outcome FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:live-1:match_1x2:home';

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_suspend_sports_fixture(v_fixture_id, 60000, 'goal');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000')),
      '10.000000', 'PHON', 'sports-inplay-suspend-' || v_uid::TEXT);
    RAISE EXCEPTION 'expected market_suspended';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%market_suspended%', 'suspend window must block place';
  END;
END;
$$;

ROLLBACK;
