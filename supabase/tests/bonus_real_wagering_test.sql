-- ============================================================
-- Bonus/real PHON track — conservation + wagering + real-only withdrawal
-- ============================================================

BEGIN;
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_grand_before NUMERIC;
  v_grand_after NUMERIC;
  v_bonus TEXT;
  v_real TEXT;
  v_wagering TEXT;
  v_completed INT;
  v_ledger UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'bonus_real_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_uid::TEXT)::TEXT, true);

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_grand_before;

  -- Mission reward → bonus bucket
  v_ledger := _credit_wallet_internal(
    v_uid, 'PHON', '100.000000', 'mission_reward', 'bwr_test_credit:' || v_uid::TEXT
  );

  SELECT phon_bonus_available, phon_real_available
    INTO v_bonus, v_real
    FROM wallets WHERE user_id = v_uid;

  ASSERT v_bonus = '100.000000', format('expected bonus 100 got %s', v_bonus);
  ASSERT v_real = '0.000000', format('expected real 0 got %s', v_real);

  SELECT wagering_remaining INTO v_wagering
    FROM bonus_wagering_requirements
   WHERE user_id = v_uid AND status = 'active'
   ORDER BY created_at DESC LIMIT 1;

  ASSERT v_wagering = '100.000000', format('wagering should be 100 got %s', v_wagering);

  -- Deposit-style credit → real bucket (paired system leg in caller)
  PERFORM _credit_wallet_internal(
    v_uid, 'PHON', '50.000000', 'test_funding', 'bwr_test_real:' || v_uid::TEXT
  );
  PERFORM _debit_system_account(
    'reward_issuance_phon', '50.000000', 'test_funding',
    v_uid, 'bwr_test_real:' || v_uid::TEXT, NULL
  );

  SELECT phon_bonus_available, phon_real_available
    INTO v_bonus, v_real
    FROM wallets WHERE user_id = v_uid;

  ASSERT v_bonus = '100.000000';
  ASSERT v_real = '50.000000';

  -- Wagering progress (bet volume) without orphan debit leg
  PERFORM _apply_wagering_progress(v_uid, '100.000000');

  SELECT COUNT(*) INTO v_completed
    FROM bonus_wagering_requirements
   WHERE user_id = v_uid AND status = 'completed';

  ASSERT v_completed = 1, 'wagering obligation should complete after 100 volume';

  -- Completed wagering promotes remaining bonus → real
  SELECT phon_bonus_available, phon_real_available
    INTO v_bonus, v_real
    FROM wallets WHERE user_id = v_uid;

  ASSERT v_bonus = '0.000000', format('bonus promoted got %s', v_bonus);
  ASSERT v_real = '150.000000', format('real should be 50 seed + 100 promoted got %s', v_real);

  -- Withdrawal lock rejects when real insufficient (150 available, lock 200)
  BEGIN
    PERFORM _lock_wallet_internal(
      v_uid, 'PHON', '200.000000', 'withdrawal_request_lock', 'bwr_test_wd_fail:' || v_uid::TEXT
    );
    RAISE EXCEPTION 'withdrawal should reject when real insufficient';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%insufficient_available%' THEN
      RAISE;
    END IF;
  END;

  PERFORM _lock_wallet_internal(
    v_uid, 'PHON', '30.000000', 'withdrawal_request_lock', 'bwr_test_wd_ok:' || v_uid::TEXT
  );

  SELECT phon_real_locked INTO v_real FROM wallets WHERE user_id = v_uid;
  ASSERT v_real = '30.000000', format('real locked 30 got %s', v_real);

  -- Hash-chain integrity for all wallet ledger rows touched in this flow
  ASSERT NOT EXISTS (SELECT 1 FROM verify_ledger_hash_chain(v_uid)),
    'wallet_ledger hash chain broken after bonus/real wagering flow';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_grand_after;

  ASSERT v_grand_before = v_grand_after,
    format('conservation broken before=%s after=%s', v_grand_before, v_grand_after);

  RAISE NOTICE 'BONUS REAL WAGERING OK — bonus credit · wagering · real-only withdrawal lock · hash-chain · Σ=0';
END;
$$;
ROLLBACK;
