-- ============================================================
-- Sportsbook place bet conservation (Wave-S3)
--
-- Authoritative stake lock: `rpc_place_sports_bet` only.
-- Currency under test: PHON (hardcoded in this file).
-- USDT sportsbook place/settle Σ=0: usdt_betting_proof_e7_test.sql (ZA-19 discoverability)
-- Negative guards (odds_changed · stale · duplicate_fixture · cancelled fixture):
--   sportsbook_place_negative_test.sql
-- Exposure cap · RG limits: sportsbook_exposure_cap_test.sql · sportsbook_rg_loss_test.sql
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_fixture_id UUID;
  v_outcome_home UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
  v_locked_after NUMERIC;
  v_bet JSONB;
  v_bet_id UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_place_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '10000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:place-1',
      'leagueCode', 'epl',
      'homeName', 'Home FC',
      'awayName', 'Away FC',
      'kickoffAt', (NOW() + INTERVAL '3 days')::TEXT,
      'status', 'scheduled'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:place-1:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:place-1:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:place-1:match_1x2:draw', 'selection', 'draw'),
        jsonb_build_object('outcomeId', 'test-vendor:place-1:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:place-1:match_1x2:home',
    'odds', '2.000000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:place-1';
  SELECT id INTO v_outcome_home FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:place-1:match_1x2:home';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_bet := rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_outcome_home, 'odds_at_bet', '2.000000')),
    '100.000000',
    'PHON',
    'sports-test-idem-' || v_uid::TEXT
  );
  v_bet_id := (v_bet->>'bet_id')::UUID;
  ASSERT (v_bet->>'already_placed')::BOOLEAN = FALSE, 'first place should not replay';

  SELECT phon_locked::NUMERIC INTO v_locked_after FROM wallets WHERE user_id = v_uid;
  ASSERT v_locked_after = 100, format('stake should be locked, got %s', v_locked_after);

  PERFORM rpc_place_sports_bet(
    jsonb_build_array(jsonb_build_object('outcome_id', v_outcome_home, 'odds_at_bet', '2.000000')),
    '100.000000',
    'PHON',
    'sports-test-idem-' || v_uid::TEXT
  );

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before,
    format('PHON not conserved after place: before=%s after=%s', v_phon_before, v_phon_after);

  ASSERT (SELECT COUNT(*) FROM sports_bets WHERE user_id = v_uid) = 1,
    'idempotency must not duplicate bet rows';
END;
$$;

-- ============================================================
-- Wave 0.5 (sb-w05-prematch-hard-gate) — live fixture + flag off must reject.
-- Pre-match-only hard gate: `feature_sports_live_betting_enabled` defaults to
-- 'false' (migration 20260827000001). A `live` fixture leg must be blocked by
-- `feature_disabled` (HINT=sports_live_betting) with zero money movement,
-- while the pre-match path above stays completely unaffected.
-- ============================================================
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_fixture_id UUID;
  v_outcome_home UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
  v_locked NUMERIC;
  v_rejected BOOLEAN := FALSE;
  v_msg TEXT;
  v_hint TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sports_live_gate_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '10000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'true' WHERE key = 'feature_sports_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  -- Explicit + defensive: this Wave 0.5 kill switch must be 'false' regardless
  -- of prior state in this session (migration seeds it, but assert it here too).
  UPDATE app_config SET value = 'false' WHERE key = 'feature_sports_live_betting_enabled';

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'event_upsert',
    'fixture', jsonb_build_object(
      'fixtureId', 'test-vendor:live-gate-1',
      'leagueCode', 'epl',
      'homeName', 'Home FC',
      'awayName', 'Away FC',
      'kickoffAt', (NOW() - INTERVAL '10 minutes')::TEXT,
      'status', 'live'
    ),
    'markets', jsonb_build_array(jsonb_build_object(
      'marketId', 'test-vendor:live-gate-1:match_1x2',
      'marketType', 'match_1x2',
      'status', 'open',
      'outcomes', jsonb_build_array(
        jsonb_build_object('outcomeId', 'test-vendor:live-gate-1:match_1x2:home', 'selection', 'home'),
        jsonb_build_object('outcomeId', 'test-vendor:live-gate-1:match_1x2:draw', 'selection', 'draw'),
        jsonb_build_object('outcomeId', 'test-vendor:live-gate-1:match_1x2:away', 'selection', 'away')
      )
    ))
  ));

  PERFORM rpc_ingest_sports_c1(jsonb_build_object(
    'type', 'odds_upsert',
    'outcomeId', 'test-vendor:live-gate-1:match_1x2:home',
    'odds', '2.000000',
    'capturedAt', NOW()::TEXT
  ));

  SELECT id INTO v_fixture_id FROM sports_fixtures WHERE canonical_fixture_id = 'test-vendor:live-gate-1';
  SELECT id INTO v_outcome_home FROM sports_outcomes WHERE canonical_outcome_id = 'test-vendor:live-gate-1:match_1x2:home';
  ASSERT (SELECT status FROM sports_fixtures WHERE id = v_fixture_id) = 'live',
    'fixture must be ingested as live for this gate test';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  BEGIN
    PERFORM rpc_place_sports_bet(
      jsonb_build_array(jsonb_build_object('outcome_id', v_outcome_home, 'odds_at_bet', '2.000000')),
      '100.000000',
      'PHON',
      'sports-live-gate-idem-' || v_uid::TEXT
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT, v_hint = PG_EXCEPTION_HINT;
    IF v_msg = 'feature_disabled' AND v_hint = 'sports_live_betting' THEN
      v_rejected := TRUE;
    END IF;
  END;

  ASSERT v_rejected,
    format('live fixture must be rejected by sports_live_betting gate, got msg=%s hint=%s', v_msg, v_hint);

  ASSERT (SELECT COUNT(*) FROM sports_bets WHERE user_id = v_uid) = 0,
    'rejected live bet must not create a sports_bets row';

  SELECT phon_locked::NUMERIC INTO v_locked FROM wallets WHERE user_id = v_uid;
  ASSERT v_locked = 0, format('rejected live bet must not lock stake, got %s', v_locked);

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before,
    format('PHON not conserved after rejected live bet: before=%s after=%s', v_phon_before, v_phon_after);
END;
$$;

ROLLBACK;
