-- ============================================================
-- Sportsbook house exposure cap blocks oversized pending payout
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome UUID;
  v_msg TEXT;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_cap_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '100000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = '150.000000' WHERE key = 'sports_house_exposure_cap_phon';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:cap-1', 'leagueCode', 'epl',
      'homeName', 'CapH', 'awayName', 'CapA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:cap-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:cap-1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:cap-1:match_1x2:home',
    'odds', '10.000000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_outcome FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:cap-1:match_1x2:home';

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '10.000000')),
      '100.000000', 'PHON', 'sports-cap-block-' || v_uid::TEXT);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'house_exposure_cap' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked, format('house_exposure_cap must block oversized pending payout, got %s', COALESCE(v_msg, '<none>'));
END;
$$;

ROLLBACK;
