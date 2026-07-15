-- ============================================================
-- PIR E3 — Golden Earth lock-late + global jackpot idempotency
-- ============================================================
-- Anchors:
--   • _golden_earth_secure_roll (gen_random_bytes · REVOKE anon/auth)
--   • rpc_golden_earth_tap: global FOR UPDATE after user-local prep
--   • global counter UPDATE after wallet credit
--   • no random() in tap body · golden_earth:gjp:{total} idempotency
--   • live global jackpot path + double-credit defense
-- ============================================================

-- ── Test 0: functiondef invariants ──────────────────────────────────────────
BEGIN;

DO $$
DECLARE
  v_roll_def TEXT;
  v_tap_def  TEXT;
  v_pos_first_tap INT;
  v_pos_global_lock INT;
  v_pos_credit INT;
  v_pos_global_upd INT;
BEGIN
  ASSERT to_regprocedure('public._golden_earth_secure_roll(integer)') IS NOT NULL,
    '_golden_earth_secure_roll(integer) must exist';

  v_roll_def := pg_get_functiondef('public._golden_earth_secure_roll(integer)'::regprocedure);
  ASSERT position('gen_random_bytes' IN v_roll_def) > 0,
    '_golden_earth_secure_roll must use extensions.gen_random_bytes';
  ASSERT position('random()' IN v_roll_def) = 0,
    '_golden_earth_secure_roll must not call random()';

  ASSERT NOT has_function_privilege('anon', 'public._golden_earth_secure_roll(integer)', 'EXECUTE'),
    'anon must NOT EXECUTE _golden_earth_secure_roll';
  ASSERT NOT has_function_privilege('authenticated', 'public._golden_earth_secure_roll(integer)', 'EXECUTE'),
    'authenticated must NOT EXECUTE _golden_earth_secure_roll';

  v_tap_def := pg_get_functiondef('public.rpc_golden_earth_tap(text)'::regprocedure);

  ASSERT position('_golden_earth_secure_roll' IN v_tap_def) > 0,
    'rpc_golden_earth_tap must use _golden_earth_secure_roll';
  ASSERT position('random()' IN v_tap_def) = 0,
    'rpc_golden_earth_tap must not call random()';
  ASSERT position('golden_earth:gjp:' IN v_tap_def) > 0,
    'rpc_golden_earth_tap must use golden_earth:gjp: idempotency for global jackpot';

  v_pos_first_tap := position('first_tap_claimed' IN v_tap_def);
  v_pos_global_lock := position('FROM golden_earth_global WHERE id = 1 FOR UPDATE' IN v_tap_def);
  v_pos_credit := position('_credit_wallet_internal' IN v_tap_def);
  v_pos_global_upd := position('UPDATE golden_earth_global SET total_taps' IN v_tap_def);

  ASSERT v_pos_first_tap > 0, 'tap must handle first_tap_claimed';
  ASSERT v_pos_global_lock > 0, 'tap must FOR UPDATE golden_earth_global';
  ASSERT v_pos_credit > 0, 'tap must credit wallet';
  ASSERT v_pos_global_upd > 0, 'tap must UPDATE golden_earth_global.total_taps';

  ASSERT v_pos_global_lock > v_pos_first_tap,
    'global FOR UPDATE must come after user-local first_tap prep (lock-late)';
  ASSERT v_pos_credit > v_pos_global_lock,
    'wallet credit must come after late global lock (jackpot amount known)';
  ASSERT v_pos_global_upd > v_pos_credit,
    'global counter UPDATE must come after wallet credit (TX tail)';

  RAISE NOTICE 'PIR E3-0 OK — secure roll + lock-late + gjp anchors';
END;
$$;

ROLLBACK;

-- ── Test 1: global jackpot path + gjp idempotency + conservation ────────────
BEGIN;

DO $$
DECLARE
  v_uid            UUID := gen_random_uuid();
  v_every          BIGINT;
  v_before_taps    BIGINT;
  v_after_taps     BIGINT;
  v_tap            JSONB;
  v_gjp_key        TEXT;
  v_ledger_id      UUID;
  v_ledger_id2     UUID;
  v_wallet_before  NUMERIC;
  v_wallet_mid     NUMERIC;
  v_wallet_after   NUMERIC;
  v_grand_before   NUMERIC;
  v_grand_after    NUMERIC;
  v_jp_count       INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'ge_pir_e3_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  -- Deterministic: no mini jackpot noise; force next tap to hit global milestone.
  UPDATE app_config SET value = '0' WHERE key = 'golden_earth_jackpot_chance_bps';
  UPDATE app_config SET value = '10000.000000' WHERE key = 'golden_earth_global_jackpot_min';
  UPDATE app_config SET value = '10000.000000' WHERE key = 'golden_earth_global_jackpot_max';
  -- Avoid first-tap floor overshadowing assertions on amount range.
  UPDATE app_config SET value = '3.000000' WHERE key = 'golden_earth_first_tap_min';

  SELECT jackpot_every, total_taps INTO v_every, v_before_taps
    FROM golden_earth_global WHERE id = 1 FOR UPDATE;
  UPDATE golden_earth_global
     SET total_taps = v_every - 1,
         updated_at = NOW()
   WHERE id = 1;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC),0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='PHON')
  INTO v_grand_before;

  SELECT phon_available::NUMERIC INTO v_wallet_before FROM wallets WHERE user_id = v_uid;

  v_tap := rpc_golden_earth_tap('pir-e3-gjp-1');
  ASSERT (v_tap->>'ok')::BOOLEAN = TRUE, 'global jackpot tap failed';
  ASSERT (v_tap->>'duplicate')::BOOLEAN = FALSE, 'unexpected duplicate';
  ASSERT (v_tap->>'is_global_jackpot')::BOOLEAN = TRUE, 'expected global jackpot';
  ASSERT (v_tap->>'is_jackpot')::BOOLEAN = TRUE, 'global jackpot must set is_jackpot';
  ASSERT (v_tap->>'phon_awarded')::NUMERIC = 10000, 'fixed global jackpot amount';
  ASSERT (v_tap->>'global_total')::BIGINT = v_every,
    format('global_total expected %s got %s', v_every, v_tap->>'global_total');

  SELECT total_taps INTO v_after_taps FROM golden_earth_global WHERE id = 1;
  ASSERT v_after_taps = v_every, 'global total_taps must advance to milestone';

  v_gjp_key := 'golden_earth:gjp:' || v_every::TEXT;
  SELECT id INTO v_ledger_id FROM wallet_ledger WHERE idempotency_key = v_gjp_key;
  ASSERT v_ledger_id IS NOT NULL, 'gjp ledger row missing';
  ASSERT (SELECT amount::NUMERIC FROM wallet_ledger WHERE id = v_ledger_id) = 10000,
    'gjp ledger amount mismatch';

  SELECT COUNT(*)::INT INTO v_jp_count
    FROM golden_earth_taps
   WHERE user_id = v_uid AND is_global_jackpot = TRUE;
  ASSERT v_jp_count = 1, 'exactly one global jackpot tap row';

  SELECT phon_available::NUMERIC INTO v_wallet_mid FROM wallets WHERE user_id = v_uid;
  ASSERT v_wallet_mid = v_wallet_before + 10000, 'wallet must gain global jackpot PHON';

  -- Defense in depth: re-credit same gjp key must be a no-op.
  v_ledger_id2 := _credit_wallet_internal(
    v_uid, 'PHON', '999999.000000', 'golden_earth_jackpot', v_gjp_key
  );
  ASSERT v_ledger_id2 = v_ledger_id, 'gjp idempotency must return existing ledger id';
  SELECT phon_available::NUMERIC INTO v_wallet_after FROM wallets WHERE user_id = v_uid;
  ASSERT v_wallet_after = v_wallet_mid, 'gjp re-credit must not change wallet';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC),0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='PHON')
  INTO v_grand_after;

  ASSERT v_grand_after = v_grand_before,
    format('PHON not conserved after global jackpot: before=%s after=%s', v_grand_before, v_grand_after);

  ASSERT NOT EXISTS (SELECT 1 FROM verify_ledger_hash_chain(v_uid)),
    'hash chain broken after global jackpot';

  -- Client idempotency still works on the same request id.
  v_tap := rpc_golden_earth_tap('pir-e3-gjp-1');
  ASSERT (v_tap->>'duplicate')::BOOLEAN = TRUE, 'client_request_id duplicate failed';

  RAISE NOTICE 'PIR E3-1 OK — global jackpot + gjp idempotency · wallet_gain=10000 · conserved';
END;
$$;

ROLLBACK;

-- ── Test 2: non-jackpot tap still uses request idempotency (no gjp key) ─────
BEGIN;

DO $$
DECLARE
  v_uid   UUID := gen_random_uuid();
  v_tap   JSONB;
  v_every BIGINT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'ge_pir_e3n_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  UPDATE app_config SET value = '0' WHERE key = 'golden_earth_jackpot_chance_bps';
  UPDATE app_config SET value = '3.000000' WHERE key = 'golden_earth_first_tap_min';

  -- Ensure next tap is NOT a global milestone.
  SELECT jackpot_every INTO v_every FROM golden_earth_global WHERE id = 1;
  UPDATE golden_earth_global
     SET total_taps = v_every - 2,
         updated_at = NOW()
   WHERE id = 1;

  v_tap := rpc_golden_earth_tap('pir-e3-normal-1');
  ASSERT (v_tap->>'ok')::BOOLEAN = TRUE, 'normal tap failed';
  ASSERT COALESCE((v_tap->>'is_global_jackpot')::BOOLEAN, FALSE) = FALSE,
    'normal tap must not be global jackpot';
  ASSERT NOT EXISTS (
    SELECT 1 FROM wallet_ledger
     WHERE user_id = v_uid AND idempotency_key LIKE 'golden_earth:gjp:%'
  ), 'non-jackpot tap must not write gjp ledger key';
  ASSERT EXISTS (
    SELECT 1 FROM wallet_ledger
     WHERE user_id = v_uid AND idempotency_key = 'golden_earth:req:pir-e3-normal-1'
  ), 'normal tap must use request idempotency key';

  RAISE NOTICE 'PIR E3-2 OK — non-jackpot request idempotency';
END;
$$;

ROLLBACK;
