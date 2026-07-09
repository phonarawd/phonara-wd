-- circuit_breaker_state DB authority + assess/record RPC contract
BEGIN;

DO $$
DECLARE
  v_assess JSONB;
  v_record JSONB;
  v_row circuit_breaker_state%ROWTYPE;
BEGIN
  ASSERT to_regclass('public.circuit_breaker_state') IS NOT NULL,
    'circuit_breaker_state table must exist';

  -- closed by default — allowed
  v_assess := rpc_service_assess_circuit_breaker('binance', 'price_feed', '');
  ASSERT (v_assess->>'allowed')::BOOLEAN = TRUE, 'default gate must allow';
  ASSERT v_assess->>'state' = 'closed', 'default state must be closed';

  -- consecutive failures trip open (seed threshold 3 for price_feed)
  v_record := rpc_service_record_circuit_breaker_outcome('binance', 'price_feed', '', FALSE, 'fetch_fail_1');
  ASSERT (v_record->>'opened')::BOOLEAN = FALSE, 'first failure must not open';
  PERFORM rpc_service_record_circuit_breaker_outcome('binance', 'price_feed', '', FALSE, 'fetch_fail_2');
  v_record := rpc_service_record_circuit_breaker_outcome('binance', 'price_feed', '', FALSE, 'fetch_fail_3');
  ASSERT (v_record->>'opened')::BOOLEAN = TRUE, 'third failure must open circuit';
  ASSERT v_record->>'state' = 'open', 'state must be open';

  v_assess := rpc_service_assess_circuit_breaker('binance', 'price_feed', '');
  ASSERT (v_assess->>'allowed')::BOOLEAN = FALSE, 'open circuit must block';
  ASSERT v_assess->>'reason' = 'circuit_open', 'reason must be circuit_open';

  -- success resets
  v_record := rpc_service_record_circuit_breaker_outcome('binance', 'price_feed', '', TRUE);
  ASSERT v_record->>'state' = 'closed', 'success must close circuit';

  SELECT * INTO v_row
  FROM circuit_breaker_state
  WHERE provider = 'binance' AND domain = 'price_feed' AND channel = '';
  ASSERT v_row.consecutive_failures = 0, 'failures must reset on success';

  ASSERT NOT has_function_privilege('anon', 'public.rpc_service_assess_circuit_breaker(text, text, text)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_service_assess_circuit_breaker';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_record_circuit_breaker_outcome(text, text, text, boolean, text, text)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_service_record_circuit_breaker_outcome';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_assess_circuit_breaker(text, text, text)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_assess_circuit_breaker';

  RAISE NOTICE 'CIRCUIT BREAKER STATE OK — assess/record/trip/reset + privilege inventory';
END;
$$;

ROLLBACK;
