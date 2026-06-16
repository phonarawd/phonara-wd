-- ============================================================
-- Sportsbook major hardening — lost path + scores settle + totals
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome_away UUID;
  v_fixture_id UUID;
  v_bet_id UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_lost_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '10000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:lost-1',
      'leagueCode', 'epl',
      'homeName', 'Alpha',
      'awayName', 'Beta',
      'kickoffAt', (NOW() + INTERVAL '3 days')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:lost-1:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:lost-1:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:lost-1:match_1x2:draw', 'selection', 'draw'),
        jsonb_build_object('outcomeId', 'test-vendor:lost-1:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:lost-1:match_1x2:home',
    'odds', '2.000000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:lost-1';
  SELECT id INTO v_outcome_away FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:lost-1:match_1x2:away';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object(
      'outcome_id', (SELECT id FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:lost-1:match_1x2:home'),
      'odds_at_bet', '2.000000'
    )),
    '100.000000',
    'PHON',
    'sports-lost-idem-' || v_uid::TEXT
  )->>'bet_id')::UUID;

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_settle_sports_fixture_scores(v_fixture_id, 0, 2, 'away_win');

  ASSERT (SELECT status FROM sports_bets WHERE id = v_bet_id) = 'lost', 'bet should be lost';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before,
    format('PHON not conserved after lost settle: before=%s after=%s', v_phon_before, v_phon_after);
END;
$$;

DO $$
DECLARE
  v_fixture_id UUID;
  v_over UUID;
  v_under UUID;
  v_bet_id UUID;
BEGIN
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:totals-1',
      'leagueCode', 'epl',
      'homeName', 'Over FC',
      'awayName', 'Under FC',
      'kickoffAt', (NOW() + INTERVAL '3 days')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:totals-1:totals_2_5',
      'marketType', 'totals_2_5',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:totals-1:totals_2_5:over', 'selection', 'over', 'line', '2.5'),
        jsonb_build_object('outcomeId', 'test-vendor:totals-1:totals_2_5:under', 'selection', 'under', 'line', '2.5')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:totals-1:totals_2_5:over',
    'odds', '1.900000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:totals-1';
  SELECT id INTO v_over FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:totals-1:totals_2_5:over';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', (
    SELECT id FROM auth.users WHERE email LIKE 'sports_lost_%@test.local' LIMIT 1
  )::TEXT)::TEXT, true);

  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_over, 'odds_at_bet', '1.900000')),
    '50.000000',
    'PHON',
    'sports-totals-' || gen_random_uuid()::TEXT
  )->>'bet_id')::UUID;

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_settle_sports_fixture_scores(v_fixture_id, 2, 1, 'total_3');

  ASSERT (SELECT leg_status FROM sports_bet_legs WHERE bet_id = v_bet_id) = 'won', 'over 2.5 should win on 3 goals';
END;
$$;

ROLLBACK;
