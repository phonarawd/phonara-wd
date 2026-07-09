-- Trade T2: futures cron RPC integration smoke (fills · stop · liquidations)
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_fill JSONB;
  v_stop JSONB;
  v_liq JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          't2_cron_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '100000.000000', phon_available = '100000.000000'
  WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_futures_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at) VALUES
    ('BTCUSDT-SIM', '68000.000000', NOW()),
    ('PHONUSDT-PERP', '0.012345', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE futures_markets
  SET is_active = TRUE, max_leverage = 20, max_user_positions = 50, max_open_interest = '10000000.000000'
  WHERE symbol IN ('BTCUSDT-SIM', 'PHONUSDT-PERP');
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol IN ('BTCUSDT-SIM', 'PHONUSDT-PERP');

  PERFORM set_config('request.jwt.claims', '{}', true);

  v_fill := rpc_run_open_order_fills();
  IF v_fill IS NULL OR v_fill->>'ran_at' IS NULL THEN
    RAISE EXCEPTION 'rpc_run_open_order_fills returned invalid payload: %', v_fill;
  END IF;

  v_stop := rpc_run_stop_orders();
  IF v_stop IS NULL OR v_stop->>'ran_at' IS NULL THEN
    RAISE EXCEPTION 'rpc_run_stop_orders returned invalid payload: %', v_stop;
  END IF;

  v_liq := rpc_run_liquidations();
  IF v_liq IS NULL THEN
    RAISE EXCEPTION 'rpc_run_liquidations returned null';
  END IF;

  RAISE NOTICE 'T2 FUTURES CRON OK — open_order_fills + stop_orders + liquidations service_role callable';
END $$;

ROLLBACK;
