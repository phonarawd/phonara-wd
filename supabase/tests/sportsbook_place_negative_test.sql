-- ============================================================
-- Sportsbook place negative paths
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_neg_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '1000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:neg-1', 'leagueCode', 'epl',
      'homeName', 'N1H', 'awayName', 'N1A',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:neg-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:neg-1:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:neg-1:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:neg-1:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_outcome FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:neg-1:match_1x2:home';

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '9.990000')),
      '10.000000', 'PHON', 'sports-neg-odds-' || v_uid::TEXT);
    RAISE EXCEPTION 'expected odds_changed';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%odds_changed%', 'tampered odds must reject';
  END;

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(
        jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000'),
        jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000')
      ),
      '10.000000', 'PHON', 'sports-neg-dup-outcome-' || v_uid::TEXT);
    RAISE EXCEPTION 'expected duplicate_outcome';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%duplicate_outcome%', 'duplicate outcome must reject';
  END;
END;
$$;

ROLLBACK;
