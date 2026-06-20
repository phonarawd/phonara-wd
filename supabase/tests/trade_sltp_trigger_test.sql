-- Trade E1: SL/TP cron trigger + conservation
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_pos JSONB;
  v_pos_id UUID;
  v_usdt_before NUMERIC;
  v_usdt_after NUMERIC;
  v_status position_status;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'sltp_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '1000000.000000', usdt_available = '1000000.000000'
  WHERE user_id = v_uid;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at) VALUES
    ('BTCUSDT-SIM', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC),0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='USDT')
  INTO v_usdt_before;

  v_pos := rpc_open_futures_position(
    p_market := 'BTCUSDT-SIM',
    p_side := 'long',
    p_margin_currency := 'USDT',
    p_margin_amount := '500.000000',
    p_leverage := '5',
    p_stop_loss := '65000.000000',
    p_take_profit := '72000.000000',
    p_client_request_id := gen_random_uuid()::TEXT
  );
  v_pos_id := (v_pos->>'position_id')::UUID;

  UPDATE oracle_prices SET price = '64000.000000', updated_at = NOW()
  WHERE symbol = 'BTCUSDT-SIM';

  PERFORM rpc_run_stop_orders();

  SELECT status INTO v_status FROM futures_positions WHERE id = v_pos_id;
  IF v_status <> 'closed' THEN
    RAISE EXCEPTION 'expected stop_trigger close, got %', v_status;
  END IF;

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC),0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='USDT')
  INTO v_usdt_after;

  IF v_usdt_before <> v_usdt_after THEN
    RAISE EXCEPTION 'conservation violated: before=% after=%', v_usdt_before, v_usdt_after;
  END IF;
END $$;

ROLLBACK;
