-- ============================================================
-- Migration: 20260722000001_trade_e_phase_e_advanced_orders
-- Trade Phase E: trailing stop · time-in-force · iceberg slices
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_in_force') THEN
    CREATE TYPE time_in_force AS ENUM ('gtc', 'post_only', 'ioc', 'fok');
  END IF;
END $$;

-- ─── Schema: open orders (TIF · iceberg) ─────────────────────────────────────

ALTER TABLE trading_open_orders
  ADD COLUMN IF NOT EXISTS time_in_force time_in_force NOT NULL DEFAULT 'gtc',
  ADD COLUMN IF NOT EXISTS display_quantity TEXT
    CONSTRAINT too_display_qty_fmt CHECK (display_quantity IS NULL OR display_quantity ~ '^\d+(\.\d+)?$'),
  ADD COLUMN IF NOT EXISTS tif_checked BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Schema: positions (trailing stop) ───────────────────────────────────────

ALTER TABLE futures_positions
  ADD COLUMN IF NOT EXISTS trailing_stop_callback_rate TEXT
    CONSTRAINT fp_trail_cb_fmt CHECK (
      trailing_stop_callback_rate IS NULL
      OR trailing_stop_callback_rate ~ '^\d+(\.\d+)?$'
    ),
  ADD COLUMN IF NOT EXISTS trailing_stop_activation_price TEXT
    CONSTRAINT fp_trail_act_fmt CHECK (
      trailing_stop_activation_price IS NULL
      OR trailing_stop_activation_price ~ '^\d+(\.\d+)?$'
    ),
  ADD COLUMN IF NOT EXISTS trailing_stop_extreme_price TEXT
    CONSTRAINT fp_trail_ext_fmt CHECK (
      trailing_stop_extreme_price IS NULL
      OR trailing_stop_extreme_price ~ '^\d+(\.\d+)?$'
    );

-- ─── Rate limits ─────────────────────────────────────────────────────────────

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_set_trailing_stop', 20, 0.333, 1, 60),
  ('rpc_clear_trailing_stop', 20, 0.333, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _parse_time_in_force(p_tif TEXT)
RETURNS time_in_force
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_tif IS NULL OR btrim(p_tif) = '' THEN
    RETURN 'gtc'::time_in_force;
  END IF;
  IF p_tif NOT IN ('gtc', 'post_only', 'ioc', 'fok') THEN
    RAISE EXCEPTION 'invalid_time_in_force';
  END IF;
  RETURN p_tif::time_in_force;
END;
$$;

REVOKE ALL ON FUNCTION _parse_time_in_force(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _trailing_stop_triggered(
  p_side position_side,
  p_mark NUMERIC,
  p_extreme TEXT,
  p_callback_rate TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_extreme IS NULL OR p_callback_rate IS NULL THEN FALSE
    WHEN p_side = 'long' THEN
      p_mark <= p_extreme::NUMERIC * (1 - p_callback_rate::NUMERIC)
    WHEN p_side = 'short' THEN
      p_mark >= p_extreme::NUMERIC * (1 + p_callback_rate::NUMERIC)
    ELSE FALSE
  END;
$$;

REVOKE ALL ON FUNCTION _trailing_stop_triggered(position_side, NUMERIC, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _trailing_stop_activation_met(
  p_side position_side,
  p_mark NUMERIC,
  p_activation TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_activation IS NULL THEN TRUE
    WHEN p_side = 'long' THEN p_mark >= p_activation::NUMERIC
    WHEN p_side = 'short' THEN p_mark <= p_activation::NUMERIC
    ELSE FALSE
  END;
$$;

REVOKE ALL ON FUNCTION _trailing_stop_activation_met(position_side, NUMERIC, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _cancel_open_order_internal(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order trading_open_orders%ROWTYPE;
  v_remaining_margin NUMERIC;
  v_total_qty NUMERIC;
  v_filled_qty NUMERIC;
BEGIN
  SELECT * INTO v_order
  FROM trading_open_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.status NOT IN ('pending', 'open', 'triggered', 'partially_filled') THEN
    RAISE EXCEPTION 'order_not_cancellable';
  END IF;

  v_total_qty := v_order.quantity::NUMERIC;
  v_filled_qty := v_order.filled_quantity::NUMERIC;
  v_remaining_margin := v_order.margin_amount::NUMERIC * GREATEST(v_total_qty - v_filled_qty, 0) / v_total_qty;

  IF v_remaining_margin > 0 THEN
    PERFORM _unlock_wallet_internal(
      v_order.user_id, v_order.margin_currency, _fmt6(v_remaining_margin),
      'order_margin_unlock', 'ord_cancel:' || v_order.id::TEXT
    );
  END IF;

  UPDATE trading_open_orders
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION _cancel_open_order_internal(UUID) FROM PUBLIC, anon, authenticated;

-- Drop prior signatures before extending parameters (PostgreSQL overload rules).
DROP FUNCTION IF EXISTS rpc_place_limit_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS _place_open_order_common(
  TEXT, TEXT, TEXT, TEXT, TEXT, order_type, order_status, TEXT, TEXT, TEXT
);

-- ─── Place order common (TIF · iceberg display qty) ────────────────────────────

CREATE OR REPLACE FUNCTION _place_open_order_common(
  p_market            TEXT,
  p_side              TEXT,
  p_margin_currency   TEXT,
  p_margin_amount     TEXT,
  p_leverage          TEXT,
  p_order_type        order_type,
  p_initial_status    order_status,
  p_price             TEXT,
  p_stop_price        TEXT,
  p_client_request_id TEXT,
  p_time_in_force     TEXT DEFAULT 'gtc',
  p_display_quantity  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id  UUID := auth.uid();
  v_mkt      futures_markets%ROWTYPE;
  v_ccy      currency;
  v_side     position_side;
  v_margin   NUMERIC;
  v_lev      NUMERIC;
  v_ref_px   NUMERIC;
  v_notional NUMERIC;
  v_qty      NUMERIC;
  v_order_id UUID := gen_random_uuid();
  v_tif      time_in_force;
  v_mark     NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('futures');
  IF EXISTS (
    SELECT 1 FROM margin_accounts
    WHERE user_id = v_user_id AND margin_mode = 'cross'
  ) THEN
    PERFORM _assert_cross_margin_enabled();
  END IF;
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_margin_amount);
  PERFORM _assert_amount_text(p_leverage);

  IF p_client_request_id IS NULL OR btrim(p_client_request_id) = '' THEN
    RAISE EXCEPTION 'client_request_id_required';
  END IF;

  v_tif := _parse_time_in_force(p_time_in_force);
  IF v_tif IN ('ioc', 'fok', 'post_only') AND p_order_type <> 'limit' THEN
    RAISE EXCEPTION 'tif_limit_only';
  END IF;

  INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
  VALUES (
    v_user_id,
    p_client_request_id,
    CASE
      WHEN p_order_type = 'limit' THEN 'rpc_place_limit_order'
      ELSE 'rpc_place_stop_order'
    END
  )
  ON CONFLICT (user_id, client_request_id) DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'duplicate_request'; END IF;

  IF p_side NOT IN ('long', 'short') THEN RAISE EXCEPTION 'invalid_side'; END IF;
  IF p_margin_currency NOT IN ('PHON', 'USDT') THEN RAISE EXCEPTION 'invalid_margin_currency'; END IF;

  v_side := p_side::position_side;
  v_ccy  := p_margin_currency::currency;
  v_margin := p_margin_amount::NUMERIC;
  v_lev := p_leverage::NUMERIC;

  IF v_margin <= 0 THEN RAISE EXCEPTION 'invalid_margin'; END IF;
  IF v_lev < 1 THEN RAISE EXCEPTION 'invalid_leverage'; END IF;

  SELECT * INTO v_mkt FROM futures_markets WHERE symbol = p_market AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;
  IF v_lev > v_mkt.max_leverage::NUMERIC THEN RAISE EXCEPTION 'leverage_too_high'; END IF;

  PERFORM _assert_rg_domain_entry_allowed(v_user_id, 'trading', v_ccy);

  v_notional := v_margin * v_lev;
  IF v_mkt.min_notional IS NOT NULL AND v_notional < v_mkt.min_notional::NUMERIC THEN
    RAISE EXCEPTION 'below_min_notional' USING HINT = p_market;
  END IF;

  IF p_order_type = 'limit' THEN
    IF p_price IS NULL THEN RAISE EXCEPTION 'limit_price_required'; END IF;
    PERFORM _assert_amount_text(p_price);
    v_ref_px := p_price::NUMERIC;
    IF v_ref_px <= 0 THEN RAISE EXCEPTION 'invalid_price'; END IF;

    IF v_tif = 'post_only' THEN
      v_mark := _assert_price_fresh(p_market);
      IF _order_limit_crossed(v_side, v_mark, p_price) THEN
        RAISE EXCEPTION 'post_only_would_cross';
      END IF;
    END IF;
  ELSIF p_order_type IN ('stop_market', 'stop_limit') THEN
    IF p_stop_price IS NULL THEN RAISE EXCEPTION 'stop_price_required'; END IF;
    PERFORM _assert_amount_text(p_stop_price);
    v_ref_px := p_stop_price::NUMERIC;
    IF v_ref_px <= 0 THEN RAISE EXCEPTION 'invalid_price'; END IF;
    IF p_order_type = 'stop_limit' THEN
      IF p_price IS NULL THEN RAISE EXCEPTION 'limit_price_required'; END IF;
      PERFORM _assert_amount_text(p_price);
      IF p_price::NUMERIC <= 0 THEN RAISE EXCEPTION 'invalid_price'; END IF;
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid_order_type';
  END IF;

  v_qty := v_notional / v_ref_px;

  IF p_display_quantity IS NOT NULL THEN
    PERFORM _assert_amount_text(p_display_quantity);
    IF p_display_quantity::NUMERIC <= 0 OR p_display_quantity::NUMERIC > v_qty THEN
      RAISE EXCEPTION 'invalid_display_quantity';
    END IF;
  END IF;

  PERFORM _lock_wallet_internal(
    v_user_id, v_ccy, _fmt6(v_margin),
    'order_margin_lock', 'ord_margin:' || v_order_id::TEXT
  );

  INSERT INTO trading_open_orders (
    id, user_id, market, side, order_type, status,
    margin_currency, price, stop_price, quantity, leverage, margin_amount,
    client_request_id, time_in_force, display_quantity
  ) VALUES (
    v_order_id, v_user_id, p_market, v_side, p_order_type, p_initial_status,
    v_ccy, p_price, p_stop_price, _fmt6(v_qty), p_leverage, _fmt6(v_margin),
    p_client_request_id, v_tif, p_display_quantity
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'market', p_market,
    'side', p_side,
    'order_type', p_order_type,
    'time_in_force', v_tif,
    'display_quantity', p_display_quantity
  );
END;
$$;

REVOKE ALL ON FUNCTION _place_open_order_common(
  TEXT, TEXT, TEXT, TEXT, TEXT, order_type, order_status, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

-- ─── Client RPCs: limit/stop (optional TIF · iceberg) ─────────────────────────

CREATE OR REPLACE FUNCTION rpc_place_limit_order(
  p_market            TEXT,
  p_side              TEXT,
  p_margin_currency   TEXT,
  p_margin_amount     TEXT,
  p_leverage          TEXT,
  p_limit_price       TEXT,
  p_client_request_id TEXT,
  p_time_in_force     TEXT DEFAULT 'gtc',
  p_display_quantity  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(auth.uid(), 'rpc_place_limit_order');

  RETURN _place_open_order_common(
    p_market, p_side, p_margin_currency, p_margin_amount, p_leverage,
    'limit'::order_type, 'open'::order_status,
    p_limit_price, NULL, p_client_request_id, p_time_in_force, p_display_quantity
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_limit_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_limit_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

-- ─── Trailing stop RPCs ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_set_trailing_stop(
  p_position_id              UUID,
  p_callback_rate            TEXT,
  p_activation_price         TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pos     futures_positions%ROWTYPE;
  v_mark    NUMERIC;
  v_rate    NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_set_trailing_stop');
  PERFORM _assert_feature_enabled('futures');

  PERFORM _assert_amount_text(p_callback_rate);
  v_rate := p_callback_rate::NUMERIC;
  IF v_rate <= 0 OR v_rate >= 1 THEN
    RAISE EXCEPTION 'invalid_trailing_callback_rate';
  END IF;

  IF p_activation_price IS NOT NULL THEN
    PERFORM _assert_amount_text(p_activation_price);
    IF p_activation_price::NUMERIC <= 0 THEN
      RAISE EXCEPTION 'invalid_activation_price';
    END IF;
  END IF;

  SELECT * INTO v_pos
  FROM futures_positions
  WHERE id = p_position_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_pos.status <> 'open' THEN RAISE EXCEPTION 'position_not_open'; END IF;

  v_mark := _assert_price_fresh(v_pos.market);

  UPDATE futures_positions SET
    trailing_stop_callback_rate = p_callback_rate,
    trailing_stop_activation_price = p_activation_price,
    trailing_stop_extreme_price = _fmt6(v_mark),
    stop_loss = NULL,
    updated_at = NOW()
  WHERE id = p_position_id;

  INSERT INTO position_ledger (position_id, user_id, event, price, payload)
  VALUES (
    p_position_id, v_user_id, 'sltp', v_pos.entry_price,
    jsonb_build_object(
      'trailing_stop_callback_rate', p_callback_rate,
      'trailing_stop_activation_price', p_activation_price,
      'trailing_stop_extreme_price', _fmt6(v_mark)
    )
  );

  RETURN jsonb_build_object(
    'position_id', p_position_id,
    'trailing_stop_callback_rate', p_callback_rate,
    'trailing_stop_activation_price', p_activation_price,
    'trailing_stop_extreme_price', _fmt6(v_mark)
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_clear_trailing_stop(p_position_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pos     futures_positions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_clear_trailing_stop');
  PERFORM _assert_feature_enabled('futures');

  SELECT * INTO v_pos
  FROM futures_positions
  WHERE id = p_position_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_pos.status <> 'open' THEN RAISE EXCEPTION 'position_not_open'; END IF;

  UPDATE futures_positions SET
    trailing_stop_callback_rate = NULL,
    trailing_stop_activation_price = NULL,
    trailing_stop_extreme_price = NULL,
    updated_at = NOW()
  WHERE id = p_position_id;

  INSERT INTO position_ledger (position_id, user_id, event, price, payload)
  VALUES (
    p_position_id, v_user_id, 'sltp', v_pos.entry_price,
    jsonb_build_object('trailing_stop_cleared', TRUE)
  );

  RETURN jsonb_build_object('position_id', p_position_id, 'trailing_stop_cleared', TRUE);
END;
$$;

REVOKE ALL ON FUNCTION rpc_set_trailing_stop(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_set_trailing_stop(UUID, TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_clear_trailing_stop(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_clear_trailing_stop(UUID) TO authenticated, service_role;

-- ─── Fill internal (iceberg slice · partial fill) ─────────────────────────────

CREATE OR REPLACE FUNCTION _fill_house_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order          trading_open_orders%ROWTYPE;
  v_mkt            futures_markets%ROWTYPE;
  v_mark           NUMERIC;
  v_fill_px        NUMERIC;
  v_margin         NUMERIC;
  v_lev            NUMERIC;
  v_mmr            NUMERIC;
  v_notional       NUMERIC;
  v_total_qty      NUMERIC;
  v_filled_qty     NUMERIC;
  v_remaining_qty  NUMERIC;
  v_slice_qty      NUMERIC;
  v_slice_ratio    NUMERIC;
  v_slice_margin   NUMERIC;
  v_slice_notional NUMERIC;
  v_slice_fee      NUMERIC;
  v_open_fee       NUMERIC;
  v_inv_lev        NUMERIC;
  v_liq            NUMERIC;
  v_pos_id         UUID := gen_random_uuid();
  v_tid            UUID := gen_random_uuid();
  v_new_filled     NUMERIC;
BEGIN
  SELECT * INTO v_order
  FROM trading_open_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.status NOT IN ('open', 'triggered', 'partially_filled') THEN
    RAISE EXCEPTION 'order_not_fillable';
  END IF;

  SELECT * INTO v_mkt FROM futures_markets WHERE symbol = v_order.market AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  v_mark := _assert_price_fresh(v_order.market);

  IF v_order.order_type = 'limit' THEN
    IF NOT _order_limit_crossed(v_order.side, v_mark, v_order.price) THEN
      RAISE EXCEPTION 'limit_not_crossed';
    END IF;
    v_fill_px := v_order.price::NUMERIC;
  ELSIF v_order.order_type = 'stop_market' THEN
    IF NOT _order_stop_entry_triggered(v_order.side, v_mark, v_order.stop_price) THEN
      RAISE EXCEPTION 'stop_not_triggered';
    END IF;
    v_fill_px := v_mark;
  ELSIF v_order.order_type = 'stop_limit' THEN
    IF NOT _order_limit_crossed(v_order.side, v_mark, v_order.price) THEN
      RAISE EXCEPTION 'limit_not_crossed';
    END IF;
    v_fill_px := v_order.price::NUMERIC;
  ELSE
    RAISE EXCEPTION 'invalid_order_type';
  END IF;

  v_margin := v_order.margin_amount::NUMERIC;
  v_lev := v_order.leverage::NUMERIC;
  v_mmr := v_mkt.maintenance_margin_rate::NUMERIC;
  v_notional := v_margin * v_lev;
  v_total_qty := v_order.quantity::NUMERIC;
  v_filled_qty := v_order.filled_quantity::NUMERIC;
  v_remaining_qty := v_total_qty - v_filled_qty;

  IF v_remaining_qty <= 0 THEN
    RAISE EXCEPTION 'order_already_filled';
  END IF;

  v_slice_qty := v_remaining_qty;
  IF v_order.display_quantity IS NOT NULL THEN
    v_slice_qty := LEAST(v_remaining_qty, v_order.display_quantity::NUMERIC);
  END IF;

  v_slice_ratio := v_slice_qty / v_total_qty;
  v_slice_margin := v_margin * v_slice_ratio;
  v_slice_notional := v_notional * v_slice_ratio;
  v_open_fee := v_notional * v_mkt.open_fee_rate::NUMERIC;
  v_slice_fee := v_open_fee * v_slice_ratio;
  v_inv_lev := 1 / v_lev;

  PERFORM _assert_position_limits(v_order.user_id, v_order.market, v_slice_notional);

  IF v_order.side = 'long' THEN
    v_liq := v_fill_px * (1 - v_inv_lev + v_mmr);
  ELSE
    v_liq := v_fill_px * (1 + v_inv_lev - v_mmr);
  END IF;
  IF v_liq < 0 THEN v_liq := 0; END IF;

  PERFORM _unlock_wallet_internal(
    v_order.user_id, v_order.margin_currency, _fmt6(v_slice_margin),
    'order_margin_unlock', 'ord_unlock:' || v_order.id::TEXT || ':' || v_pos_id::TEXT
  );
  PERFORM _lock_wallet_internal(
    v_order.user_id, v_order.margin_currency, _fmt6(v_slice_margin),
    'futures_margin_lock', 'fut_margin:' || v_pos_id::TEXT
  );

  IF trunc(v_slice_fee, 6) > 0 THEN
    PERFORM _debit_wallet_internal(
      v_order.user_id, v_order.margin_currency, _fmt6(v_slice_fee),
      'futures_open_fee', 'fut_openfee:' || v_pos_id::TEXT
    );
    PERFORM _credit_system_account(
      'house_fee_' || lower(v_order.margin_currency::TEXT), _fmt6(v_slice_fee),
      'futures_open_fee', v_order.user_id, v_pos_id::TEXT, v_tid
    );
  END IF;

  INSERT INTO futures_positions (
    id, user_id, market, side, margin_currency, margin_amount, leverage,
    entry_price, quantity, notional, open_fee, liquidation_price, margin_mode
  ) VALUES (
    v_pos_id, v_order.user_id, v_order.market, v_order.side,
    v_order.margin_currency, _fmt6(v_slice_margin), v_order.leverage,
    _fmt6(v_fill_px), _fmt6(v_slice_qty), _fmt6(v_slice_notional),
    _fmt6(v_slice_fee), _fmt6(v_liq), v_order.margin_mode
  );

  INSERT INTO position_ledger (position_id, user_id, event, price, fee, payload)
  VALUES (
    v_pos_id, v_order.user_id, 'open', _fmt6(v_fill_px), _fmt6(v_slice_fee),
    jsonb_build_object(
      'side', v_order.side,
      'leverage', v_lev,
      'notional', _fmt6(v_slice_notional),
      'source_order_id', v_order.id,
      'iceberg_slice', v_order.display_quantity IS NOT NULL
    )
  );

  INSERT INTO trading_order_fills (order_id, fill_price, fill_quantity, fee)
  VALUES (v_order.id, _fmt6(v_fill_px), _fmt6(v_slice_qty), _fmt6(v_slice_fee));

  v_new_filled := v_filled_qty + v_slice_qty;

  UPDATE trading_open_orders
  SET status = CASE
        WHEN v_new_filled >= v_total_qty THEN 'filled'::order_status
        ELSE 'partially_filled'::order_status
      END,
      filled_quantity = _fmt6(v_new_filled),
      updated_at = NOW()
  WHERE id = v_order.id;

  RETURN jsonb_build_object(
    'order_id', v_order.id,
    'position_id', v_pos_id,
    'fill_price', _fmt6(v_fill_px),
    'quantity', _fmt6(v_slice_qty),
    'open_fee', _fmt6(v_slice_fee),
    'filled_quantity', _fmt6(v_new_filled),
    'status', CASE WHEN v_new_filled >= v_total_qty THEN 'filled' ELSE 'partially_filled' END
  );
END;
$$;

REVOKE ALL ON FUNCTION _fill_house_order(UUID) FROM PUBLIC, anon, authenticated;

-- ─── Stop cron (trailing stop peak update + trigger) ─────────────────────────

CREATE OR REPLACE FUNCTION rpc_run_stop_orders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_symbol   TEXT;
  v_mark     NUMERIC;
  v_pos      futures_positions%ROWTYPE;
  v_closed   INT := 0;
  v_skipped  INT := 0;
  v_errors   INT := 0;
  v_detail   JSONB := '[]'::JSONB;
  v_err_msg  TEXT;
  v_extreme  TEXT;
  v_trigger  BOOLEAN;
BEGIN
  IF auth.role() = 'anon' OR (auth.role() = 'authenticated' AND NOT _is_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_symbol IN
    SELECT fm.symbol
    FROM futures_markets fm
    JOIN market_circuit_breakers mcb ON mcb.symbol = fm.symbol
    WHERE fm.is_active AND NOT mcb.is_halted
  LOOP
    BEGIN
      v_mark := _assert_price_fresh(v_symbol);
    EXCEPTION WHEN OTHERS THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END;

    FOR v_pos IN
      SELECT *
      FROM futures_positions
      WHERE market = v_symbol
        AND status = 'open'
        AND (
          stop_loss IS NOT NULL
          OR take_profit IS NOT NULL
          OR trailing_stop_callback_rate IS NOT NULL
        )
      FOR UPDATE SKIP LOCKED
    LOOP
      v_trigger := FALSE;

      IF v_pos.trailing_stop_callback_rate IS NOT NULL THEN
        IF NOT _trailing_stop_activation_met(
          v_pos.side, v_mark, v_pos.trailing_stop_activation_price
        ) THEN
          v_skipped := v_skipped + 1;
          CONTINUE;
        END IF;

        v_extreme := v_pos.trailing_stop_extreme_price;
        IF v_pos.side = 'long' THEN
          IF v_extreme IS NULL OR v_mark > v_extreme::NUMERIC THEN
            v_extreme := _fmt6(v_mark);
            UPDATE futures_positions
            SET trailing_stop_extreme_price = v_extreme, updated_at = NOW()
            WHERE id = v_pos.id;
          END IF;
        ELSIF v_pos.side = 'short' THEN
          IF v_extreme IS NULL OR v_mark < v_extreme::NUMERIC THEN
            v_extreme := _fmt6(v_mark);
            UPDATE futures_positions
            SET trailing_stop_extreme_price = v_extreme, updated_at = NOW()
            WHERE id = v_pos.id;
          END IF;
        END IF;

        IF _trailing_stop_triggered(
          v_pos.side, v_mark, v_extreme, v_pos.trailing_stop_callback_rate
        ) THEN
          v_trigger := TRUE;
        END IF;
      END IF;

      IF NOT v_trigger AND _position_stop_triggered(
        v_pos.side, v_mark, v_pos.stop_loss, v_pos.take_profit
      ) THEN
        v_trigger := TRUE;
      END IF;

      IF NOT v_trigger THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

      BEGIN
        PERFORM _settle_futures_position(v_pos.id, v_mark, 'closed', 'stop_trigger');
        v_closed := v_closed + 1;
        v_detail := v_detail || jsonb_build_object(
          'position_id', v_pos.id,
          'user_id', v_pos.user_id,
          'market', v_symbol,
          'side', v_pos.side,
          'mark', _fmt6(v_mark),
          'trailing', v_pos.trailing_stop_callback_rate IS NOT NULL
        );
      EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT;
        v_errors := v_errors + 1;
        v_detail := v_detail || jsonb_build_object(
          'position_id', v_pos.id,
          'error', v_err_msg
        );
      END;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'closed', v_closed,
    'skipped', v_skipped,
    'errors', v_errors,
    'detail', v_detail,
    'ran_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_stop_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_stop_orders() TO service_role;

-- ─── Open order fill worker (TIF expiry) ─────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_run_open_order_fills()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order     trading_open_orders%ROWTYPE;
  v_mark      NUMERIC;
  v_filled    INT := 0;
  v_triggered INT := 0;
  v_skipped   INT := 0;
  v_errors    INT := 0;
  v_cancelled INT := 0;
  v_detail    JSONB := '[]'::JSONB;
  v_err_msg   TEXT;
  v_res       JSONB;
  v_fillable  BOOLEAN;
BEGIN
  IF auth.role() = 'anon' OR (auth.role() = 'authenticated' AND NOT _is_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_order IN
    SELECT *
    FROM trading_open_orders
    WHERE status IN ('pending', 'open', 'triggered', 'partially_filled')
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM futures_markets fm
      JOIN market_circuit_breakers mcb ON mcb.symbol = fm.symbol
      WHERE fm.symbol = v_order.market AND fm.is_active AND NOT mcb.is_halted
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      v_mark := _assert_price_fresh(v_order.market);
    EXCEPTION WHEN OTHERS THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END;

    v_fillable := FALSE;

    IF v_order.status = 'pending' AND v_order.order_type IN ('stop_market', 'stop_limit') THEN
      IF NOT _order_stop_entry_triggered(v_order.side, v_mark, v_order.stop_price) THEN
        v_fillable := FALSE;
      ELSIF v_order.order_type = 'stop_limit' THEN
        UPDATE trading_open_orders
        SET status = 'open', updated_at = NOW()
        WHERE id = v_order.id;
        v_order.status := 'open';
        v_triggered := v_triggered + 1;
        v_fillable := _order_limit_crossed(v_order.side, v_mark, v_order.price);
      ELSE
        UPDATE trading_open_orders
        SET status = 'triggered', updated_at = NOW()
        WHERE id = v_order.id;
        v_order.status := 'triggered';
        v_triggered := v_triggered + 1;
        v_fillable := TRUE;
      END IF;
    ELSIF v_order.order_type = 'limit' AND v_order.status IN ('open', 'partially_filled') THEN
      v_fillable := _order_limit_crossed(v_order.side, v_mark, v_order.price);
    ELSIF v_order.order_type = 'stop_market' AND v_order.status = 'triggered' THEN
      v_fillable := TRUE;
    ELSIF v_order.order_type = 'stop_limit' AND v_order.status IN ('open', 'triggered') THEN
      v_fillable := _order_limit_crossed(v_order.side, v_mark, v_order.price);
    END IF;

    IF v_order.time_in_force IN ('ioc', 'fok') AND NOT v_order.tif_checked THEN
      UPDATE trading_open_orders SET tif_checked = TRUE WHERE id = v_order.id;
      v_order.tif_checked := TRUE;
      IF NOT v_fillable THEN
        BEGIN
          PERFORM _cancel_open_order_internal(v_order.id);
          v_cancelled := v_cancelled + 1;
          v_detail := v_detail || jsonb_build_object(
            'order_id', v_order.id,
            'cancelled', 'tif_expired',
            'time_in_force', v_order.time_in_force
          );
        EXCEPTION WHEN OTHERS THEN
          GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT;
          v_errors := v_errors + 1;
        END;
        CONTINUE;
      END IF;
    END IF;

    IF NOT v_fillable THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      v_res := _fill_house_order(v_order.id);
      v_filled := v_filled + 1;
      v_detail := v_detail || jsonb_build_object(
        'order_id', v_order.id,
        'position_id', v_res->>'position_id',
        'market', v_order.market,
        'status', v_res->>'status'
      );
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT;
      IF v_err_msg LIKE '%not_crossed%' OR v_err_msg LIKE '%not_triggered%' OR v_err_msg LIKE '%not_fillable%' THEN
        v_skipped := v_skipped + 1;
      ELSE
        v_errors := v_errors + 1;
        v_detail := v_detail || jsonb_build_object('order_id', v_order.id, 'error', v_err_msg);
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'filled', v_filled,
    'triggered', v_triggered,
    'cancelled', v_cancelled,
    'skipped', v_skipped,
    'errors', v_errors,
    'detail', v_detail,
    'ran_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_open_order_fills() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_open_order_fills() TO service_role;
