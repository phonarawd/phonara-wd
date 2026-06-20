-- Trade E3: margin mode · adjust isolated margin · partial close + conservation
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_usdt_before NUMERIC;
  v_usdt_after  NUMERIC;
  v_pos         JSONB;
  v_pos_id      UUID;
  v_adj         JSONB;
  v_partial     JSONB;
  v_remain_qty  TEXT;
  v_mode        JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e3_' || v_uid::TEXT || '@test.local', NOW(), NOW());

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

  v_pos := rpc_open_futures_position(
    'BTCUSDT-SIM', 'long', 'USDT', '400.000000', '5', NULL, NULL,
    'e3-open-' || v_uid::TEXT
  );
  v_pos_id := (v_pos->>'position_id')::UUID;

  v_adj := rpc_adjust_isolated_margin(v_pos_id, '100.000000');
  IF (v_adj->>'margin_amount')::NUMERIC <> 500 THEN
    RAISE EXCEPTION 'expected margin 500 after adjust, got %', v_adj->>'margin_amount';
  END IF;

  UPDATE oracle_prices SET price = '70000.000000', updated_at = NOW()
  WHERE symbol = 'BTCUSDT-SIM';

  v_partial := rpc_partial_close_futures(v_pos_id, '0.5');
  v_remain_qty := v_partial->>'remaining_quantity';

  IF v_remain_qty IS NULL OR v_remain_qty::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'expected remaining quantity after partial close';
  END IF;

  PERFORM rpc_close_futures_position(v_pos_id);

  -- Launch gate: cross blocked while feature_cross_margin_enabled=false
  BEGIN
    PERFORM rpc_set_margin_mode('cross');
    RAISE EXCEPTION 'expected cross_margin_not_available when flag false';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%cross_margin_not_available%' THEN
      RAISE;
    END IF;
  END;

  -- E3 RPC path still works when operator enables cross (reversible flag)
  UPDATE app_config SET value = 'true' WHERE key = 'feature_cross_margin_enabled';
  v_mode := rpc_set_margin_mode('cross');
  IF v_mode->>'margin_mode' <> 'cross' THEN
    RAISE EXCEPTION 'expected cross margin mode, got %', v_mode->>'margin_mode';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM margin_accounts WHERE user_id = v_uid AND margin_mode = 'cross'
  ) THEN
    RAISE EXCEPTION 'margin_accounts row missing after set_margin_mode';
  END IF;

  UPDATE app_config SET value = 'false' WHERE key = 'feature_cross_margin_enabled';

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;

  IF v_usdt_before <> v_usdt_after THEN
    RAISE EXCEPTION 'conservation violated: before=% after=%', v_usdt_before, v_usdt_after;
  END IF;

  RAISE NOTICE 'TRADE E3 CROSS MARGIN OK';
END $$;

ROLLBACK;
