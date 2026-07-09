-- Trade T2: funding wallet settlement (S2 — no retroactive; ON-period only)
BEGIN;

DO $$
DECLARE
  v_uid_long  UUID := gen_random_uuid();
  v_uid_short UUID := gen_random_uuid();
  v_long_id   UUID;
  v_short_id  UUID;
  v_usdt_before NUMERIC;
  v_usdt_after  NUMERIC;
  v_res JSONB;
  v_long_pay TEXT;
  v_short_recv TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid_long, 'authenticated', 'authenticated', 't2_fund_long_' || v_uid_long::TEXT || '@test.local', NOW(), NOW()),
    (v_uid_short, 'authenticated', 'authenticated', 't2_fund_short_' || v_uid_short::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '10000.000000' WHERE user_id IN (v_uid_long, v_uid_short);

  UPDATE app_config SET value = 'true' WHERE key = 'feature_funding_enabled';
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_futures_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at) VALUES
    ('BTCUSDT-SIM', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE futures_markets
  SET is_active = TRUE, max_leverage = 10, max_user_positions = 50, max_open_interest = '10000000.000000'
  WHERE symbol = 'BTCUSDT-SIM';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'BTCUSDT-SIM';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_long::TEXT)::TEXT, true);
  v_long_id := (rpc_open_futures_position(
    'BTCUSDT-SIM', 'long', 'USDT', '1000.000000', '5', NULL, NULL,
    't2-fund-long-' || v_uid_long::TEXT
  )->>'position_id')::UUID;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_short::TEXT)::TEXT, true);
  v_short_id := (rpc_open_futures_position(
    'BTCUSDT-SIM', 'short', 'USDT', '1000.000000', '5', NULL, NULL,
    't2-fund-short-' || v_uid_short::TEXT
  )->>'position_id')::UUID;

  PERFORM set_config('request.jwt.claims', '{}', true);

  UPDATE funding_rates
  SET rate = '0.000100', next_funding_at = NOW() - INTERVAL '1 minute'
  WHERE market = 'BTCUSDT-SIM';

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC),0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='USDT')
  INTO v_usdt_before;

  v_res := rpc_run_funding_accrual();
  IF COALESCE((v_res->>'settled')::INT, 0) < 2 THEN
    RAISE EXCEPTION 'expected >=2 funding settlements, got %', v_res;
  END IF;

  SELECT amount INTO v_long_pay FROM funding_payments WHERE position_id = v_long_id ORDER BY created_at DESC LIMIT 1;
  SELECT amount INTO v_short_recv FROM funding_payments WHERE position_id = v_short_id ORDER BY created_at DESC LIMIT 1;

  IF v_long_pay::NUMERIC >= 0 THEN
    RAISE EXCEPTION 'long funding payment must be negative, got %', v_long_pay;
  END IF;
  IF v_short_recv::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'short funding payment must be positive, got %', v_short_recv;
  END IF;

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC),0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='USDT')
  INTO v_usdt_after;

  IF v_usdt_before <> v_usdt_after THEN
    RAISE EXCEPTION 'funding conservation violated: before=% after=%', v_usdt_before, v_usdt_after;
  END IF;

  -- idempotent re-run for same period: schedule already advanced, no double pay
  v_res := rpc_run_funding_accrual();
  IF EXISTS (
    SELECT 1 FROM funding_payments
    WHERE position_id IN (v_long_id, v_short_id)
    GROUP BY position_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'duplicate funding payment rows detected';
  END IF;

  RAISE NOTICE 'T2 FUNDING SETTLEMENT OK — long pays / short receives · Σ=0 · S2 no retroactive';
END $$;

ROLLBACK;
