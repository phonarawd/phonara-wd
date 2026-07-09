-- ============================================================
-- Withdrawal MFA step-up — SQL integration test
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_blocked BOOLEAN := FALSE;
  v_msg TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (
    v_uid,
    'authenticated',
    'authenticated',
    'wd_mfa_' || v_uid::TEXT || '@test.local',
    NOW(),
    NOW()
  );

  INSERT INTO auth.mfa_factors (
    id, user_id, friendly_name, factor_type, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_uid,
    'test-totp',
    'totp',
    'verified',
    NOW(),
    NOW()
  );

  UPDATE profiles SET kyc_tier = 'id_verified' WHERE id = v_uid;
  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_uid, 'clear', NOW());

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_withdrawal_enabled';
  UPDATE app_config SET value = '0' WHERE key IN (
    'aml_min_account_age_hours', 'aml_rapid_credit_hours', 'aml_kyc_approval_cooldown_hours'
  );
  UPDATE treasury_reserves SET real_balance = '99999999.000000' WHERE currency = 'PHON';
  PERFORM rpc_run_reconciliation();

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT, 'aal', 'aal1')::TEXT, true);

  BEGIN
    PERFORM rpc_request_withdrawal('PHON', '10.000000', jsonb_build_object('type', 'bank', 'chain', 'BANK', 'account', '110123456789', 'address', '110123456789'), 'wd-mfa-block-001', NULL);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'withdrawal_mfa_required' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked,
    format('TOTP-enrolled user at aal1 must be blocked, got: %s', v_msg);

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'aal', 'aal2')::TEXT,
    true
  );

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  PERFORM _credit_wallet_internal(
    v_uid, 'PHON', '100.000000', 'crypto_deposit_credit', 'wd-mfa-fund:' || v_uid::TEXT
  );

  PERFORM rpc_request_withdrawal('PHON', '10.000000', jsonb_build_object('type', 'bank', 'chain', 'BANK', 'account', '110123456789', 'address', '110123456789'), 'wd-mfa-allow-001', NULL);

  RAISE NOTICE 'WITHDRAWAL MFA STEP-UP OK — aal1 blocked, aal2 allowed when TOTP enrolled';
END;
$$;

ROLLBACK;

BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_res JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (
    v_uid,
    'authenticated',
    'authenticated',
    'wd_nomfa_' || v_uid::TEXT || '@test.local',
    NOW(),
    NOW()
  );

  UPDATE profiles SET kyc_tier = 'id_verified' WHERE id = v_uid;
  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_uid, 'clear', NOW());

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_withdrawal_enabled';
  UPDATE app_config SET value = '0' WHERE key IN (
    'aml_min_account_age_hours', 'aml_rapid_credit_hours', 'aml_kyc_approval_cooldown_hours'
  );
  UPDATE treasury_reserves SET real_balance = '99999999.000000' WHERE currency = 'PHON';
  PERFORM rpc_run_reconciliation();

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT, 'aal', 'aal1')::TEXT, true);

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  PERFORM _credit_wallet_internal(
    v_uid, 'PHON', '100.000000', 'crypto_deposit_credit', 'wd-nomfa-fund:' || v_uid::TEXT
  );

  v_res := rpc_request_withdrawal('PHON', '10.000000', jsonb_build_object('type', 'bank', 'chain', 'BANK', 'account', '110123456789', 'address', '110123456789'), 'wd-nomfa-001', NULL);
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
    format('user without TOTP must withdraw at aal1, got %s', v_res);

  RAISE NOTICE 'WITHDRAWAL MFA SKIP OK — no TOTP factor allows aal1';
END;
$$;

ROLLBACK;
