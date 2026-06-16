-- ============================================================
-- Sportsbook settle conservation (Wave-S4)
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_outcome_home UUID;
  v_fixture_id UUID;
  v_bet_id UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_settle_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '10000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:settle-1',
      'leagueCode', 'epl',
      'homeName', 'Winners',
      'awayName', 'Losers',
      'kickoffAt', (NOW() + INTERVAL '3 days')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:settle-1:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:settle-1:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:settle-1:match_1x2:draw', 'selection', 'draw'),
        jsonb_build_object('outcomeId', 'test-vendor:settle-1:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:settle-1:match_1x2:home',
    'odds', '2.000000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:settle-1';
  SELECT id INTO v_outcome_home FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:settle-1:match_1x2:home';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_outcome_home, 'odds_at_bet', '2.000000')),
    '100.000000',
    'PHON',
    'sports-settle-idem-' || v_uid::TEXT
  )->>'bet_id')::UUID;

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_settle_sports_fixture(v_fixture_id, 'home', 'test_ft');

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before,
    format('PHON not conserved after win settle: before=%s after=%s delta=%s',
      v_phon_before, v_phon_after, v_phon_after - v_phon_before);

  ASSERT (SELECT status FROM sports_bets WHERE id = v_bet_id) = 'won', 'bet should be won';

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_settle_sports_fixture(v_fixture_id, 'home', 'idempotent_replay');

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before,
    'PHON must stay conserved on idempotent settle replay';
END;
$$;

ROLLBACK;
