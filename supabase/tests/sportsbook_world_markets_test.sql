-- ============================================================
-- Sportsbook S15–S22 world engine — spread · BTTS · SGP · cashout
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_fixture_id UUID;
  v_spread_home UUID;
  v_btts_yes UUID;
  v_bet_id UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
  v_preview JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_world_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '50000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:world-1',
      'leagueCode', 'epl',
      'homeName', 'World Home',
      'awayName', 'World Away',
      'kickoffAt', (NOW() + INTERVAL '2 days')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(
      jsonb_build_object(
        'marketId', 'test-vendor:world-1:spread',
        'marketType', 'spread',
        'line', '-1.5',
        'status', 'open',
        'outcomes', jsonb_build_array(
          jsonb_build_object('outcomeId', 'test-vendor:world-1:spread:home', 'selection', 'home', 'line', '-1.5'),
          jsonb_build_object('outcomeId', 'test-vendor:world-1:spread:away', 'selection', 'away', 'line', '1.5')
        )
      ),
      jsonb_build_object(
        'marketId', 'test-vendor:world-1:btts',
        'marketType', 'btts',
        'status', 'open',
        'outcomes', jsonb_build_array(
          jsonb_build_object('outcomeId', 'test-vendor:world-1:btts:yes', 'selection', 'yes'),
          jsonb_build_object('outcomeId', 'test-vendor:world-1:btts:no', 'selection', 'no')
        )
      ),
      jsonb_build_object(
        'marketId', 'test-vendor:world-1:match_1x2',
        'marketType', 'match_1x2',
        'status', 'open',
        'outcomes', jsonb_build_array(
          jsonb_build_object('outcomeId', 'test-vendor:world-1:match_1x2:home', 'selection', 'home'),
          jsonb_build_object('outcomeId', 'test-vendor:world-1:match_1x2:draw', 'selection', 'draw'),
          jsonb_build_object('outcomeId', 'test-vendor:world-1:match_1x2:away', 'selection', 'away')
        )
      )
    )
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:world-1:spread:home',
    'odds', '1.900000', 'capturedAt', NOW()::TEXT
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:world-1:btts:yes',
    'odds', '1.800000', 'capturedAt', NOW()::TEXT
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:world-1:match_1x2:home',
    'odds', '2.100000', 'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:world-1';
  SELECT id INTO v_spread_home FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:world-1:spread:home';
  SELECT id INTO v_btts_yes FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:world-1:btts:yes';

  -- SGP same fixture
  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(
      jsonb_build_object('outcome_id', v_spread_home, 'odds_at_bet', '1.900000'),
      jsonb_build_object('outcome_id', v_btts_yes, 'odds_at_bet', '1.800000')
    ),
    '50.000000',
    'PHON',
    'sports-sgp-' || v_uid::TEXT,
    NULL, NULL,
    'sgp'
  )->>'bet_id')::UUID;

  ASSERT (SELECT bet_kind FROM sports_bets WHERE id = v_bet_id) = 'sgp', 'bet_kind sgp';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  -- spread home -1.5 wins 3-1 (margin 3 + (-1.5) - 1 = 0.5 > 0), BTTS yes wins
  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_settle_sports_fixture_scores(v_fixture_id, 3, 1, 'world_test');

  ASSERT (SELECT status FROM sports_bets WHERE id = v_bet_id) = 'won', 'SGP should win';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_before = v_phon_after, 'conservation after SGP win';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  -- cashout path on new pending bet
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:world-2',
      'leagueCode', 'epl',
      'homeName', 'Cash A',
      'awayName', 'Cash B',
      'kickoffAt', (NOW() + INTERVAL '1 day')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:world-2:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:world-2:match_1x2:home', 'selection', 'home')
      )
    ))
  ));
  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert', 'outcomeId', 'test-vendor:world-2:match_1x2:home',
    'odds', '2.000000', 'capturedAt', NOW()::TEXT
  ));

  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object(
      'outcome_id', (SELECT id FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:world-2:match_1x2:home'),
      'odds_at_bet', '2.000000'
    )),
    '100.000000',
    'PHON',
    'sports-cashout-' || v_uid::TEXT
  )->>'bet_id')::UUID;

  v_preview := rpc_preview_sports_cashout(v_bet_id);
  ASSERT v_preview->>'cashout_amount' IS NOT NULL, 'cashout preview';

  PERFORM rpc_cashout_sports_bet(
    v_bet_id,
    v_preview->>'cashout_amount',
    'cashout-idem-' || v_uid::TEXT
  );

  ASSERT (SELECT status FROM sports_bets WHERE id = v_bet_id) = 'cashed_out', 'cashed out';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_before = v_phon_after, 'conservation after cashout';

  RAISE NOTICE 'sportsbook_world_markets_test PASSED';
END;
$$;

ROLLBACK;
