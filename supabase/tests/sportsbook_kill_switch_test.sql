-- ============================================================
-- Sportsbook feature kill switch + kickoff_passed negative
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome UUID;
  v_fixture_id UUID;
  v_msg TEXT;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_kill_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '1000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'feature_sports_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:kill-1', 'leagueCode', 'epl',
      'homeName', 'KillH', 'awayName', 'KillA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:kill-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:kill-1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:kill-1:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_outcome FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:kill-1:match_1x2:home';

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000')),
      '10.000000', 'PHON', 'sports-kill-' || v_uid::TEXT);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'feature_disabled' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked, format('feature_sports_enabled off must block place, got %s', COALESCE(v_msg, '<none>'));

  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:kill-1';
  UPDATE sports_fixtures SET kickoff_at = NOW() - INTERVAL '5 minutes' WHERE id = v_fixture_id;

  v_blocked := FALSE;
  v_msg := NULL;
  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000')),
      '10.000000', 'PHON', 'sports-kickoff-' || v_uid::TEXT);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'kickoff_passed' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked, format('kickoff_passed must block prematch place, got %s', COALESCE(v_msg, '<none>'));
END;
$$;

ROLLBACK;
