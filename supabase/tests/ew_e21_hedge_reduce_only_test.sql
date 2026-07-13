-- E21 hedge position mode + reduce-only — mode switch · dual-side · reduce fill · Σ=0
BEGIN;

-- E21-0: schema + RPCs exist
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'position_mode' AND e.enumlabel = 'hedge'
  ), 'position_mode.hedge missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'margin_accounts'
       AND column_name = 'position_mode'
  ), 'margin_accounts.position_mode missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'trading_open_orders'
       AND column_name = 'reduce_only'
  ), 'trading_open_orders.reduce_only missing';
  ASSERT has_function_privilege(
    'authenticated', 'public.rpc_set_position_mode(text)', 'EXECUTE'
  ), 'authenticated must EXECUTE rpc_set_position_mode';
  ASSERT has_function_privilege(
    'authenticated', 'public.rpc_get_position_mode()', 'EXECUTE'
  ), 'authenticated must EXECUTE rpc_get_position_mode';
  ASSERT NOT has_function_privilege(
    'authenticated', 'public._assert_futures_open_allowed(uuid, text, position_side, boolean)', 'EXECUTE'
  ), 'authenticated must NOT EXECUTE _assert_futures_open_allowed';
  RAISE NOTICE 'E21-0 OK — schema + grants';
END;
$$;

-- E21-1: set hedge · dual-side open · one_way opposite deny
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_long JSONB;
  v_short JSONB;
  v_mode JSONB;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e21_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '50000.000000' WHERE user_id = v_uid;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_futures_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at) VALUES
    ('BTCUSDT-SIM', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE futures_markets
  SET is_active = TRUE, max_leverage = 20, max_user_positions = 50,
      max_open_interest = '10000000.000000'
  WHERE symbol = 'BTCUSDT-SIM';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'BTCUSDT-SIM';

  SET LOCAL ROLE authenticated;

  v_mode := rpc_set_position_mode('hedge');
  ASSERT v_mode->>'position_mode' = 'hedge', format('set hedge, got %s', v_mode);

  v_long := rpc_open_futures_position(
    'BTCUSDT-SIM', 'long', 'USDT', '200.000000', '5', NULL, NULL, 'e21-long-' || v_uid::TEXT
  );
  ASSERT v_long ? 'position_id', format('long open, got %s', v_long);

  v_short := rpc_open_futures_position(
    'BTCUSDT-SIM', 'short', 'USDT', '200.000000', '5', NULL, NULL, 'e21-short-' || v_uid::TEXT
  );
  ASSERT v_short ? 'position_id', format('hedge short open, got %s', v_short);

  BEGIN
    PERFORM rpc_open_futures_position(
      'BTCUSDT-SIM', 'long', 'USDT', '100.000000', '5', NULL, NULL, 'e21-dup-' || v_uid::TEXT
    );
    RAISE EXCEPTION 'hedge same-side must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%position_mode_hedge_side_exists%' THEN
        v_blocked := TRUE;
      ELSE
        RAISE;
      END IF;
  END;
  ASSERT v_blocked, 'expected position_mode_hedge_side_exists';

  -- Close both then switch to one_way; opposite open must fail
  PERFORM rpc_close_futures_position((v_long->>'position_id')::UUID);
  PERFORM rpc_close_futures_position((v_short->>'position_id')::UUID);

  v_mode := rpc_set_position_mode('one_way');
  ASSERT v_mode->>'position_mode' = 'one_way', 'set one_way';

  v_long := rpc_open_futures_position(
    'BTCUSDT-SIM', 'long', 'USDT', '200.000000', '5', NULL, NULL, 'e21-ow-l-' || v_uid::TEXT
  );

  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_open_futures_position(
      'BTCUSDT-SIM', 'short', 'USDT', '200.000000', '5', NULL, NULL, 'e21-ow-s-' || v_uid::TEXT
    );
    RAISE EXCEPTION 'one_way opposite must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%position_mode_one_way_opposite%' THEN
        v_blocked := TRUE;
      ELSE
        RAISE;
      END IF;
  END;
  ASSERT v_blocked, 'expected position_mode_one_way_opposite';

  RAISE NOTICE 'E21-1 OK — hedge dual · one_way opposite deny';
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
END;
$$;

-- E21-2: reduce-only place reject without opposite · fill closes · Σ=0
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_pos JSONB;
  v_order JSONB;
  v_order_id UUID;
  v_status order_status;
  v_pos_status position_status;
  v_usdt_before NUMERIC;
  v_usdt_after NUMERIC;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e21r_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '20000.000000' WHERE user_id = v_uid;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_futures_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at) VALUES
    ('BTCUSDT-SIM', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE futures_markets
  SET is_active = TRUE, max_leverage = 20, max_user_positions = 50,
      max_open_interest = '10000000.000000'
  WHERE symbol = 'BTCUSDT-SIM';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'BTCUSDT-SIM';

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_before;

  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM rpc_place_limit_order(
      'BTCUSDT-SIM', 'short', 'USDT', '100.000000', '5', '68000.000000',
      'ro-empty-' || v_uid::TEXT, 'gtc', NULL, TRUE
    );
    RAISE EXCEPTION 'reduce_only without position must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%reduce_only_no_position%' THEN
        v_blocked := TRUE;
      ELSE
        RAISE;
      END IF;
  END;
  ASSERT v_blocked, 'expected reduce_only_no_position';

  v_pos := rpc_open_futures_position(
    'BTCUSDT-SIM', 'long', 'USDT', '300.000000', '5', NULL, NULL, 'ro-open-' || v_uid::TEXT
  );

  v_order := rpc_place_limit_order(
    'BTCUSDT-SIM', 'short', 'USDT', '300.000000', '5', '68000.000000',
    'ro-fill-' || v_uid::TEXT, 'gtc', NULL, TRUE
  );
  v_order_id := (v_order->>'order_id')::UUID;
  ASSERT (v_order->>'reduce_only')::BOOLEAN = TRUE, 'reduce_only flag on place';

  RESET ROLE;
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('role', 'service_role')::TEXT,
    TRUE
  );
  SET LOCAL ROLE service_role;
  PERFORM rpc_run_open_order_fills();
  RESET ROLE;
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  SELECT status INTO v_status FROM trading_open_orders WHERE id = v_order_id;
  ASSERT v_status = 'filled', format('reduce-only order filled, got %s', v_status);

  SELECT status INTO v_pos_status
  FROM futures_positions WHERE id = (v_pos->>'position_id')::UUID;
  ASSERT v_pos_status = 'closed', format('position closed by reduce-only, got %s', v_pos_status);

  -- Conservation Σ must run as superuser: authenticated RLS hides other wallets
  -- and all system_accounts (admin-only SELECT).
  RESET ROLE;
  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_usdt_after;

  ASSERT v_usdt_after = v_usdt_before,
    format('USDT Σ drift: before=%s after=%s', v_usdt_before, v_usdt_after);

  RAISE NOTICE 'E21-2 OK — reduce-only fill · conservation';
END;
$$;

-- E21-3: mode switch blocked with open position
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e21m_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '10000.000000' WHERE user_id = v_uid;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    TRUE
  );
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key = 'feature_futures_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at) VALUES
    ('BTCUSDT-SIM', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE futures_markets SET is_active = TRUE WHERE symbol = 'BTCUSDT-SIM';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'BTCUSDT-SIM';

  SET LOCAL ROLE authenticated;

  PERFORM rpc_open_futures_position(
    'BTCUSDT-SIM', 'long', 'USDT', '200.000000', '5', NULL, NULL, 'e21-sw-' || v_uid::TEXT
  );

  BEGIN
    PERFORM rpc_set_position_mode('hedge');
    RAISE EXCEPTION 'switch with open must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%open_positions_block%' THEN
        v_blocked := TRUE;
      ELSE
        RAISE;
      END IF;
  END;
  ASSERT v_blocked, 'expected open_positions_block';

  RAISE NOTICE 'E21-3 OK — mode switch blocked';
END;
$$;

-- E21-4: EXISTS RPCs still present (no remigration)
DO $$
BEGIN
  ASSERT to_regprocedure('public.rpc_update_futures_position_sltp(uuid,text,text)') IS NOT NULL,
    'TP/SL amend RPC must remain';
  ASSERT to_regprocedure('public.rpc_set_trailing_stop(uuid,text,text)') IS NOT NULL,
    'trailing RPC must remain';
  ASSERT to_regprocedure('public.rpc_place_spot_limit_order(text,text,text,text,text,text)') IS NOT NULL,
    'spot limit RPC must remain';
  ASSERT to_regprocedure('public.rpc_place_spot_stop_order(text,text,text,text,text,text,text,text)') IS NOT NULL,
    'spot stop RPC must remain';
  RAISE NOTICE 'E21-4 OK — EXISTS RPCs pinned';
END;
$$;

ROLLBACK;
