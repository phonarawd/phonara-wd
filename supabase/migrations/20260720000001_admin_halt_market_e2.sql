-- ============================================================
-- Migration: 20260720000001_admin_halt_market_e2
-- E2 — rpc_admin_halt_market + enhanced resume audit (Launch Go/No-Go)
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _snapshot_trade_market_state(p_symbol TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cb market_circuit_breakers%ROWTYPE;
  v_oracle_price TEXT;
  v_spot_active BOOLEAN;
  v_futures_active BOOLEAN;
BEGIN
  SELECT * INTO v_cb FROM market_circuit_breakers WHERE symbol = p_symbol;

  SELECT price INTO v_oracle_price FROM oracle_prices WHERE symbol = p_symbol;

  SELECT is_active INTO v_spot_active FROM spot_markets WHERE symbol = p_symbol;
  SELECT is_active INTO v_futures_active FROM futures_markets WHERE symbol = p_symbol;

  RETURN jsonb_build_object(
    'symbol', p_symbol,
    'is_halted', COALESCE(v_cb.is_halted, FALSE),
    'halt_reason', v_cb.halt_reason,
    'halted_at', v_cb.halted_at,
    'price_at_halt', v_cb.price_at_halt,
    'resumed_at', v_cb.resumed_at,
    'oracle_price', v_oracle_price,
    'spot_is_active', v_spot_active,
    'futures_is_active', v_futures_active
  );
END;
$$;

REVOKE ALL ON FUNCTION _snapshot_trade_market_state(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_admin_list_trade_market_breakers()
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM _assert_admin_aal2();

  RETURN QUERY
  SELECT _snapshot_trade_market_state(mcb.symbol)
  FROM market_circuit_breakers mcb
  ORDER BY mcb.symbol;
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_halt_market(
  p_symbol TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor  UUID := auth.uid();
  v_before JSONB;
  v_after  JSONB;
  v_price  TEXT;
BEGIN
  IF v_actor IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM _assert_admin_aal2();

  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  SELECT price INTO v_price
  FROM oracle_prices
  WHERE symbol = p_symbol
  FOR UPDATE;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'market_not_found';
  END IF;

  PERFORM 1 FROM market_circuit_breakers WHERE symbol = p_symbol FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'market_not_found';
  END IF;

  v_before := _snapshot_trade_market_state(p_symbol);

  UPDATE market_circuit_breakers SET
    is_halted = TRUE,
    halt_reason = 'admin:' || left(btrim(p_reason), 200),
    halted_at = NOW(),
    price_at_halt = v_price,
    updated_at = NOW()
  WHERE symbol = p_symbol;

  UPDATE futures_markets SET is_active = FALSE WHERE symbol = p_symbol;
  UPDATE spot_markets SET is_active = FALSE WHERE symbol = p_symbol;

  v_after := _snapshot_trade_market_state(p_symbol);

  INSERT INTO audit_logs (actor_id, action, entity_type, payload)
  VALUES (
    v_actor,
    'trade_market_halt',
    'market_circuit_breakers',
    jsonb_build_object(
      'symbol', p_symbol,
      'reason', btrim(p_reason),
      'before', v_before,
      'after', v_after
    )
  );

  INSERT INTO price_change_audit (
    symbol, price_before, price_after, change_pct, source, actor_id, reason, circuit_breaker_triggered
  )
  VALUES (p_symbol, v_price, v_price, 0, 'admin_halt', v_actor, btrim(p_reason), TRUE);

  RETURN jsonb_build_object(
    'symbol', p_symbol,
    'halted', TRUE,
    'before', v_before,
    'after', v_after
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_resume_market(p_symbol TEXT, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor  UUID := auth.uid();
  v_before JSONB;
  v_after  JSONB;
  v_price  TEXT;
BEGIN
  IF v_actor IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM _assert_admin_aal2();

  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  PERFORM 1 FROM market_circuit_breakers WHERE symbol = p_symbol FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'market_not_found';
  END IF;

  v_before := _snapshot_trade_market_state(p_symbol);

  UPDATE market_circuit_breakers SET
    is_halted = FALSE,
    halt_reason = NULL,
    resumed_at = NOW(),
    updated_at = NOW()
  WHERE symbol = p_symbol;

  UPDATE futures_markets SET is_active = TRUE WHERE symbol = p_symbol;
  UPDATE spot_markets SET is_active = TRUE WHERE symbol = p_symbol;

  SELECT price INTO v_price FROM oracle_prices WHERE symbol = p_symbol;

  v_after := _snapshot_trade_market_state(p_symbol);

  INSERT INTO audit_logs (actor_id, action, entity_type, payload)
  VALUES (
    v_actor,
    'trade_market_resume',
    'market_circuit_breakers',
    jsonb_build_object(
      'symbol', p_symbol,
      'reason', btrim(p_reason),
      'before', v_before,
      'after', v_after
    )
  );

  IF v_price IS NOT NULL THEN
    INSERT INTO price_change_audit (symbol, price_before, price_after, change_pct, source, actor_id, reason)
    VALUES (p_symbol, v_price, v_price, 0, 'admin_resume', v_actor, btrim(p_reason));
  END IF;

  RETURN jsonb_build_object(
    'symbol', p_symbol,
    'resumed', TRUE,
    'before', v_before,
    'after', v_after
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_trade_market_breakers() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rpc_admin_halt_market(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rpc_resume_market(TEXT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION rpc_admin_list_trade_market_breakers() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_admin_halt_market(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_resume_market(TEXT, TEXT) TO authenticated, service_role;
