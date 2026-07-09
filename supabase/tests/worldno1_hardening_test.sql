-- WorldNo1 vertical hardening — whitelist · admin staking · custody reconciliation
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_pool_id UUID;
  v_msg TEXT;
  v_blocked BOOLEAN := FALSE;
  v_forbidden BOOLEAN := FALSE;
  v_count INT;
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    v_uid,
    v_uid || '@hardening.test',
    crypt('testpass', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  );

  UPDATE profiles SET kyc_tier = 'id_verified' WHERE id = v_uid;
  UPDATE wallets SET phon_available = '10000' WHERE user_id = v_uid;
  INSERT INTO sanctions_screenings (user_id, status, screened_at) VALUES (v_uid, 'clear', NOW());

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;
  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_withdrawal_enabled';
  UPDATE app_config SET value = '0' WHERE key IN (
    'aml_min_account_age_hours', 'aml_rapid_credit_hours', 'aml_kyc_approval_cooldown_hours'
  );
  UPDATE treasury_reserves SET real_balance = '99999999.000000' WHERE currency = 'PHON';
  PERFORM rpc_run_reconciliation();
  UPDATE app_config SET value = 'false' WHERE key IN ('system_readonly', 'system_halt');

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated', 'aal', 'aal2')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  PERFORM rpc_record_consent('terms_of_service', '1.0', TRUE);
  PERFORM rpc_record_consent('privacy_policy', '1.0', TRUE);
  PERFORM rpc_record_consent('risk_disclosure', '1.0', TRUE);
  PERFORM rpc_record_consent('age_verification', '1.0', TRUE);

  PERFORM rpc_add_withdrawal_address('BANK', '1234567890123456', 'test bank');

  SELECT COUNT(*)::INT INTO v_count FROM rpc_list_withdrawal_addresses();
  ASSERT v_count = 1, 'whitelist row must be listable';

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;
  UPDATE app_config SET value = 'true' WHERE key = 'withdrawal_whitelist_enabled';
  UPDATE withdrawal_address_whitelist
     SET cooldown_until = NOW() - INTERVAL '1 minute'
   WHERE user_id = v_uid;
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated', 'aal', 'aal2')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM rpc_request_withdrawal(
      'PHON', '10',
      '{"account":"9999999999999999"}'::JSONB,
      'idem-hardening-001', 'client-hardening-001'
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'withdrawal_address_not_whitelisted' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, format('non-whitelisted address must be blocked, got: %s', v_msg);

  PERFORM rpc_request_withdrawal(
    'PHON', '10',
    '{"account":"1234567890123456"}'::JSONB,
    'idem-hardening-002', 'client-hardening-002'
  );

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;
  UPDATE app_config SET value = 'false' WHERE key = 'withdrawal_whitelist_enabled';
  PERFORM rpc_run_custody_reconciliation();

  ASSERT EXISTS (
    SELECT 1 FROM reconciliation_log
     WHERE check_type = 'custody_snapshot'
     ORDER BY run_at DESC
     LIMIT 1
  ), 'custody reconciliation row persisted';

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  RESET ROLE;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  VALUES
    (v_admin, 'admin-staking@test.local', extensions.crypt('testpass', extensions.gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{}'),
    (v_user, 'user-staking@test.local', extensions.crypt('testpass', extensions.gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{}');

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  SELECT id INTO v_pool_id FROM staking_pools ORDER BY term LIMIT 1;
  ASSERT v_pool_id IS NOT NULL, 'staking pool seed must exist';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'role', 'authenticated', 'aal', 'aal2')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM rpc_admin_list_staking_pools();
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'FORBIDDEN' THEN v_forbidden := TRUE; END IF;
  END;
  ASSERT v_forbidden, 'non-admin must not list staking pools via admin RPC';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'role', 'authenticated', 'aal', 'aal2')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  SELECT COUNT(*)::INT INTO v_count FROM rpc_admin_list_staking_pools();
  ASSERT v_count >= 1, 'admin must list staking pools';

  PERFORM rpc_admin_set_staking_pool_active(v_pool_id, FALSE, 'ops test deactivate');

  ASSERT EXISTS (
    SELECT 1 FROM audit_logs
     WHERE action = 'staking_pool_active_set'
       AND entity_id = v_pool_id
  ), 'admin toggle must write audit row';

  PERFORM rpc_admin_set_staking_pool_active(v_pool_id, TRUE, 'ops test reactivate');
END $$;

ROLLBACK;
