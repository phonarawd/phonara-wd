-- Trade T1: spot_open_orders place · cancel · fill + conservation
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_usdt_before NUMERIC;
  v_usdt_after  NUMERIC;
  v_phon_before NUMERIC;
  v_phon_after  NUMERIC;
  v_order       JSONB;
  v_order_id    UUID;
  v_status      order_status;
  v_locked      TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'spot_oo_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '10000.000000', phon_available = '5000.000000' WHERE user_id = v_uid;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_spot_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at) VALUES
    ('PHON_USDT', '0.100000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE spot_markets SET is_active = TRUE WHERE symbol = 'PHON_USDT';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'PHON_USDT';

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_before;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  -- Place buy limit below mark (pending fill)
  v_order := rpc_place_spot_limit_order(
    'PHON_USDT', 'buy', 'USDT', '100.000000', '0.090000',
    'spot-lim-' || v_uid::TEXT
  );
  v_order_id := (v_order->>'order_id')::UUID;

  SELECT status INTO v_status FROM spot_open_orders WHERE id = v_order_id;
  IF v_status <> 'open' THEN
    RAISE EXCEPTION 'expected open spot limit buy, got %', v_status;
  END IF;

  SELECT usdt_locked INTO v_locked FROM wallets WHERE user_id = v_uid;
  IF v_locked::NUMERIC <> 100 THEN
    RAISE EXCEPTION 'expected 100 USDT locked, got %', v_locked;
  END IF;

  -- Duplicate client_request_id rejected
  BEGIN
    PERFORM rpc_place_spot_limit_order(
      'PHON_USDT', 'buy', 'USDT', '50.000000', '0.090000',
      'spot-lim-' || v_uid::TEXT
    );
    RAISE EXCEPTION 'expected duplicate_request';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%duplicate_request%' THEN
      RAISE;
    END IF;
  END;

  -- Cancel restores available
  PERFORM rpc_cancel_spot_order(v_order_id);

  SELECT status INTO v_status FROM spot_open_orders WHERE id = v_order_id;
  IF v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'expected cancelled spot order, got %', v_status;
  END IF;

  SELECT usdt_locked INTO v_locked FROM wallets WHERE user_id = v_uid;
  IF v_locked::NUMERIC <> 0 THEN
    RAISE EXCEPTION 'expected 0 USDT locked after cancel, got %', v_locked;
  END IF;

  -- Place buy limit at mark (fillable)
  v_order := rpc_place_spot_limit_order(
    'PHON_USDT', 'buy', 'USDT', '100.000000', '0.100000',
    'spot-lim-fill-' || v_uid::TEXT
  );
  v_order_id := (v_order->>'order_id')::UUID;

  PERFORM rpc_run_spot_order_fills();

  SELECT status INTO v_status FROM spot_open_orders WHERE id = v_order_id;
  IF v_status <> 'filled' THEN
    RAISE EXCEPTION 'expected filled spot limit buy, got %', v_status;
  END IF;

  -- Sell limit fill round-trip
  v_order := rpc_place_spot_limit_order(
    'PHON_USDT', 'sell', 'USDT', '500.000000', '0.100000',
    'spot-sell-' || v_uid::TEXT
  );
  v_order_id := (v_order->>'order_id')::UUID;

  PERFORM rpc_run_spot_order_fills();

  SELECT status INTO v_status FROM spot_open_orders WHERE id = v_order_id;
  IF v_status <> 'filled' THEN
    RAISE EXCEPTION 'expected filled spot limit sell, got %', v_status;
  END IF;

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  IF v_usdt_before <> v_usdt_after THEN
    RAISE EXCEPTION 'USDT conservation violated: before=% after=%', v_usdt_before, v_usdt_after;
  END IF;

  IF v_phon_before <> v_phon_after THEN
    RAISE EXCEPTION 'PHON conservation violated: before=% after=%', v_phon_before, v_phon_after;
  END IF;

  RAISE NOTICE 'TRADE T1 SPOT OPEN ORDERS CONSERVATION OK';
END $$;

ROLLBACK;
