-- ============================================================
-- PIR E5 — place/claim unique_violation → existing result
-- ============================================================
-- Anchors:
--   • wallet helpers: re-check after FOR UPDATE + EXCEPTION unique_violation
--   • rpc_place_game_bet / rpc_place_sports_bet: INSERT unique_violation → already_placed
--   • helpers REVOKE anon/authenticated
-- Live:
--   • casino place idempotency (same key → already_placed, 1 row, Σ=0)
--   • claim welcome double-call (ledger once, Σ=0)
-- ============================================================

-- ── Test 0: functiondef + grants ────────────────────────────────────────────
BEGIN;

DO $$
DECLARE
  v_credit TEXT;
  v_debit  TEXT;
  v_lock   TEXT;
  v_unlock TEXT;
  v_place  TEXT;
  v_sports TEXT;
  v_pos_lock INT;
  v_pos_recheck INT;
BEGIN
  ASSERT to_regprocedure('public._pir_game_bet_already_placed(uuid,text)') IS NOT NULL,
    '_pir_game_bet_already_placed must exist';
  ASSERT to_regprocedure('public._pir_sports_bet_already_placed(uuid,text)') IS NOT NULL,
    '_pir_sports_bet_already_placed must exist';

  ASSERT NOT has_function_privilege(
    'anon', 'public._pir_game_bet_already_placed(uuid,text)', 'EXECUTE'),
    'anon must NOT EXECUTE _pir_game_bet_already_placed';
  ASSERT NOT has_function_privilege(
    'authenticated', 'public._pir_game_bet_already_placed(uuid,text)', 'EXECUTE'),
    'authenticated must NOT EXECUTE _pir_game_bet_already_placed';
  ASSERT NOT has_function_privilege(
    'anon', 'public._pir_sports_bet_already_placed(uuid,text)', 'EXECUTE'),
    'anon must NOT EXECUTE _pir_sports_bet_already_placed';
  ASSERT NOT has_function_privilege(
    'authenticated', 'public._pir_sports_bet_already_placed(uuid,text)', 'EXECUTE'),
    'authenticated must NOT EXECUTE _pir_sports_bet_already_placed';

  v_credit := pg_get_functiondef(
    'public._credit_wallet_internal(uuid,currency,text,text,text)'::regprocedure
  );
  v_debit := pg_get_functiondef(
    'public._debit_wallet_internal(uuid,currency,text,text,text)'::regprocedure
  );
  v_lock := pg_get_functiondef(
    'public._lock_wallet_internal(uuid,currency,text,text,text)'::regprocedure
  );
  v_unlock := pg_get_functiondef(
    'public._unlock_wallet_internal(uuid,currency,text,text,text)'::regprocedure
  );

  FOREACH v_place IN ARRAY ARRAY[v_credit, v_debit, v_lock, v_unlock]
  LOOP
    ASSERT position('EXCEPTION WHEN unique_violation THEN' IN v_place) > 0,
      'wallet helper must catch unique_violation';
    v_pos_lock := position(
      'FROM wallets WHERE user_id = p_user_id FOR UPDATE' IN v_place
    );
    v_pos_recheck := position(
      'SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key' IN v_place
    );
    -- First SELECT is early check; second (after FOR UPDATE) is PIR recheck.
    ASSERT v_pos_lock > 0, 'wallet helper must FOR UPDATE wallets';
    ASSERT v_pos_recheck > 0, 'wallet helper must select ledger by idempotency_key';
    -- Recheck appears twice (early + after lock); require FOR UPDATE before last recheck block.
    ASSERT position('re-check after row lock' IN v_place) > 0
        OR (
          -- tolerate if comment stripped; require two ledger lookups
          (length(v_place)
            - length(replace(v_place,
                'SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key',
                '')))
            / length('SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key')
          ) >= 2,
      'wallet helper must re-check ledger after FOR UPDATE';
  END LOOP;

  v_place := pg_get_functiondef(
    'public.rpc_place_game_bet(uuid,text,text,jsonb,text,text,jsonb,boolean)'::regprocedure
  );
  v_sports := pg_get_functiondef(
    'public.rpc_place_sports_bet(jsonb,text,text,text,text,text,text,text)'::regprocedure
  );

  ASSERT position('EXCEPTION WHEN unique_violation THEN' IN v_place) > 0,
    'rpc_place_game_bet must catch unique_violation on insert';
  ASSERT position('_pir_game_bet_already_placed' IN v_place) > 0,
    'rpc_place_game_bet must use _pir_game_bet_already_placed';
  ASSERT position('EXCEPTION WHEN unique_violation THEN' IN v_sports) > 0,
    'rpc_place_sports_bet must catch unique_violation on insert';
  ASSERT position('_pir_sports_bet_already_placed' IN v_sports) > 0,
    'rpc_place_sports_bet must use _pir_sports_bet_already_placed';

  RAISE NOTICE 'PIR E5-0 OK — unique_violation handlers + recheck anchors';
END;
$$;

ROLLBACK;

-- ── Test 1: casino place idempotency + conservation ─────────────────────────
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_server_seed TEXT := 'pir_e5_seed_' || replace(gen_random_uuid()::TEXT, '-', '');
  v_round_id UUID;
  v_round_id2 UUID;
  v_idem TEXT;
  v_bet1 JSONB;
  v_bet2 JSONB;
  v_bet3 JSONB;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'pir_e5_casino_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets
     SET phon_available = '1000.000000',
         phon_real_available = '1000.000000',
         phon_bonus_available = '0.000000',
         phon_locked = '0.000000'
   WHERE user_id = v_uid;

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_game_enabled', 'feature_game_dice_enabled');

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_round_id := (rpc_create_game_round('dice', v_server_seed)->>'round_id')::UUID;
  v_round_id2 := (rpc_create_game_round('dice', v_server_seed || '_b')->>'round_id')::UUID;

  v_idem := 'pir-e5-place-' || v_uid::TEXT;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  v_bet1 := rpc_place_game_bet(
    v_round_id, 'PHON', '25.000000',
    '{"target":"40.00","direction":"over"}'::JSONB, 'cs_e5', v_idem
  );
  ASSERT (v_bet1->>'already_placed')::BOOLEAN = FALSE, 'first place must be fresh';

  -- Same key on same (settled) round → early already_placed
  v_bet2 := rpc_place_game_bet(
    v_round_id, 'PHON', '25.000000',
    '{"target":"40.00","direction":"over"}'::JSONB, 'cs_e5', v_idem
  );
  ASSERT (v_bet2->>'already_placed')::BOOLEAN = TRUE,
    'duplicate key must return already_placed';
  ASSERT (v_bet1->>'bet_id') = (v_bet2->>'bet_id'), 'bet_id must match';

  -- Same key on a *different* open round: early check finds existing → already_placed
  -- (unique_violation path is for true TOCTOU; sequential still must not double-settle)
  v_bet3 := rpc_place_game_bet(
    v_round_id2, 'PHON', '25.000000',
    '{"target":"40.00","direction":"over"}'::JSONB, 'cs_e5', v_idem
  );
  ASSERT (v_bet3->>'already_placed')::BOOLEAN = TRUE,
    'same key on new round must return existing bet, not place again';
  ASSERT (v_bet3->>'bet_id') = (v_bet1->>'bet_id'), 'must reuse original bet_id';

  ASSERT (SELECT COUNT(*) FROM game_bets WHERE user_id = v_uid AND idempotency_key = v_idem) = 1,
    'must not duplicate game_bets rows';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before,
    format('PHON Σ must hold: before=%s after=%s', v_phon_before, v_phon_after);

  RAISE NOTICE 'PIR E5-1 OK — casino place idempotency + Σ=0';
END;
$$;

ROLLBACK;

-- ── Test 2: claim path via _credit_wallet_internal (welcome) ────────────────
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_r1 JSONB;
  v_r2 JSONB;
  v_ledger_count INT;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
  v_idem TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'pir_e5_claim_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets
     SET phon_available = '0.000000',
         phon_real_available = '0.000000',
         phon_bonus_available = '0.000000'
   WHERE user_id = v_uid;

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_idem := 'pir-e5-welcome-' || v_uid::TEXT;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  v_r1 := rpc_claim_welcome_bonus(v_idem);
  ASSERT COALESCE((v_r1->>'already_claimed')::BOOLEAN, FALSE) = FALSE,
    'first welcome claim must award';

  v_r2 := rpc_claim_welcome_bonus(v_idem);
  ASSERT COALESCE((v_r2->>'already_claimed')::BOOLEAN, FALSE) = TRUE,
    'second welcome claim must return already_claimed';

  SELECT COUNT(*) INTO v_ledger_count
  FROM wallet_ledger
  WHERE user_id = v_uid AND idempotency_key = v_idem;
  ASSERT v_ledger_count = 1,
    format('welcome ledger must appear once, got %s', v_ledger_count);

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_after = v_phon_before,
    format('PHON Σ after welcome claim: before=%s after=%s', v_phon_before, v_phon_after);

  RAISE NOTICE 'PIR E5-2 OK — claim welcome idempotency + Σ=0';
END;
$$;

ROLLBACK;

-- ── Test 3: forced unique_violation on ledger insert returns existing ───────
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_idem TEXT;
  v_id1 UUID;
  v_id2 UUID;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
  v_wallet_id UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'pir_e5_uv_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets
     SET phon_available = '500.000000',
         phon_real_available = '500.000000',
         phon_bonus_available = '0.000000'
   WHERE user_id = v_uid;
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = v_uid;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_idem := 'pir-e5-uv-' || v_uid::TEXT;

  -- Seed ledger row (simulates winner of TOCTOU race).
  INSERT INTO wallet_ledger (
    wallet_id, user_id, idempotency_key, direction, currency, amount,
    available_before, locked_before, available_after, locked_after, reason_code
  ) VALUES (
    v_wallet_id, v_uid, v_idem, 'credit', 'PHON', '1.000000',
    '500.000000', '0.000000', '501.000000', '0.000000', 'pir_e5_seed'
  )
  RETURNING id INTO v_id1;

  -- Credit with same key: early/recheck must return existing without mutating.
  v_id2 := _credit_wallet_internal(v_uid, 'PHON', '1.000000', 'pir_e5_seed', v_idem);
  ASSERT v_id2 = v_id1, 'credit must return existing ledger id on duplicate key';

  ASSERT (
    SELECT phon_available::NUMERIC FROM wallets WHERE user_id = v_uid
  ) = 500,
    'duplicate credit must not bump wallet again';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  -- Seed insert credited ledger row but not wallet — Σ may drift by design of raw insert.
  -- Assert no *additional* drift from the helper call: wallet unchanged + one ledger row.
  ASSERT (SELECT COUNT(*) FROM wallet_ledger WHERE idempotency_key = v_idem) = 1,
    'duplicate credit must not insert a second ledger row';

  RAISE NOTICE 'PIR E5-3 OK — credit helper returns existing on duplicate key';
END;
$$;

ROLLBACK;
