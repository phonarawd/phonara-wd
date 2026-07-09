-- Admin access desk — RBAC grants + MFA policy RPC smoke (positive + negative auth).
BEGIN;

DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_policies JSONB;
  v_err TEXT;
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  VALUES
    (
      v_admin,
      'admin-access-test@phonara.local',
      crypt('test-password', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}'
    ),
    (
      v_user,
      'admin-access-deny@phonara.local',
      crypt('test-password', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}'
    );

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  -- Negative: non-admin cannot list MFA policy
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user::text)::text, true);
  BEGIN
    PERFORM rpc_admin_list_mfa_policy();
    RAISE EXCEPTION 'expected forbidden for non-admin';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      ASSERT v_err ILIKE '%forbidden%', format('non-admin list mfa must raise forbidden, got: %', v_err);
  END;

  -- Negative: non-admin cannot set role grant
  BEGIN
    PERFORM rpc_admin_set_role_grant(v_user, 'viewer', TRUE, 'should fail');
    RAISE EXCEPTION 'expected forbidden for non-admin set grant';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      ASSERT v_err ILIKE '%forbidden%', format('non-admin set grant must raise forbidden, got: %', v_err);
  END;

  -- Positive: admin + AAL2
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::text, 'aal', 'aal2')::text, true);

  v_policies := rpc_admin_list_mfa_policy();
  ASSERT v_policies ? 'policies', 'rpc_admin_list_mfa_policy must return policies';

  PERFORM rpc_admin_set_mfa_policy('tier.gold', TRUE, 2, 80, 'test policy tighten');

  -- Negative: reason too short
  BEGIN
    PERFORM rpc_admin_set_mfa_policy('tier.gold', TRUE, 2, 80, 'x');
    RAISE EXCEPTION 'expected reason_required';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      ASSERT v_err ILIKE '%reason%', format('short reason must fail, got: %', v_err);
  END;

  RAISE NOTICE 'admin_access_test: OK';
END $$;

ROLLBACK;
