-- ============================================================
-- Admin MFA AAL2 SQL integration test (Task 2 RED)
-- ============================================================
-- aal1 admin sessions must be rejected by admin RPC entry guards.
-- Runs in one transaction and ROLLBACKs.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_blocked BOOLEAN;
  v_msg TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_admin, 'authenticated', 'authenticated', 'admin_mfa_' || v_admin::TEXT || '@test.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal1')::TEXT,
    true
  );

  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_set_system_mode(FALSE, FALSE, 'admin mfa aal2 regression check');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg LIKE 'ERR_MFA_REQUIRED%' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'aal1 admin executed rpc_set_system_mode without MFA guard';

  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_ack_ops_alert(gen_random_uuid(), 'admin mfa aal2 regression check');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg LIKE 'ERR_MFA_REQUIRED%' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'aal1 admin executed rpc_ack_ops_alert without MFA guard';

  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_approve_withdrawal(gen_random_uuid(), 'admin mfa aal2 regression check');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg LIKE 'ERR_MFA_REQUIRED%' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'aal1 admin executed rpc_approve_withdrawal without MFA guard';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    true
  );

  PERFORM rpc_set_system_mode(FALSE, FALSE, 'admin mfa aal2 allow check');

  RAISE NOTICE 'ADMIN MFA AAL2 OK — aal1 blocked, aal2 admin path allowed';
END;
$$;

ROLLBACK;
