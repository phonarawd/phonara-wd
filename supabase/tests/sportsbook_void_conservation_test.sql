-- ============================================================
-- Sportsbook void bet refund conservation (Wave-S4 + market void)
--
-- Authoritative void/refund paths: `rpc_void_sports_bet`, `rpc_void_sports_market`.
-- Cancelled fixtures block new placement (`fixture_not_open`) — see place negative test.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_outcome UUID;
  v_bet_id UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid, 'authenticated', 'authenticated', 'sports_void_u_' || v_uid::TEXT || '@test.local', NOW(), NOW()),
    (v_admin, 'authenticated', 'authenticated', 'sports_void_a_' || v_admin::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '5000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:void-1', 'leagueCode', 'epl',
      'homeName', 'VoidH', 'awayName', 'VoidA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:void-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:void-1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:void-1:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_outcome FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:void-1:match_1x2:home';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.000000')),
    '75.000000', 'PHON', 'sports-void-' || v_uid::TEXT
  )->>'bet_id')::UUID;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, true);
  PERFORM rpc_void_sports_bet(v_bet_id, 'test_void_refund');

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before, 'PHON must be conserved after admin void refund';
  ASSERT (SELECT status FROM sports_bets WHERE id = v_bet_id) = 'void', 'bet must be void';
END;
$$;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_outcome UUID;
  v_market_id UUID;
  v_bet_id UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid, 'authenticated', 'authenticated', 'sports_mvoid_u_' || v_uid::TEXT || '@test.local', NOW(), NOW()),
    (v_admin, 'authenticated', 'authenticated', 'sports_mvoid_a_' || v_admin::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '5000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:mvoid-1', 'leagueCode', 'epl',
      'homeName', 'MVH', 'awayName', 'MVA',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT, 'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:mvoid-1:match_1x2', 'marketType', 'match_1x2', 'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:mvoid-1:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:mvoid-1:match_1x2:home',
    'odds', '2.500000', 'capturedAt', NOW()::TEXT));

  SELECT id INTO v_outcome FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:mvoid-1:match_1x2:home';
  SELECT market_id INTO v_market_id FROM sports_outcomes WHERE id = v_outcome;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_outcome, 'odds_at_bet', '2.500000')),
    '60.000000', 'PHON', 'sports-mvoid-' || v_uid::TEXT
  )->>'bet_id')::UUID;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, true);
  PERFORM rpc_void_sports_market(v_market_id, 'market_cancelled_refund');

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before, 'PHON must be conserved after market void settle';
  ASSERT (SELECT status FROM sports_bets WHERE id = v_bet_id) = 'void', 'market void must settle bet as void';
  ASSERT (SELECT leg_status FROM sports_bet_legs WHERE bet_id = v_bet_id) = 'void', 'market void must void leg';
END;
$$;

ROLLBACK;
