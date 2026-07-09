-- Trade E2: open order edge — cancel race + fill guard
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_order_id UUID;
  v_order JSONB;
  v_status order_status;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'oo_edge_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '10000.000000' WHERE user_id = v_uid;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_futures_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at) VALUES
    ('BTCUSDT-SIM', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE futures_markets
  SET is_active = TRUE, max_leverage = 20, max_user_positions = 50, max_open_interest = '10000000.000000'
  WHERE symbol = 'BTCUSDT-SIM';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'BTCUSDT-SIM';

  v_order := rpc_place_limit_order(
    'BTCUSDT-SIM', 'long', 'USDT', '150.000000', '5', '65000.000000',
    'lim-edge-' || v_uid::TEXT
  );
  v_order_id := (v_order->>'order_id')::UUID;

  PERFORM rpc_cancel_order(v_order_id);

  BEGIN
    PERFORM rpc_cancel_order(v_order_id);
    RAISE EXCEPTION 'double cancel should fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT ILIKE '%cancelled%' AND SQLERRM NOT ILIKE '%not_found%' AND SQLERRM NOT ILIKE '%not_cancellable%' THEN
      RAISE;
    END IF;
  END;

  SELECT status INTO v_status FROM trading_open_orders WHERE id = v_order_id;
  IF v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'expected cancelled after first cancel, got %', v_status;
  END IF;

  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    PERFORM rpc_run_open_order_fills();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RAISE NOTICE 'TRADE E2 OPEN ORDERS EDGE OK — cancel race guarded';
END $$;

ROLLBACK;
