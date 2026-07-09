-- PHON → KRW bank withdrawal: rate snapshot, admin approve/sent, conservation Σ=0
BEGIN;
DO $$
DECLARE
  v_uid           UUID := gen_random_uuid();
  v_admin         UUID := gen_random_uuid();
  v_wr_id         UUID;
  v_res           JSONB;
  v_rate_id       UUID;
  v_total_before  NUMERIC;
  v_total_after   NUMERIC;
  v_expected_krw  TEXT;
  v_stored_krw    TEXT;
  v_stored_rate   UUID;
  v_status        withdrawal_status;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid, 'authenticated', 'authenticated', 'krw_wd_' || v_uid::TEXT || '@test.local', NOW(), NOW()),
    (v_admin, 'authenticated', 'authenticated', 'krw_wd_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET kyc_tier = 'id_verified' WHERE id = v_uid;
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'test', TRUE
    FROM unnest(ARRAY[
      'terms_of_service','privacy_policy','risk_disclosure','age_verification'
    ]::TEXT[]) AS doc_type;

  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_uid, 'clear', NOW());

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled', 'withdrawal_mfa_step_up_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_withdrawal_enabled';
  UPDATE app_config SET value = '0' WHERE key IN (
    'aml_min_account_age_hours', 'aml_rapid_credit_hours', 'aml_kyc_approval_cooldown_hours'
  );
  UPDATE treasury_reserves SET real_balance = '99999999.000000' WHERE currency = 'PHON';
  PERFORM rpc_run_reconciliation();

  UPDATE exchange_rate_snapshots SET is_active = FALSE
   WHERE base_currency = 'PHON' AND quote_currency = 'KRW';
  INSERT INTO exchange_rate_snapshots (base_currency, quote_currency, rate, source, is_active)
  VALUES ('PHON', 'KRW', '10.000000', 'krw_wd_test', TRUE)
  RETURNING id INTO v_rate_id;

  PERFORM _credit_wallet_internal(
    v_uid, 'PHON', '100.000000', 'test_funding', 'krw_wd_fund:' || v_uid::TEXT
  );

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_total_before;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  v_res := rpc_request_withdrawal(
    'PHON',
    '25.000000',
    jsonb_build_object('type', 'bank', 'account', '110123456789'),
    'krw-wd-rate-001',
    NULL
  );
  v_wr_id := (v_res->>'withdrawal_id')::UUID;
  v_expected_krw := v_res->>'expected_krw';

  ASSERT v_expected_krw = '250.000000',
    format('expected_krw in response must be 250, got %s', COALESCE(v_expected_krw, '<null>'));

  SELECT expected_krw, rate_snapshot_id, status
    INTO v_stored_krw, v_stored_rate, v_status
  FROM withdrawal_requests
  WHERE id = v_wr_id;

  ASSERT v_stored_krw = '250.000000',
    format('expected_krw row must be 250, got %s', COALESCE(v_stored_krw, '<null>'));
  ASSERT v_stored_rate = v_rate_id, 'rate_snapshot_id must match active PHON/KRW snapshot';
  ASSERT v_status = 'pending', format('request must stay pending, got %s', v_status);

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, true);
  PERFORM rpc_approve_withdrawal(v_wr_id, 'KRW bank transfer approved');
  PERFORM rpc_mark_withdrawal_sent(v_wr_id, 'KRW bank transfer sent');

  SELECT status INTO v_status FROM withdrawal_requests WHERE id = v_wr_id;
  ASSERT v_status::TEXT = 'sent', format('sent lifecycle must complete, got %s', v_status);

  ASSERT EXISTS (
    SELECT 1 FROM audit_logs
     WHERE actor_id = v_admin
       AND action = 'withdrawal_approved'
       AND entity_id = v_wr_id
  ), 'approve must write audit log';

  ASSERT EXISTS (
    SELECT 1 FROM audit_logs
     WHERE actor_id = v_admin
       AND action = 'withdrawal_sent'
       AND entity_id = v_wr_id
  ), 'sent must write audit log';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_total_after;

  ASSERT v_total_after = v_total_before,
    format('PHON Σ must stay 0 across KRW withdraw lifecycle: before=%s after=%s',
      v_total_before, v_total_after);

  RAISE NOTICE 'KRW PHON WITHDRAWAL RATE + ADMIN LIFECYCLE OK';
END;
$$;
ROLLBACK;
