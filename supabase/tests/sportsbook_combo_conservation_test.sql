-- ============================================================
-- Sportsbook combo conservation (2-leg parlay win)
-- Currency under test: PHON. USDT sportsbook Σ=0: usdt_betting_proof_e7_test.sql (ZA-19)
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_f1 UUID;
  v_f2 UUID;
  v_o1 UUID;
  v_o2 UUID;
  v_bet_id UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_combo_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '10000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:combo-f1', 'leagueCode', 'epl',
      'homeName', 'C1H', 'awayName', 'C1A',
      'kickoffAt', (NOW() + INTERVAL '4 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:combo-f1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:combo-f1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:combo-f2', 'leagueCode', 'epl',
      'homeName', 'C2H', 'awayName', 'C2A',
      'kickoffAt', (NOW() + INTERVAL '5 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:combo-f2:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:combo-f2:match_1x2:home', 'selection', 'home')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:combo-f1:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:combo-f2:match_1x2:home',
    'odds', '1.500000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_o1 FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:combo-f1:match_1x2:home';
  SELECT id INTO v_o2 FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:combo-f2:match_1x2:home';
  SELECT id INTO v_f1 FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:combo-f1';
  SELECT id INTO v_f2 FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:combo-f2';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(
      jsonb_build_object('outcome_id', v_o1, 'odds_at_bet', '2.000000'),
      jsonb_build_object('outcome_id', v_o2, 'odds_at_bet', '1.500000')
    ),
    '100.000000', 'PHON', 'sports-combo-' || v_uid::TEXT
  )->>'bet_id')::UUID;

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_settle_sports_fixture_scores(v_f1, 1, 0, 'combo_1');
  PERFORM rpc_settle_sports_fixture_scores(v_f2, 2, 0, 'combo_2');

  ASSERT (SELECT status FROM sports_bets WHERE id = v_bet_id) = 'won', 'combo should win';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before,
    format('PHON not conserved combo win: before=%s after=%s', v_phon_before, v_phon_after);
END;
$$;

ROLLBACK;
