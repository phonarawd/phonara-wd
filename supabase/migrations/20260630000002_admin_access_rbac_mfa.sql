-- Admin Access desk — RBAC grants + MFA tier policy registry (display/management only).
-- Role assignment changes require owner role + AAL2 + audit.

SET search_path = public, pg_temp;

CREATE TABLE IF NOT EXISTS admin_role_grants (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       admin_role NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE admin_role_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_role_grants_admin_read ON admin_role_grants
  FOR SELECT TO authenticated
  USING (_is_admin());

REVOKE ALL ON admin_role_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT ON admin_role_grants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_role_grants TO service_role;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON admin_role_grants FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS admin_role_grants_service ON admin_role_grants;

CREATE TABLE IF NOT EXISTS mfa_tier_policy (
  tier_key      TEXT PRIMARY KEY,
  mfa_required  BOOLEAN NOT NULL DEFAULT FALSE,
  grace_days    INT NOT NULL DEFAULT 0 CHECK (grace_days >= 0),
  enroll_rate   INT NOT NULL DEFAULT 0 CHECK (enroll_rate >= 0 AND enroll_rate <= 100),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID REFERENCES auth.users(id)
);

ALTER TABLE mfa_tier_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY mfa_tier_policy_admin_read ON mfa_tier_policy
  FOR SELECT TO authenticated
  USING (_is_admin());

REVOKE ALL ON mfa_tier_policy FROM PUBLIC, anon, authenticated;
GRANT SELECT ON mfa_tier_policy TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_tier_policy TO service_role;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON mfa_tier_policy FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS mfa_tier_policy_service ON mfa_tier_policy;

INSERT INTO mfa_tier_policy (tier_key, mfa_required, grace_days, enroll_rate) VALUES
  ('tier.bronze', FALSE, 14, 12),
  ('tier.silver', FALSE, 7, 28),
  ('tier.gold', TRUE, 3, 54),
  ('tier.platinum', TRUE, 1, 72),
  ('tier.staff', TRUE, 0, 88),
  ('tier.admin', TRUE, 0, 96)
ON CONFLICT (tier_key) DO NOTHING;

CREATE OR REPLACE FUNCTION _admin_has_role(p_role admin_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM admin_role_grants g
     WHERE g.user_id = auth.uid()
       AND g.enabled = TRUE
       AND g.role = p_role
  )
  OR (
    p_role = 'owner'::admin_role
    AND EXISTS (
      SELECT 1 FROM profiles p
       WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    AND NOT EXISTS (SELECT 1 FROM admin_role_grants WHERE user_id = auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION _admin_has_role(admin_role) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_admin_list_role_grants()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rows JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'role'), '[]'::JSONB)
  INTO v_rows
  FROM (
    SELECT jsonb_build_object(
      'user_id', g.user_id::TEXT,
      'role', g.role::TEXT,
      'enabled', g.enabled,
      'email', au.email,
      'updated_at', g.updated_at
    ) AS row
    FROM admin_role_grants g
    LEFT JOIN profiles p ON p.id = g.user_id
    LEFT JOIN auth.users au ON au.id = g.user_id
  ) sub;

  RETURN jsonb_build_object('grants', v_rows, 'fetched_at', NOW());
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_set_role_grant(
  p_user_id UUID,
  p_role TEXT,
  p_enabled BOOLEAN,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role admin_role;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM _assert_admin_aal2();
  IF NOT _admin_has_role('owner'::admin_role) THEN
    RAISE EXCEPTION 'owner_required';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  BEGIN
    v_role := p_role::admin_role;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'invalid_role';
  END;

  INSERT INTO admin_role_grants (user_id, role, enabled, updated_at, updated_by)
  VALUES (p_user_id, v_role, COALESCE(p_enabled, TRUE), NOW(), auth.uid())
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role,
      enabled = EXCLUDED.enabled,
      updated_at = NOW(),
      updated_by = auth.uid();

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    auth.uid(),
    'admin.role_grant.set',
    'user',
    p_user_id,
    jsonb_build_object('role', v_role::TEXT, 'enabled', COALESCE(p_enabled, TRUE), 'reason', btrim(p_reason))
  );

  RETURN jsonb_build_object('ok', TRUE, 'user_id', p_user_id::TEXT, 'role', v_role::TEXT);
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_list_mfa_policy()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rows JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'tier_key'), '[]'::JSONB)
  INTO v_rows
  FROM (
    SELECT jsonb_build_object(
      'tier_key', m.tier_key,
      'mfa_required', m.mfa_required,
      'grace_days', m.grace_days::TEXT,
      'enroll_rate', m.enroll_rate::TEXT,
      'updated_at', m.updated_at
    ) AS row
    FROM mfa_tier_policy m
  ) sub;

  RETURN jsonb_build_object('policies', v_rows, 'fetched_at', NOW());
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_set_mfa_policy(
  p_tier_key TEXT,
  p_mfa_required BOOLEAN,
  p_grace_days INT,
  p_enroll_rate INT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM _assert_admin_aal2();
  IF NOT _admin_has_role('owner'::admin_role) THEN
    RAISE EXCEPTION 'owner_required';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF p_tier_key IS NULL OR length(btrim(p_tier_key)) < 3 THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  INSERT INTO mfa_tier_policy (tier_key, mfa_required, grace_days, enroll_rate, updated_at, updated_by)
  VALUES (
    btrim(p_tier_key),
    COALESCE(p_mfa_required, FALSE),
    GREATEST(COALESCE(p_grace_days, 0), 0),
    LEAST(GREATEST(COALESCE(p_enroll_rate, 0), 0), 100),
    NOW(),
    auth.uid()
  )
  ON CONFLICT (tier_key) DO UPDATE
  SET mfa_required = EXCLUDED.mfa_required,
      grace_days = EXCLUDED.grace_days,
      enroll_rate = EXCLUDED.enroll_rate,
      updated_at = NOW(),
      updated_by = auth.uid();

  INSERT INTO audit_logs (actor_id, action, entity_type, payload)
  VALUES (
    auth.uid(),
    'admin.mfa_policy.set',
    'mfa_tier_policy',
    jsonb_build_object(
      'tier_key', btrim(p_tier_key),
      'mfa_required', COALESCE(p_mfa_required, FALSE),
      'grace_days', GREATEST(COALESCE(p_grace_days, 0), 0),
      'enroll_rate', LEAST(GREATEST(COALESCE(p_enroll_rate, 0), 0), 100),
      'reason', btrim(p_reason)
    )
  );

  RETURN jsonb_build_object('ok', TRUE, 'tier_key', btrim(p_tier_key));
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_role_grants() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rpc_admin_set_role_grant(UUID, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rpc_admin_list_mfa_policy() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rpc_admin_set_mfa_policy(TEXT, BOOLEAN, INT, INT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION rpc_admin_list_role_grants() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_admin_set_role_grant(UUID, TEXT, BOOLEAN, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_admin_list_mfa_policy() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_admin_set_mfa_policy(TEXT, BOOLEAN, INT, INT, TEXT) TO authenticated, service_role;
