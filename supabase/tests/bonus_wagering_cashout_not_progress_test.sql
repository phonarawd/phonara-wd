-- ============================================================
-- Bonus wagering — sports partial cashout must NOT reduce remaining
-- Regression for 20260828000001_fix_phon_wagering_bet_reason_cashout
-- ============================================================

BEGIN;
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_wagering_before TEXT;
  v_wagering_after TEXT;
  v_wagering_mid TEXT;
  v_grand_before NUMERIC;
  v_grand_after NUMERIC;
  v_is_cashout BOOLEAN;
  v_is_lock BOOLEAN;
  v_is_gbet BOOLEAN;
  v_is_settle BOOLEAN;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'bwr_cashout_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_uid::TEXT)::TEXT, true);

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_grand_before;

  -- Classifier unit checks (no wallet side effects)
  v_is_cashout := _is_phon_wagering_bet_reason('sports_stake_cashout');
  v_is_lock := _is_phon_wagering_bet_reason('sports_stake_lock');
  v_is_gbet := _is_phon_wagering_bet_reason('gbet_debit');
  v_is_settle := _is_phon_wagering_bet_reason('game_stake_settle');

  ASSERT v_is_cashout = FALSE,
    'sports_stake_cashout must NOT be a wagering bet reason';
  ASSERT v_is_lock = TRUE,
    'sports_stake_lock must remain a wagering bet reason';
  ASSERT v_is_gbet = FALSE,
    'dead gbet_* reason prefix must NOT count as wagering';
  ASSERT v_is_settle = FALSE,
    'game_stake_settle must NOT double-count after game_stake_lock';

  -- Mission reward → bonus + active wagering obligation (100 @ 1x)
  PERFORM _credit_wallet_internal(
    v_uid, 'PHON', '100.000000', 'mission_reward',
    'bwr_cashout_bonus:' || v_uid::TEXT
  );

  -- Real bucket so cashout debit (real-first non-bet path) can succeed
  PERFORM _credit_wallet_internal(
    v_uid, 'PHON', '50.000000', 'test_funding',
    'bwr_cashout_real:' || v_uid::TEXT
  );
  PERFORM _debit_system_account(
    'reward_issuance_phon', '50.000000', 'test_funding',
    v_uid, 'bwr_cashout_real:' || v_uid::TEXT, NULL
  );

  SELECT wagering_remaining INTO v_wagering_before
    FROM bonus_wagering_requirements
   WHERE user_id = v_uid AND status = 'active'
   ORDER BY created_at DESC LIMIT 1;

  ASSERT v_wagering_before = '100.000000',
    format('expected wagering 100 got %s', v_wagering_before);

  -- Repeated partial-cashout stake debits must leave wagering_remaining unchanged.
  -- Pair each debit with sports_house credit (production cashout Σ=0 shape).
  PERFORM _debit_wallet_internal(
    v_uid, 'PHON', '10.000000', 'sports_stake_cashout',
    'bwr_cashout_d1:' || v_uid::TEXT
  );
  PERFORM _credit_system_account(
    'sports_house_phon', '10.000000', 'sports_house_cashout',
    v_uid, 'bwr_cashout_d1:' || v_uid::TEXT, NULL
  );
  PERFORM _debit_wallet_internal(
    v_uid, 'PHON', '10.000000', 'sports_stake_cashout',
    'bwr_cashout_d2:' || v_uid::TEXT
  );
  PERFORM _credit_system_account(
    'sports_house_phon', '10.000000', 'sports_house_cashout',
    v_uid, 'bwr_cashout_d2:' || v_uid::TEXT, NULL
  );

  SELECT wagering_remaining INTO v_wagering_mid
    FROM bonus_wagering_requirements
   WHERE user_id = v_uid AND status = 'active'
   ORDER BY created_at DESC LIMIT 1;

  ASSERT v_wagering_mid = v_wagering_before,
    format(
      'cashout must not reduce wagering_remaining before=%s after=%s',
      v_wagering_before, v_wagering_mid
    );

  -- Positive control: new sports stake lock still applies wagering progress
  PERFORM _lock_wallet_internal(
    v_uid, 'PHON', '20.000000', 'sports_stake_lock',
    'bwr_cashout_lock:' || v_uid::TEXT
  );

  SELECT wagering_remaining INTO v_wagering_after
    FROM bonus_wagering_requirements
   WHERE user_id = v_uid AND status = 'active'
   ORDER BY created_at DESC LIMIT 1;

  ASSERT v_wagering_after = '80.000000',
    format('sports_stake_lock should reduce wagering by 20 got %s', v_wagering_after);

  ASSERT NOT EXISTS (SELECT 1 FROM verify_ledger_hash_chain(v_uid)),
    'wallet_ledger hash chain broken after cashout wagering regression flow';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_grand_after;

  ASSERT v_grand_before = v_grand_after,
    format('conservation broken before=%s after=%s', v_grand_before, v_grand_after);

  RAISE NOTICE
    'BONUS WAGERING CASHOUT NOT PROGRESS OK — classifier · cashout×2 no-op · lock -20 · hash-chain · Σ=0';
END;
$$;
ROLLBACK;
