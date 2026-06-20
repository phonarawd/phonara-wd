-- Trade E2: open_orders place · cancel · fill + conservation
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_usdt_before NUMERIC;
  v_usdt_after  NUMERIC;
  v_order       JSONB;
  v_order_id    UUID;
  v_pos_id      UUID;
  v_status      order_status;
  v_locked      TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'oo_' || v_uid::TEXT || '@test.local', NOW(), NOW());

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

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_before;

  -- Place limit long below mark (pending fill)
  v_order := rpc_place_limit_order(
    'BTCUSDT-SIM', 'long', 'USDT', '200.000000', '5', '67000.000000',
    'lim-' || v_uid::TEXT
  );
  v_order_id := (v_order->>'order_id')::UUID;

  SELECT status INTO v_status FROM trading_open_orders WHERE id = v_order_id;
  IF v_status <> 'open' THEN
    RAISE EXCEPTION 'expected open limit order, got %', v_status;
  END IF;

  SELECT usdt_locked INTO v_locked FROM wallets WHERE user_id = v_uid;
  IF v_locked::NUMERIC <> 200 THEN
    RAISE EXCEPTION 'expected 200 locked margin, got %', v_locked;
  END IF;

  -- Cancel restores available
  PERFORM rpc_cancel_order(v_order_id);

  SELECT status INTO v_status FROM trading_open_orders WHERE id = v_order_id;
  IF v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'expected cancelled order, got %', v_status;
  END IF;

  SELECT usdt_locked INTO v_locked FROM wallets WHERE user_id = v_uid;
  IF v_locked::NUMERIC <> 0 THEN
    RAISE EXCEPTION 'expected 0 locked after cancel, got %', v_locked;
  END IF;

  -- Place limit long at/above fill threshold
  v_order := rpc_place_limit_order(
    'BTCUSDT-SIM', 'long', 'USDT', '300.000000', '5', '68000.000000',
    'lim-fill-' || v_uid::TEXT
  );
  v_order_id := (v_order->>'order_id')::UUID;

  PERFORM rpc_run_open_order_fills();

  SELECT status INTO v_status FROM trading_open_orders WHERE id = v_order_id;
  IF v_status <> 'filled' THEN
    RAISE EXCEPTION 'expected filled limit order, got %', v_status;
  END IF;

  SELECT id INTO v_pos_id
  FROM futures_positions
  WHERE user_id = v_uid AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  IF v_pos_id IS NULL THEN
    RAISE EXCEPTION 'expected position from filled order';
  END IF;

  PERFORM rpc_close_futures_position(v_pos_id);

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;

  IF v_usdt_before <> v_usdt_after THEN
    RAISE EXCEPTION 'conservation violated: before=% after=%', v_usdt_before, v_usdt_after;
  END IF;

  RAISE NOTICE 'TRADE E2 OPEN ORDERS CONSERVATION OK';
END $$;

ROLLBACK;
