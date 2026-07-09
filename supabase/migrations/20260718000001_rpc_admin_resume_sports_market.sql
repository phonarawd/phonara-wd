-- ============================================================
-- Migration: 20260718000001_rpc_admin_resume_sports_market
-- Phase R P2 wire — admin sports desk market resume (pairs with suspend)
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION rpc_admin_resume_sports_market(
  p_market_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  PERFORM _assert_admin_aal2();

  IF length(trim(COALESCE(p_reason, ''))) < 4 THEN
    RAISE EXCEPTION 'reason_too_short';
  END IF;

  UPDATE sports_markets SET
    suspended_until = NULL,
    suspend_reason = NULL,
    updated_at = NOW()
  WHERE id = p_market_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'sports_market_resume', 'sports_markets', p_market_id,
    jsonb_build_object('reason', trim(p_reason)));

  RETURN jsonb_build_object('market_id', p_market_id, 'resumed', true);
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_resume_sports_market(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_resume_sports_market(UUID, TEXT) TO authenticated, service_role;
