-- Launch RC — lock down rpc_get_dr_health_summary to admin AAL2 + service_role
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION rpc_get_dr_health_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_open_alerts INT;
  v_pending_notif INT;
  v_pending_withdraw INT;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    PERFORM _assert_admin_aal2();
  END IF;

  SELECT COUNT(*)::INT INTO v_open_alerts FROM ops_alerts WHERE status IN ('open', 'acknowledged');
  SELECT COUNT(*)::INT INTO v_pending_notif FROM notification_outbox WHERE status IN ('pending', 'failed');
  SELECT COUNT(*)::INT INTO v_pending_withdraw
    FROM withdrawal_requests WHERE status = 'approved' AND on_chain_tx_hash IS NULL;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'open_ops_alerts', v_open_alerts,
    'pending_notifications', v_pending_notif,
    'pending_crypto_broadcasts', v_pending_withdraw,
    'checked_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_dr_health_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_dr_health_summary() TO authenticated, service_role;
