-- H-09 / Platform audit R3-e (audit-r3e-auth-hibp-feature-flag)
-- Restore Admin+AAL2 on rpc_set_feature_enabled (wiped by E10 CREATE OR REPLACE)
-- and extend allowlist with sports + live_crash (Admin kill switches already call them).
-- Auth HIBP (leaked-password) is enabled via Management API — not DDL.

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.rpc_set_feature_enabled(
  p_feature TEXT,
  p_enabled BOOLEAN,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_key TEXT;
  v_rows INT;
BEGIN
  IF NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM _assert_admin_aal2();
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF p_feature NOT IN (
    'spot','futures','staking','game','referral','deposit','withdrawal',
    'p2p_transfer','giftcard_redeem',
    'siwe_login','support_tickets','product_analytics','app_install_mission',
    'krw_deposit_proof','mission_chains','co_bet','ml_mission_recommend',
    'sports','live_crash'
  ) THEN
    RAISE EXCEPTION 'invalid_feature' USING HINT = p_feature;
  END IF;

  v_key := 'feature_' || p_feature || '_enabled';
  UPDATE app_config
     SET value = CASE WHEN p_enabled THEN 'true' ELSE 'false' END,
         updated_at = NOW()
   WHERE key = v_key;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'invalid_feature' USING HINT = p_feature;
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, payload)
  VALUES (
    v_actor, 'feature_toggle', 'app_config',
    jsonb_build_object('feature', p_feature, 'enabled', p_enabled, 'reason', p_reason)
  );
  RETURN jsonb_build_object('feature', p_feature, 'enabled', p_enabled);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_set_feature_enabled(TEXT, BOOLEAN, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_set_feature_enabled(TEXT, BOOLEAN, TEXT)
  TO authenticated, service_role;
