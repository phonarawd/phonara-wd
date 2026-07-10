-- ============================================================
-- Migration: pir_affiliate_settlements_aal2
-- PIR GATE: rpc_run_affiliate_settlements authenticated admin path
-- must call _assert_admin_aal2() (guard-coverage missing-aal2).
-- Service/cron (auth.uid() NULL) unchanged — assert auto-skips.
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION rpc_run_affiliate_settlements(
  p_settlement_date DATE DEFAULT CURRENT_DATE,
  p_batch_limit INT DEFAULT 200
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  PERFORM _assert_admin_aal2();

  RETURN _run_affiliate_settlements(p_settlement_date, p_batch_limit);
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_affiliate_settlements(DATE, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_run_affiliate_settlements(DATE, INT) TO authenticated, service_role;
