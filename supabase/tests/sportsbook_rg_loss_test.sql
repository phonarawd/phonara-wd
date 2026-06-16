-- ============================================================
-- Sportsbook RG sports domain blocks place after realized loss
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
          'sports_rg_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '10000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:rg-1', 'leagueCode', 'epl',
      'homeName', 'RgH', 'awayName', 'RgA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:rg-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:rg-1:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:rg-1:match_1x2:away', 'selection', 'away')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:rg-1:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_outcome FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:rg-1:match_1x2:home';
  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:rg-1';

  PERFORM rpc_set_rg_limit('loss', 'sports', 'PHON', '50.000000');

  PERFORM rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000')),
    '100.000000', 'PHON', 'sports-rg-lose-' || v_uid::TEXT);

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_settle_sports_fixture_scores(v_fixture_id, 0, 2, 'rg_test_away_win');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000')),
      '10.000000', 'PHON', 'sports-rg-block-' || v_uid::TEXT);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'rg_loss_limit_reached' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked,
    format('sports RG loss limit must block after realized loss, got %s', COALESCE(v_msg, '<none>'));
END;
$$;

ROLLBACK;
