-- ============================================================
-- Edge observability — provider health + edge ops events SQL test
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_res JSONB;
  v_count INT;
  v_edge JSONB;
  v_status TEXT;
  v_failures INT;
  v_req_id TEXT;
BEGIN
  ASSERT to_regclass('public.provider_health') IS NOT NULL,
    'provider_health table must exist';
  ASSERT to_regclass('public.edge_ops_events') IS NOT NULL,
    'edge_ops_events table must exist';

  -- Service RPC: healthy upsert
  PERFORM set_config('request.jwt.claims', '{}', true);

  v_res := rpc_service_upsert_provider_health(
    'binance',
    'price_feed',
    '',
    'healthy',
    NULL,
    'test-req-healthy-001',
    '{"probe": true}'::JSONB
  );
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
    'provider health healthy upsert must return ok';

  SELECT status, consecutive_failures, last_request_id
    INTO v_status, v_failures, v_req_id
  FROM provider_health
  WHERE provider = 'binance'
    AND domain = 'price_feed'
    AND channel = '';

  ASSERT v_status = 'healthy', 'healthy upsert must set status healthy';
  ASSERT v_failures = 0, 'healthy upsert must reset consecutive_failures';
  ASSERT v_req_id = 'test-req-healthy-001', 'request_id must propagate to provider_health';

  -- failure increments consecutive_failures
  v_res := rpc_service_upsert_provider_health(
    'binance',
    'price_feed',
    '',
    'unavailable',
    'http_503',
    'test-req-fail-001',
    '{}'::JSONB
  );
  ASSERT COALESCE((v_res->>'consecutiveFailures')::INT, 0) >= 1,
    'unavailable upsert must increment consecutiveFailures';

  SELECT consecutive_failures INTO v_count
  FROM provider_health
  WHERE provider = 'binance'
    AND domain = 'price_feed'
    AND channel = '';
  ASSERT v_count >= 1, 'provider_health must track consecutive_failures';

  -- recovery clears failures
  v_res := rpc_service_upsert_provider_health(
    'binance',
    'price_feed',
    '',
    'healthy',
    NULL,
    'test-req-recover-001',
    '{}'::JSONB
  );
  SELECT consecutive_failures INTO v_count
  FROM provider_health
  WHERE provider = 'binance'
    AND domain = 'price_feed'
    AND channel = '';
  ASSERT v_count = 0, 'healthy recovery must reset consecutive_failures';

  -- Edge ops event append (legacy ok)
  v_res := rpc_service_record_edge_ops_event(
    'test-req-event-001',
    'price-feed',
    'ops.price_feed.completed',
    'ok',
    120,
    'lt_500ms',
    10,
    2,
    NULL,
    '{"applied": 8, "rejected": 0, "circuitOpen": 2, "rpcFailed": 0}'::JSONB
  );
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
    'edge ops event insert must return ok';

  -- H-04 granular statuses must be accepted
  v_res := rpc_service_record_edge_ops_event(
    'test-req-event-partial',
    'price-feed',
    'ops.price_feed.completed',
    'partial',
    180,
    'lt_500ms',
    42,
    9,
    'partial_apply',
    '{"applied": 9, "rejected": 24, "circuitOpen": 9, "rpcFailed": 0}'::JSONB
  );
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
    'partial edge ops status must be accepted';
  ASSERT COALESCE(v_res->>'status', '') = 'partial',
    'record RPC must echo partial status';

  SELECT COUNT(*)::INT INTO v_count
  FROM edge_ops_events
  WHERE request_id = 'test-req-event-001'
    AND function_name = 'price-feed';
  ASSERT v_count = 1, 'edge_ops_events row must persist';

  SELECT COUNT(*)::INT INTO v_count
  FROM edge_ops_events
  WHERE request_id = 'test-req-event-partial'
    AND status = 'partial';
  ASSERT v_count = 1, 'partial edge_ops_events row must persist';

  -- Snapshot includes providerHealth block
  v_edge := _build_edge_failure_snapshot();
  ASSERT v_edge ? 'providerHealth', 'edge snapshot must include providerHealth';
  ASSERT v_edge ? 'edgeOpsEvents', 'edge snapshot must include edgeOpsEvents';
  ASSERT (v_edge->'providerHealth') ? 'degraded',
    'providerHealth must expose degraded count';
END;
$$;

ROLLBACK;
