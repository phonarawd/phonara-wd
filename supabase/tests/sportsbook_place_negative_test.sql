-- ============================================================
-- Sportsbook place negative paths (RPC guards — not package preview)
--
-- Complements sportsbook_place_conservation_test.sql.
-- Exposure cap: sportsbook_exposure_cap_test.sql
-- RG loss limits: sportsbook_rg_loss_test.sql
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

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome_home UUID;
  v_outcome_over UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_neg_df_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '1000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:neg-dup-fix', 'leagueCode', 'epl',
      'homeName', 'DFH', 'awayName', 'DFA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(
      jsonb_build_object(
        'marketId', 'test-vendor:neg-dup-fix:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
        'outcomes', jsonb_build_array(
          jsonb_build_object('outcomeId', 'test-vendor:neg-dup-fix:match_1x2:home', 'selection', 'home')
        )
      ),
      jsonb_build_object(
        'marketId', 'test-vendor:neg-dup-fix:totals_2_5', 'marketType', 'totals_2_5', 'status', 'open',
        'outcomes', jsonb_build_array(
          jsonb_build_object('outcomeId', 'test-vendor:neg-dup-fix:totals_2_5:over', 'selection', 'over', 'line', '2.5')
        )
      )
    )
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:neg-dup-fix:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:neg-dup-fix:totals_2_5:over',
    'odds', '1.800000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_outcome_home FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:neg-dup-fix:match_1x2:home';
  SELECT id INTO v_outcome_over FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:neg-dup-fix:totals_2_5:over';

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(
        jsonb_build_object('outcome_id', v_outcome_home, 'odds_at_bet', '2.000000'),
        jsonb_build_object('outcome_id', v_outcome_over, 'odds_at_bet', '1.800000')
      ),
      '10.000000', 'PHON', 'sports-neg-dup-fix-' || v_uid::TEXT);
    RAISE EXCEPTION 'expected duplicate_fixture';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%duplicate_fixture%', 'duplicate fixture parlay must reject';
  END;
END;
$$;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_neg_stale_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '1000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:neg-stale', 'leagueCode', 'epl',
      'homeName', 'STH', 'awayName', 'STA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:neg-stale:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:neg-stale:match_1x2:home', 'selection', 'home')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:neg-stale:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_outcome FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:neg-stale:match_1x2:home';

  UPDATE sports_odds_snapshots
  SET captured_at = NOW() - INTERVAL '2 hours'
  WHERE outcome_id = v_outcome;

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000')),
      '10.000000', 'PHON', 'sports-neg-stale-' || v_uid::TEXT);
    RAISE EXCEPTION 'expected odds_stale';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%odds_stale%', 'stale odds must reject';
  END;
END;
$$;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_neg_cancel_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '1000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:neg-cancel', 'leagueCode', 'epl',
      'homeName', 'CNH', 'awayName', 'CNA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:neg-cancel:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:neg-cancel:match_1x2:home', 'selection', 'home')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:neg-cancel:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_remove',
    'fixtureId', 'test-vendor:neg-cancel',
    'reason', 'cancelled_event'
  ));

  SELECT id INTO v_outcome FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:neg-cancel:match_1x2:home';

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000')),
      '10.000000', 'PHON', 'sports-neg-cancel-' || v_uid::TEXT);
    RAISE EXCEPTION 'expected fixture_not_open';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%fixture_not_open%', 'cancelled fixture must reject placement';
  END;
END;
$$;

ROLLBACK;
