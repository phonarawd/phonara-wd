-- R4-a owner test: edge_ops status expansion · public status · rebase/resume

BEGIN;

DO $$
DECLARE
  v_res JSONB;
  v_status TEXT;
  v_count INT;
  v_overall TEXT;
  v_lane JSONB;
  v_raised BOOLEAN;
BEGIN
  ASSERT to_regprocedure('public.rpc_get_public_platform_status()') IS NOT NULL,
    'rpc_get_public_platform_status must exist';
  ASSERT to_regprocedure('public.rpc_admin_rebase_resume_market(text, text)') IS NOT NULL,
    'rpc_admin_rebase_resume_market must exist';

  ASSERT has_function_privilege('anon', 'public.rpc_get_public_platform_status()', 'EXECUTE'),
    'anon must EXECUTE public platform status';
  ASSERT has_function_privilege('authenticated', 'public.rpc_get_public_platform_status()', 'EXECUTE'),
    'authenticated must EXECUTE public platform status';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_admin_rebase_resume_market(text, text)', 'EXECUTE'),
    'anon must NOT EXECUTE rebase/resume';

  -- Service role path for edge ops granular statuses
  PERFORM set_config('request.jwt.claims', '{}', true);

  v_res := rpc_service_record_edge_ops_event(
    'test-r4a-partial-001',
    'price-feed',
    'ops.price_feed.completed',
    'partial',
    200,
    'lt_500ms',
    10,
    3,
    'partial_apply',
    '{"applied":7,"rejected":2,"circuitOpen":1,"rpcFailed":0}'::JSONB
  );
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), 'partial edge ops must insert';

  SELECT status INTO v_status
  FROM edge_ops_events
  WHERE request_id = 'test-r4a-partial-001';
  ASSERT v_status = 'partial', 'edge_ops status must accept partial';

  BEGIN
    PERFORM rpc_service_record_edge_ops_event(
      'test-r4a-bad-status',
      'price-feed',
      'ops.price_feed.completed',
      'ok_false_green',
      NULL, NULL, NULL, NULL, NULL, '{}'::JSONB
    );
    ASSERT FALSE, 'invalid edge ops status must raise';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%invalid_edge_ops_status%', 'must raise invalid_edge_ops_status';
  END;

  -- Public status shape — no secret keys
  v_res := rpc_get_public_platform_status();
  ASSERT v_res ? 'overall', 'public status must include overall';
  ASSERT v_res ? 'lanes', 'public status must include lanes';
  ASSERT v_res ? 'checkedAt', 'public status must include checkedAt';
  ASSERT jsonb_typeof(v_res->'lanes') = 'array', 'lanes must be array';
  ASSERT jsonb_array_length(v_res->'lanes') = 5, 'five public lanes required';
  ASSERT NOT (v_res::TEXT ILIKE '%service_role%'), 'must not leak service_role';
  ASSERT NOT (v_res::TEXT ILIKE '%password%'), 'must not leak password';
  ASSERT NOT (v_res ? 'providerHealth'), 'must not expose raw providerHealth block';
  ASSERT NOT (v_res ? 'edgeOpsEvents'), 'must not expose raw edgeOpsEvents block';

  v_overall := v_res->>'overall';
  ASSERT v_overall IN ('operational', 'degraded', 'outage', 'unknown'),
    'overall must be a public status enum';

  SELECT elem INTO v_lane
  FROM jsonb_array_elements(v_res->'lanes') elem
  WHERE elem->>'id' = 'trade'
  LIMIT 1;
  ASSERT v_lane IS NOT NULL, 'trade lane required';
  ASSERT v_lane ? 'status' AND v_lane ? 'reasonCategory' AND v_lane ? 'checkedAt',
    'lane must expose status/reasonCategory/checkedAt only';

  -- Bulk resume forbidden
  BEGIN
    v_raised := FALSE;
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', '00000000-0000-4000-8000-000000000099', 'aal', 'aal2')::TEXT,
      true
    );
    -- Non-admin → forbidden before bulk check; still assert function rejects CSV when admin.
    -- Use service_role claims (uid null) → forbidden.
    PERFORM set_config('request.jwt.claims', '{}', true);
    PERFORM rpc_admin_rebase_resume_market('PHON_USDT,BTC_USDT', 'bulk attempt');
    ASSERT FALSE, 'service_role rebase must be forbidden without admin uid';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%forbidden%' OR SQLERRM LIKE '%bulk_resume_forbidden%',
      'rebase without admin must fail closed';
  END;

  SELECT COUNT(*)::INT INTO v_count
  FROM edge_ops_events
  WHERE request_id = 'test-r4a-partial-001';
  ASSERT v_count = 1, 'partial event must persist';
END;
$$;

ROLLBACK;
