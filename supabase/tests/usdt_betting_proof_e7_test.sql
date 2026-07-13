-- ============================================================
-- E7 — USDT release proof + betting verification
-- ============================================================
-- Proves USDT stake lock → atomic release/settle (casino) and
-- lock → settle (sports) conserve Σ=0 before live USDT bet exposure.
--
-- ZA-19: This is the USDT sportsbook conservation companion to
-- sportsbook_*_conservation_test.sql (those files cover PHON only).
-- Search either "sportsbook" + "conservation" OR "usdt_betting_proof"
-- when auditing dual-currency Σ=0 coverage.
-- ============================================================

-- ── 1. Casino USDT: atomic place+settle releases lock, Σ=0, house leg ────────
BEGIN;
DO $$
DECLARE
  v_uid          UUID := gen_random_uuid();
  v_round_id     UUID;
  v_bet          JSONB;
  v_server_seed  TEXT := 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
  v_usdt_before  NUMERIC;
  v_usdt_after   NUMERIC;
  v_locked_after NUMERIC;
  v_house_rows   INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e7_casino_' || v_uid::TEXT || '@test.local', NOW(), NOW());
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '1000.000000' WHERE user_id = v_uid;

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_game_enabled', 'feature_game_dice_enabled', 'consent_gate_enabled');

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_round_id := (rpc_create_game_round('dice', v_server_seed)->>'round_id')::UUID;

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_before;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  v_bet := rpc_place_game_bet(
    v_round_id, 'USDT', '100.000000',
    '{"target": "50.00", "direction": "over"}'::JSONB,
    'e7_usdt_seed', 'e7_casino_idem_' || v_uid::TEXT
  );

  ASSERT (v_bet->>'already_placed')::BOOLEAN = FALSE, 'first USDT casino bet must not replay';
  ASSERT v_bet->>'status' IN ('won', 'lost'), 'atomic USDT place must terminally settle';
  ASSERT (SELECT currency FROM game_bets WHERE id = (v_bet->>'bet_id')::UUID) = 'USDT',
    'game_bets.currency must be USDT';

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;
  ASSERT v_usdt_after = v_usdt_before,
    format('USDT Σ=0 violated after casino bet: before=%s after=%s', v_usdt_before, v_usdt_after);

  SELECT usdt_locked::NUMERIC INTO v_locked_after FROM wallets WHERE user_id = v_uid;
  ASSERT v_locked_after = 0,
    format('USDT stake lock must be released after atomic settlement, got %s', v_locked_after);

  SELECT count(*) INTO v_house_rows
  FROM system_account_ledger
  WHERE account_code = 'game_house_usdt' AND related_user_id = v_uid;
  ASSERT v_house_rows = 1, 'game_house_usdt leg must be recorded exactly once';

  RAISE NOTICE 'E7 CASINO USDT OK — terminal settle, lock released, Σ=0, house leg';
END;
$$;
ROLLBACK;

-- ── 2. Casino USDT: insufficient balance rejected before lock ─────────────────
BEGIN;
DO $$
DECLARE
  v_uid      UUID := gen_random_uuid();
  v_round_id UUID;
  v_blocked  BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e7_casino_insuf_' || v_uid::TEXT || '@test.local', NOW(), NOW());
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '10.000000', usdt_locked = '0.000000' WHERE user_id = v_uid;

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_game_enabled', 'feature_game_dice_enabled', 'consent_gate_enabled');
  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_round_id := (rpc_create_game_round('dice', repeat('e', 64))->>'round_id')::UUID;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  BEGIN
    PERFORM rpc_place_game_bet(
      v_round_id, 'USDT', '100.000000',
      '{"target": "50.00", "direction": "over"}'::JSONB,
      'e7_insuf_seed', 'e7_insuf_' || v_uid::TEXT
    );
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%insufficient_available%' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'USDT casino bet must reject insufficient_available before stake lock';

  ASSERT (SELECT usdt_locked::NUMERIC FROM wallets WHERE user_id = v_uid) = 0,
    'insufficient USDT bet must not leave locked balance';

  RAISE NOTICE 'E7 CASINO USDT INSUFFICIENT OK — rejected, no lock';
END;
$$;
ROLLBACK;

-- ── 3. Sports USDT: place locks stake, idempotent replay, Σ=0 ───────────────
BEGIN;
DO $$
DECLARE
  v_uid         UUID := gen_random_uuid();
  v_fixture_id  UUID;
  v_outcome_home UUID;
  v_usdt_before NUMERIC;
  v_usdt_after  NUMERIC;
  v_locked      NUMERIC;
  v_bet         JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e7_sports_place_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '10000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:e7-place-usdt',
      'leagueCode', 'epl',
      'homeName', 'Home FC',
      'awayName', 'Away FC',
      'kickoffAt', (NOW() + INTERVAL '3 days')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:e7-place-usdt:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:e7-place-usdt:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:e7-place-usdt:match_1x2:draw', 'selection', 'draw'),
        jsonb_build_object('outcomeId', 'test-vendor:e7-place-usdt:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:e7-place-usdt:match_1x2:home',
    'odds', '2.000000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:e7-place-usdt';
  SELECT id INTO v_outcome_home FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:e7-place-usdt:match_1x2:home';

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_before;

  v_bet := rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_outcome_home, 'odds_at_bet', '2.000000')),
    '100.000000',
    'USDT',
    'e7-sports-usdt-idem-' || v_uid::TEXT
  );
  ASSERT (v_bet->>'already_placed')::BOOLEAN = FALSE, 'first USDT sports place must not replay';
  ASSERT (SELECT currency FROM sports_bets WHERE id = (v_bet->>'bet_id')::UUID) = 'USDT',
    'sports_bets.currency must be USDT';

  SELECT usdt_locked::NUMERIC INTO v_locked FROM wallets WHERE user_id = v_uid;
  ASSERT v_locked = 100, format('USDT sports stake must lock 100, got %s', v_locked);

  PERFORM rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_outcome_home, 'odds_at_bet', '2.000000')),
    '100.000000',
    'USDT',
    'e7-sports-usdt-idem-' || v_uid::TEXT
  );

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;
  ASSERT v_usdt_after = v_usdt_before,
    format('USDT not conserved after sports place: before=%s after=%s', v_usdt_before, v_usdt_after);

  ASSERT (SELECT COUNT(*) FROM sports_bets WHERE user_id = v_uid) = 1,
    'USDT sports idempotency must not duplicate bet rows';

  RAISE NOTICE 'E7 SPORTS USDT PLACE OK — lock, idempotent replay, Σ=0';
END;
$$;
ROLLBACK;

-- ── 4. Sports USDT: win settle releases lock and conserves Σ=0 ──────────────
BEGIN;
DO $$
DECLARE
  v_uid          UUID := gen_random_uuid();
  v_outcome_home UUID;
  v_fixture_id   UUID;
  v_bet_id       UUID;
  v_usdt_before  NUMERIC;
  v_usdt_after   NUMERIC;
  v_locked       NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e7_sports_settle_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '10000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:e7-settle-usdt',
      'leagueCode', 'epl',
      'homeName', 'Winners',
      'awayName', 'Losers',
      'kickoffAt', (NOW() + INTERVAL '3 days')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:e7-settle-usdt:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:e7-settle-usdt:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:e7-settle-usdt:match_1x2:draw', 'selection', 'draw'),
        jsonb_build_object('outcomeId', 'test-vendor:e7-settle-usdt:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:e7-settle-usdt:match_1x2:home',
    'odds', '2.000000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:e7-settle-usdt';
  SELECT id INTO v_outcome_home FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:e7-settle-usdt:match_1x2:home';

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_before;

  v_bet_id := (rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_outcome_home, 'odds_at_bet', '2.000000')),
    '100.000000',
    'USDT',
    'e7-sports-settle-' || v_uid::TEXT
  )->>'bet_id')::UUID;

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_settle_sports_fixture(v_fixture_id, 'home', 'e7_ft');

  SELECT usdt_locked::NUMERIC INTO v_locked FROM wallets WHERE user_id = v_uid;
  ASSERT v_locked = 0, format('USDT sports stake lock must release after settle, got %s', v_locked);

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;
  ASSERT v_usdt_after = v_usdt_before,
    format('USDT not conserved after sports win settle: before=%s after=%s', v_usdt_before, v_usdt_after);

  ASSERT (SELECT status FROM sports_bets WHERE id = v_bet_id) = 'won', 'USDT sports bet must be won';
  ASSERT EXISTS (
    SELECT 1 FROM system_account_ledger
     WHERE account_code = 'sports_house_usdt'
       AND related_user_id = v_uid
  ), 'sports_house_usdt leg must exist after settle';

  RAISE NOTICE 'E7 SPORTS USDT SETTLE OK — lock released, win settled, Σ=0';
END;
$$;
ROLLBACK;
