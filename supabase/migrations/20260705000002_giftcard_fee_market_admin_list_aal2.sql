-- Guard coverage closeout: admin fee-market listing requires AAL2 like upsert.
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION rpc_admin_list_giftcard_fee_market()
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();

  RETURN QUERY
  SELECT jsonb_build_object(
    'id', m.id,
    'kind', m.kind::TEXT,
    'provider_name', m.provider_name,
    'giftcard_type', m.giftcard_type,
    'payout_rate_bps', m.payout_rate_bps,
    'percent_fee_bps', m.percent_fee_bps,
    'fixed_fee_krw', m.fixed_fee_krw,
    'min_face_value_krw', m.min_face_value_krw,
    'max_face_value_krw', m.max_face_value_krw,
    'sla_minutes', m.sla_minutes,
    'evidence_url', m.evidence_url,
    'last_checked_at', m.last_checked_at,
    'enabled', m.enabled,
    'is_stale', _giftcard_fee_market_is_stale(m.last_checked_at),
    'updated_at', m.updated_at
  )
  FROM giftcard_fee_market m
  ORDER BY m.kind::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_giftcard_fee_market() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_list_giftcard_fee_market() TO authenticated, service_role;
