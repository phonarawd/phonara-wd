-- Trade Phase E: trailing stop · TIF · iceberg + conservation
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_pos JSONB;
  v_pos_id UUID;
  v_order JSONB;
  v_order_id UUID;
  v_order_status order_status;
  v_pos_status position_status;
  v_usdt_before NUMERIC;
  v_usdt_after NUMERIC;
  v_pos_count INT;
  v_fill_res JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'phase_e_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '1000000.000000' WHERE user_id = v_uid;

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

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_before;

  -- post_only rejects immediately crossable limit (long buy at/above mark)
  BEGIN
    PERFORM rpc_place_limit_order(
      'BTCUSDT-SIM', 'long', 'USDT', '100.000000', '5', '69000.000000',
      'post-only-' || v_uid::TEXT, 'post_only'
    );
    RAISE EXCEPTION 'expected post_only_would_cross';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%post_only_would_cross%' THEN
      RAISE EXCEPTION 'unexpected post_only error: %', SQLERRM;
    END IF;
  END;

  -- IOC cancels unfilled on first fill-worker tick (long buy below mark — not crossed)
  v_order := rpc_place_limit_order(
    'BTCUSDT-SIM', 'long', 'USDT', '150.000000', '5', '67000.000000',
    'ioc-' || v_uid::TEXT, 'ioc'
  );
  v_order_id := (v_order->>'order_id')::UUID;

  PERFORM rpc_run_open_order_fills();

  SELECT status INTO v_order_status FROM trading_open_orders WHERE id = v_order_id;
  IF v_order_status <> 'cancelled' THEN
    RAISE EXCEPTION 'expected IOC cancel, got %', v_order_status;
  END IF;

  -- Iceberg partial fill: display_quantity slice then remainder
  v_order := rpc_place_limit_order(
    'BTCUSDT-SIM', 'long', 'USDT', '400.000000', '5', '68000.000000',
    'iceberg-' || v_uid::TEXT, 'gtc', '0.010000'
  );
  v_order_id := (v_order->>'order_id')::UUID;

  PERFORM rpc_run_open_order_fills();

  SELECT status INTO v_order_status FROM trading_open_orders WHERE id = v_order_id;
  IF v_order_status <> 'partially_filled' THEN
    RAISE EXCEPTION 'expected partially_filled iceberg slice, got %', v_order_status;
  END IF;

  SELECT COUNT(*) INTO v_pos_count
  FROM futures_positions
  WHERE user_id = v_uid AND status = 'open';
  IF v_pos_count < 1 THEN
    RAISE EXCEPTION 'expected at least one iceberg slice position';
  END IF;

  PERFORM rpc_run_open_order_fills();

  SELECT status INTO v_order_status FROM trading_open_orders WHERE id = v_order_id;
  IF v_order_status <> 'filled' THEN
    RAISE EXCEPTION 'expected filled after iceberg slices, got %', v_order_status;
  END IF;

  -- Trailing stop: open position, rally, pullback triggers close
  v_pos := rpc_open_futures_position(
    p_market := 'BTCUSDT-SIM',
    p_side := 'long',
    p_margin_currency := 'USDT',
    p_margin_amount := '300.000000',
    p_leverage := '5',
    p_client_request_id := 'trail-open-' || v_uid::TEXT
  );
  v_pos_id := (v_pos->>'position_id')::UUID;

  PERFORM rpc_set_trailing_stop(v_pos_id, '0.050000', NULL);

  UPDATE oracle_prices SET price = '70000.000000', updated_at = NOW()
  WHERE symbol = 'BTCUSDT-SIM';
  PERFORM rpc_run_stop_orders();

  SELECT status INTO v_pos_status FROM futures_positions WHERE id = v_pos_id;
  IF v_pos_status <> 'open' THEN
    RAISE EXCEPTION 'expected open after rally, got %', v_pos_status;
  END IF;

  UPDATE oracle_prices SET price = '66000.000000', updated_at = NOW()
  WHERE symbol = 'BTCUSDT-SIM';
  PERFORM rpc_run_stop_orders();

  SELECT status INTO v_pos_status FROM futures_positions WHERE id = v_pos_id;
  IF v_pos_status <> 'closed' THEN
    RAISE EXCEPTION 'expected trailing stop close, got %', v_pos_status;
  END IF;

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;

  IF v_usdt_before <> v_usdt_after THEN
    RAISE EXCEPTION 'conservation violated: before=% after=%', v_usdt_before, v_usdt_after;
  END IF;
END $$;

ROLLBACK;
