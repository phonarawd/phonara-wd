-- ============================================================
-- Withdrawal MFA step-up — require AAL2 when TOTP is enrolled
-- ============================================================

SET search_path = public, pg_temp;

INSERT INTO app_config (key, value, description, is_public)
VALUES (
  'withdrawal_mfa_step_up_enabled',
  'true',
  'When true, users with verified TOTP must present AAL2 JWT before rpc_request_withdrawal.',
  FALSE
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION _assert_withdrawal_mfa_step_up()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_enabled TEXT;
  v_has_totp BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT value INTO v_enabled
    FROM app_config
   WHERE key = 'withdrawal_mfa_step_up_enabled';

  IF COALESCE(v_enabled, 'true') IS DISTINCT FROM 'true' THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM auth.mfa_factors mf
     WHERE mf.user_id = auth.uid()
       AND mf.factor_type = 'totp'
       AND mf.status = 'verified'
  ) INTO v_has_totp;

  IF NOT v_has_totp THEN
    RETURN;
  END IF;

  IF auth.jwt()->>'aal' IS DISTINCT FROM 'aal2' THEN
    RAISE EXCEPTION 'withdrawal_mfa_required';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_withdrawal_mfa_step_up() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  v_def TEXT;
  v_new TEXT;
BEGIN
  v_def := pg_get_functiondef(
    'public.rpc_request_withdrawal(text,text,jsonb,text,text)'::regprocedure
  );

  IF position('_assert_withdrawal_mfa_step_up(' IN v_def) > 0 THEN
    RETURN;
  END IF;

  v_new := replace(
    v_def,
    'PERFORM _assert_onboarding_consent(v_user_id);',
    E'PERFORM _assert_onboarding_consent(v_user_id);\n  PERFORM _assert_withdrawal_mfa_step_up();'
  );

  IF v_new = v_def THEN
    RAISE EXCEPTION 'withdrawal MFA step-up anchor not found in rpc_request_withdrawal';
  END IF;

  EXECUTE v_new;
END;
$$;
