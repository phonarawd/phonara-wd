-- Trade Desk S0 — cross-user trade RPC reject (owner vs attacker)
-- Pins SECURITY DEFINER auth.uid() ownership checks on money paths.
BEGIN;

DO $$
DECLARE
  v_owner    UUID := gen_random_uuid();
  v_attacker UUID := gen_random_uuid();
  v_pos      JSONB;
  v_pos_id   UUID;
  v_order    JSONB;
  v_order_id UUID;
  v_close_blocked BOOLEAN := FALSE;
  v_cancel_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_owner, 'authenticated', 'authenticated', 's0_owner_' || v_owner::TEXT || '@test.local', NOW(), NOW()),
    (v_attacker, 'authenticated', 'authenticated', 's0_atk_' || v_attacker::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '1000000.000000' WHERE user_id = v_owner;
  UPDATE wallets SET usdt_available = '1000000.000000' WHERE user_id = v_attacker;

  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';
  UPDATE app_config SET value = 'true' WHERE key IN ('feature_futures_enabled', 'feature_spot_enabled');

  INSERT INTO oracle_prices (symbol, price, updated_at) VALUES
    ('PHONUSDT-PERP', '0.010000', NOW()),
    ('PHON_USDT', '0.100000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE futures_markets
     SET is_active = TRUE, max_user_positions = 100, max_open_interest = '1000000.000000'
   WHERE symbol = 'PHONUSDT-PERP';
  UPDATE spot_markets SET is_active = TRUE WHERE symbol = 'PHON_USDT';
  UPDATE market_circuit_breakers SET is_halted = FALSE WHERE symbol IN ('PHONUSDT-PERP', 'PHON_USDT');

  -- Owner opens futures position
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner::TEXT)::TEXT, true);
  v_pos := rpc_open_futures_position(
    'PHONUSDT-PERP', 'long', 'USDT', '100.000000', '2', NULL, NULL,
    's0-open-' || v_owner::TEXT
  );
  v_pos_id := (v_pos->>'position_id')::UUID;

  -- Attacker cannot close owner's position
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_attacker::TEXT)::TEXT, true);
  BEGIN
    PERFORM rpc_close_futures_position(v_pos_id);
    RAISE EXCEPTION 'expected forbidden on cross-user futures close';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%forbidden%' THEN v_close_blocked := TRUE; END IF;
  END;
  ASSERT v_close_blocked, 'cross-user rpc_close_futures_position must raise forbidden';

  -- Owner places spot limit order
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner::TEXT)::TEXT, true);
  v_order := rpc_place_spot_limit_order(
    'PHON_USDT', 'buy', 'USDT', '100.000000', '0.090000',
    's0-spot-' || v_owner::TEXT
  );
  v_order_id := (v_order->>'order_id')::UUID;

  -- Attacker cannot cancel owner's spot order
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_attacker::TEXT)::TEXT, true);
  BEGIN
    PERFORM rpc_cancel_spot_order(v_order_id);
    RAISE EXCEPTION 'expected forbidden on cross-user spot cancel';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%forbidden%' THEN v_cancel_blocked := TRUE; END IF;
  END;
  ASSERT v_cancel_blocked, 'cross-user rpc_cancel_spot_order must raise forbidden';

  RAISE NOTICE 'S0 CROSS-USER REJECT OK — futures close + spot cancel forbidden for non-owner';
END;
$$;

ROLLBACK;
