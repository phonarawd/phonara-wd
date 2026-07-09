-- Trade T2: post-open SL/TP edit + cron stop trigger after edit
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_pos JSONB;
  v_pos_id UUID;
  v_update JSONB;
  v_status position_status;
  v_sl TEXT;
  v_tp TEXT;
  v_usdt_before NUMERIC;
  v_usdt_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          't2_sltp_' || v_uid::TEXT || '@test.local', NOW(), NOW());

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

  v_pos := rpc_open_futures_position(
    p_market := 'BTCUSDT-SIM',
    p_side := 'long',
    p_margin_currency := 'USDT',
    p_margin_amount := '500.000000',
    p_leverage := '5',
    p_stop_loss := NULL,
    p_take_profit := NULL,
    p_client_request_id := 't2-open-' || v_uid::TEXT
  );
  v_pos_id := (v_pos->>'position_id')::UUID;

  v_update := rpc_update_futures_position_sltp(
    p_position_id := v_pos_id,
    p_stop_loss := '65000.000000',
    p_take_profit := '72000.000000'
  );
  ASSERT v_update->>'stop_loss' = '65000.000000', 'stop_loss update failed';
  ASSERT v_update->>'take_profit' = '72000.000000', 'take_profit update failed';

  SELECT stop_loss, take_profit INTO v_sl, v_tp
  FROM futures_positions WHERE id = v_pos_id;
  ASSERT v_sl = '65000.000000', 'stored stop_loss mismatch';
  ASSERT v_tp = '72000.000000', 'stored take_profit mismatch';

  ASSERT EXISTS (
    SELECT 1 FROM position_ledger
    WHERE position_id = v_pos_id AND event = 'sltp'
  ), 'sltp ledger event missing';

  -- invalid SL direction rejected
  BEGIN
    PERFORM rpc_update_futures_position_sltp(v_pos_id, '70000.000000', NULL);
    RAISE EXCEPTION 'expected invalid_stop_loss for long SL above entry';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%invalid_stop_loss%' THEN
      RAISE EXCEPTION 'unexpected sl error: %', SQLERRM;
    END IF;
  END;

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC),0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='USDT')
  INTO v_usdt_before;

  UPDATE oracle_prices SET price = '64000.000000', updated_at = NOW()
  WHERE symbol = 'BTCUSDT-SIM';

  PERFORM rpc_run_stop_orders();

  SELECT status INTO v_status FROM futures_positions WHERE id = v_pos_id;
  IF v_status <> 'closed' THEN
    RAISE EXCEPTION 'expected stop_trigger close after SLTP edit, got %', v_status;
  END IF;

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC),0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='USDT')
  INTO v_usdt_after;

  IF v_usdt_before <> v_usdt_after THEN
    RAISE EXCEPTION 'conservation violated after edited SLTP trigger: before=% after=%',
      v_usdt_before, v_usdt_after;
  END IF;

  RAISE NOTICE 'T2 SLTP EDIT OK — update RPC + cron stop trigger + Σ=0';
END $$;

ROLLBACK;
