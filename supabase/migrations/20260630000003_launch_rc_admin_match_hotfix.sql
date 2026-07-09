-- Re-apply Launch RC H1 after worldno1_money_ops_rails overwrote rpc_admin_match_krw_deposit
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _admin_credit_krw_deposit_internal(
  p_deposit_id UUID,
  p_transfer_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep    krw_deposit_requests%ROWTYPE;
  v_bit_id UUID;
  v_job_id UUID;
  v_ledger UUID;
BEGIN
  SELECT * INTO v_dep FROM krw_deposit_requests WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;
  IF v_dep.status NOT IN ('pending', 'matched') THEN
    RAISE EXCEPTION 'deposit_not_pending';
  END IF;

  INSERT INTO bank_incoming_transfers (transfer_id, amount_krw, depositor_name, reference_code)
  VALUES (p_transfer_id, v_dep.amount_krw, 'admin_override', v_dep.reference_code)
  RETURNING id INTO v_bit_id;

  UPDATE bank_incoming_transfers SET matched_deposit_id = p_deposit_id WHERE id = v_bit_id;
  UPDATE krw_deposit_requests
     SET status = 'matched', matched_at = COALESCE(matched_at, NOW())
   WHERE id = p_deposit_id
     AND status IN ('pending', 'matched');

  v_ledger := _credit_krw_deposit_internal(p_deposit_id, p_transfer_id);

  INSERT INTO deposit_reconciliation_jobs (source, matched_count, exception_count, payload)
  VALUES ('admin_match', 1, 0,
    jsonb_build_object('transfer_id', p_transfer_id, 'deposit_id', p_deposit_id))
  RETURNING id INTO v_job_id;

  UPDATE bank_incoming_transfers SET reconciliation_job_id = v_job_id WHERE id = v_bit_id;

  RETURN jsonb_build_object(
    'ok', TRUE, 'deposit_id', p_deposit_id, 'ledger_id', v_ledger, 'auto_matched', FALSE
  );

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'duplicate_transfer_id' USING HINT = p_transfer_id;
END;
$$;

REVOKE ALL ON FUNCTION _admin_credit_krw_deposit_internal(UUID, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_admin_match_krw_deposit(
  p_deposit_id UUID,
  p_transfer_id TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep krw_deposit_requests%ROWTYPE;
  v_res JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN RAISE EXCEPTION 'reason_too_short'; END IF;
  IF p_transfer_id IS NULL OR length(btrim(p_transfer_id)) < 4 THEN RAISE EXCEPTION 'invalid_transfer_id'; END IF;

  SELECT * INTO v_dep FROM krw_deposit_requests WHERE id = p_deposit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;

  v_res := _admin_credit_krw_deposit_internal(p_deposit_id, btrim(p_transfer_id));

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'krw_deposit_admin_match', 'krw_deposit_requests', p_deposit_id,
          jsonb_build_object('reason', p_reason, 'transfer_id', p_transfer_id, 'result', v_res));

  RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_match_krw_deposit(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_match_krw_deposit(UUID, TEXT, TEXT) TO authenticated, service_role;
