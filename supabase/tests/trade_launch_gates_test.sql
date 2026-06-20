-- Trade launch gates: funding + cross margin server rejection
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_err TEXT;
  v_before TIMESTAMPTZ;
  v_after  TIMESTAMPTZ;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'launch_gate_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '5000.000000' WHERE user_id = v_uid;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_futures_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'feature_cross_margin_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'feature_funding_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at) VALUES
    ('BTCUSDT-SIM', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE futures_markets
  SET is_active = TRUE, max_leverage = 20, max_user_positions = 50, max_open_interest = '10000000.000000'
  WHERE symbol = 'BTCUSDT-SIM';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'BTCUSDT-SIM';

  -- cross margin: rpc_set_margin_mode('cross') rejected
  BEGIN
    PERFORM rpc_set_margin_mode('cross');
    RAISE EXCEPTION 'expected cross_margin_not_available for rpc_set_margin_mode';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE '%cross_margin_not_available%' THEN
      RAISE EXCEPTION 'unexpected cross set error: %', v_err;
    END IF;
  END;

  -- isolated still works
  PERFORM rpc_set_margin_mode('isolated');

  -- cross mode via SQL + open rejected (back-door set for test only)
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  INSERT INTO margin_accounts (user_id, margin_mode, updated_at)
  VALUES (v_uid, 'cross', NOW())
  ON CONFLICT (user_id) DO UPDATE SET margin_mode = 'cross', updated_at = NOW();

  BEGIN
    PERFORM rpc_open_futures_position(
      'BTCUSDT-SIM', 'long', 'PHON', '100.000000', '2', NULL, NULL,
      'launch-gate-cross-open-' || v_uid::TEXT
    );
    RAISE EXCEPTION 'expected cross_margin_not_available for rpc_open_futures_position';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE '%cross_margin_not_available%' THEN
      RAISE EXCEPTION 'unexpected cross open error: %', v_err;
    END IF;
  END;

  UPDATE margin_accounts SET margin_mode = 'isolated' WHERE user_id = v_uid;

  -- funding: non-zero rate UPDATE blocked (trigger back-door)
  BEGIN
    UPDATE funding_rates SET rate = '0.000100' WHERE market = 'BTCUSDT-SIM';
    RAISE EXCEPTION 'expected funding_not_enabled for non-zero rate UPDATE';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE '%funding_not_enabled%' THEN
      RAISE EXCEPTION 'unexpected funding rate update error: %', v_err;
    END IF;
  END;

  -- funding: rate=0 accrual advances schedule
  UPDATE funding_rates
  SET rate = '0', next_funding_at = NOW() - INTERVAL '1 minute'
  WHERE market = 'BTCUSDT-SIM';

  SELECT next_funding_at INTO v_before FROM funding_rates WHERE market = 'BTCUSDT-SIM';
  PERFORM rpc_run_funding_accrual();
  SELECT next_funding_at INTO v_after FROM funding_rates WHERE market = 'BTCUSDT-SIM';

  IF v_after <= v_before THEN
    RAISE EXCEPTION 'expected schedule advance for rate=0, before=%, after=%', v_before, v_after;
  END IF;

  -- funding: non-zero rate accrual blocked
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE funding_rates SET rate = '0' WHERE market = 'BTCUSDT-SIM';
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  -- bypass trigger for setup: temporarily enable funding flag, set rate, disable, test accrual
  UPDATE app_config SET value = 'true' WHERE key = 'feature_funding_enabled';
  UPDATE funding_rates SET rate = '0.000100', next_funding_at = NOW() - INTERVAL '1 minute'
  WHERE market = 'BTCUSDT-SIM';
  UPDATE app_config SET value = 'false' WHERE key = 'feature_funding_enabled';

  BEGIN
    PERFORM rpc_run_funding_accrual();
    RAISE EXCEPTION 'expected funding_not_enabled for non-zero accrual';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE '%funding_not_enabled%' THEN
      RAISE EXCEPTION 'unexpected funding accrual error: %', v_err;
    END IF;
  END;

  UPDATE funding_rates SET rate = '0' WHERE market = 'BTCUSDT-SIM';
END $$;

ROLLBACK;
