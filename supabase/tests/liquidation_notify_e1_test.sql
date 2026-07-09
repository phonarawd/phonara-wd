-- E1 — liquidated branch enqueues trade_position notification outbox row
BEGIN;

DO $$
DECLARE
  v_uid    UUID := gen_random_uuid();
  v_pos    JSONB;
  v_pid    UUID;
  v_status position_status;
  v_res    JSONB;
  v_notif  INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'liq_n_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '100000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHONUSDT-PERP', '0.010000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = '0.010000', updated_at = NOW();
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'PHONUSDT-PERP';
  UPDATE futures_markets SET is_active = TRUE WHERE symbol = 'PHONUSDT-PERP';

  v_pos := rpc_open_futures_position('PHONUSDT-PERP', 'long', 'USDT', '1000.000000', '10');
  v_pid := (v_pos->>'position_id')::UUID;

  UPDATE oracle_prices SET price = '0.009000', updated_at = NOW() WHERE symbol = 'PHONUSDT-PERP';
  INSERT INTO price_ticks (symbol, price, created_at)
  VALUES ('PHONUSDT-PERP', '0.009000', NOW() + INTERVAL '1 second');

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_res := rpc_run_liquidations();
  ASSERT (v_res->>'liquidated')::INT = 0,
    format('first breach sweep must not liquidate, got %s', v_res::TEXT);

  UPDATE oracle_prices SET price = '0.008900', updated_at = NOW() WHERE symbol = 'PHONUSDT-PERP';
  INSERT INTO price_ticks (symbol, price, created_at)
  VALUES ('PHONUSDT-PERP', '0.008900', NOW() + INTERVAL '2 seconds');
  v_res := rpc_run_liquidations();

  SELECT status INTO v_status FROM futures_positions WHERE id = v_pid;
  ASSERT v_status = 'liquidated',
    format('position must be liquidated after second breach tick, got %s', v_status::TEXT);

  SELECT COUNT(*)::INT INTO v_notif
    FROM notification_outbox
   WHERE user_id = v_uid
     AND channel = 'push'
     AND event_type = 'trade_position'
     AND payload->>'position_id' = v_pid::TEXT
     AND payload->>'market' = 'PHONUSDT-PERP'
     AND payload->>'settlement_event' = 'auto_liquidate';

  ASSERT v_notif = 1,
    format('auto-liquidation must enqueue trade_position notification, got %s', v_notif);

  RAISE NOTICE 'LIQUIDATION NOTIFY E1 OK — auto-liquidation enqueues trade_position outbox row';
END;
$$;

DO $$
DECLARE
  v_uid    UUID := gen_random_uuid();
  v_pos    JSONB;
  v_pid    UUID;
  v_notif  INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'liq_c_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '100000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHONUSDT-PERP', '0.010000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = '0.010000', updated_at = NOW();
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol = 'PHONUSDT-PERP';
  UPDATE futures_markets SET is_active = TRUE WHERE symbol = 'PHONUSDT-PERP';

  v_pos := rpc_open_futures_position('PHONUSDT-PERP', 'long', 'USDT', '100.000000', '5');
  v_pid := (v_pos->>'position_id')::UUID;

  PERFORM rpc_close_futures_position(v_pid);

  SELECT COUNT(*)::INT INTO v_notif
    FROM notification_outbox
   WHERE user_id = v_uid
     AND event_type = 'trade_position';

  ASSERT v_notif = 0,
    format('manual close must not enqueue trade_position notification, got %s', v_notif);

  RAISE NOTICE 'LIQUIDATION NOTIFY E1 OK — manual close does not enqueue trade_position';
END;
$$;

ROLLBACK;
