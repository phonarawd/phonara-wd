-- ============================================================
-- Sportsbook multi-account / device correlation defense
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_u1 UUID := gen_random_uuid();
  v_u2 UUID := gen_random_uuid();
  v_home UUID;
  v_device TEXT := 'device_hash_test_16chars_ok';
  v_msg TEXT;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'sports_macc_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW()),
    (v_u1, 'authenticated', 'authenticated', 'sports_macc_u1_' || v_u1::TEXT || '@test.local', NOW(), NOW()),
    (v_u2, 'authenticated', 'authenticated', 'sports_macc_u2_' || v_u2::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '10000.000000' WHERE user_id IN (v_u1, v_u2);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = '1' WHERE key = 'sports_device_max_users_per_hash';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:macc-1', 'leagueCode', 'epl',
      'homeName', 'M1H', 'awayName', 'M1A',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:macc-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:macc-1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:macc-1:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_home FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:macc-1:match_1x2:home';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_u1::TEXT)::TEXT, true);
  PERFORM rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_home, 'odds_at_bet', '2.000000')),
    '50.000000', 'PHON', 'sports-macc-u1-' || v_u1::TEXT,
    v_device, 'ip_hash_test_16chars_ok');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_u2::TEXT)::TEXT, true);
  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_home, 'odds_at_bet', '2.000000')),
      '50.000000', 'PHON', 'sports-macc-u2-' || v_u2::TEXT,
      v_device, 'ip_hash_test_16chars_ok');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'linked_account_device' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked, format('second device-linked user must block when max=1, got %s', COALESCE(v_msg, '<none>'));
END;
$$;

ROLLBACK;
