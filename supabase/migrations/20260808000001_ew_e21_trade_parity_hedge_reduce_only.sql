-- ============================================================
-- Migration: ew_e21_trade_parity_hedge_reduce_only
-- E21 Trade parity — hedge position mode + reduce-only (신규만)
-- EXISTS (migration 0): TP/SL amend · spot limit/stop · trailing
-- Plan: ew-e21-trade-parity-wave · ADR-015
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Enum ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE position_mode AS ENUM ('one_way', 'hedge');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Schema ──────────────────────────────────────────────────────────────────

ALTER TABLE margin_accounts
  ADD COLUMN IF NOT EXISTS position_mode position_mode NOT NULL DEFAULT 'one_way';

ALTER TABLE trading_open_orders
  ADD COLUMN IF NOT EXISTS reduce_only BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN margin_accounts.position_mode IS
  'E21 — one_way (default) or hedge dual-side; switch blocked while open.';
COMMENT ON COLUMN trading_open_orders.reduce_only IS
  'E21 — fill must reduce opposite position; never open new exposure.';

-- ─── Rate limits ─────────────────────────────────────────────────────────────

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_set_position_mode', 10, 0.167, 1, 60),
  ('rpc_get_position_mode', 60, 1, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _user_position_mode(p_user_id UUID)
RETURNS position_mode
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mode position_mode;
BEGIN
  SELECT position_mode INTO v_mode
  FROM margin_accounts
  WHERE user_id = p_user_id;
  RETURN COALESCE(v_mode, 'one_way'::position_mode);
END;
$$;

REVOKE ALL ON FUNCTION _user_position_mode(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_futures_open_allowed(
  p_user_id     UUID,
  p_market      TEXT,
  p_side        position_side,
  p_reduce_only BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mode     position_mode;
  v_opp      position_side;
  v_has_any  BOOLEAN;
  v_has_same BOOLEAN;
  v_has_opp  BOOLEAN;
BEGIN
  v_opp := CASE WHEN p_side = 'long' THEN 'short'::position_side ELSE 'long'::position_side END;

  SELECT EXISTS (
    SELECT 1 FROM futures_positions
    WHERE user_id = p_user_id AND market = p_market AND status = 'open'
  ) INTO v_has_any;

  SELECT EXISTS (
    SELECT 1 FROM futures_positions
    WHERE user_id = p_user_id AND market = p_market AND status = 'open' AND side = p_side
  ) INTO v_has_same;

  SELECT EXISTS (
    SELECT 1 FROM futures_positions
    WHERE user_id = p_user_id AND market = p_market AND status = 'open' AND side = v_opp
  ) INTO v_has_opp;

  IF p_reduce_only THEN
    IF NOT v_has_opp THEN
      RAISE EXCEPTION 'reduce_only_no_position';
    END IF;
    RETURN;
  END IF;

  v_mode := _user_position_mode(p_user_id);

  IF v_mode = 'one_way' THEN
    IF v_has_opp THEN
      RAISE EXCEPTION 'position_mode_one_way_opposite';
    END IF;
  ELSIF v_mode = 'hedge' THEN
    IF v_has_same THEN
      RAISE EXCEPTION 'position_mode_hedge_side_exists';
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_futures_open_allowed(UUID, TEXT, position_side, BOOLEAN)
  FROM PUBLIC, anon, authenticated;

-- ─── Client RPCs: position mode ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_set_position_mode(p_mode TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_mode    position_mode;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_set_position_mode');
  PERFORM _assert_feature_enabled('futures');

  IF p_mode NOT IN ('one_way', 'hedge') THEN
    RAISE EXCEPTION 'invalid_position_mode';
  END IF;
  v_mode := p_mode::position_mode;

  IF EXISTS (
    SELECT 1 FROM futures_positions
    WHERE user_id = v_user_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'open_positions_block';
  END IF;

  IF EXISTS (
    SELECT 1 FROM trading_open_orders
    WHERE user_id = v_user_id AND status IN ('pending', 'open', 'triggered', 'partially_filled')
  ) THEN
    RAISE EXCEPTION 'open_orders_block';
  END IF;

  INSERT INTO margin_accounts (user_id, margin_mode, position_mode, updated_at)
  VALUES (v_user_id, 'isolated', v_mode, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET position_mode = EXCLUDED.position_mode, updated_at = NOW();

  RETURN jsonb_build_object('user_id', v_user_id, 'position_mode', v_mode);
END;
$$;

REVOKE ALL ON FUNCTION rpc_set_position_mode(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_set_position_mode(TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_get_position_mode()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_get_position_mode');

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'position_mode', _user_position_mode(v_user_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_position_mode() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_position_mode() TO authenticated, service_role;

-- ─── Place path: reduce_only + mode assert ───────────────────────────────────

DROP FUNCTION IF EXISTS _place_open_order_common(
  TEXT, TEXT, TEXT, TEXT, TEXT, order_type, order_status, TEXT, TEXT, TEXT, TEXT, TEXT
);

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
  p_display_quantity  TEXT DEFAULT NULL,
  p_reduce_only       BOOLEAN DEFAULT FALSE
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

  PERFORM _assert_futures_open_allowed(v_user_id, p_market, v_side, COALESCE(p_reduce_only, FALSE));

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
    client_request_id, time_in_force, display_quantity, reduce_only
  ) VALUES (
    v_order_id, v_user_id, p_market, v_side, p_order_type, p_initial_status,
    v_ccy, p_price, p_stop_price, _fmt6(v_qty), p_leverage, _fmt6(v_margin),
    p_client_request_id, v_tif, p_display_quantity, COALESCE(p_reduce_only, FALSE)
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'market', p_market,
    'side', p_side,
    'order_type', p_order_type,
    'time_in_force', v_tif,
    'display_quantity', p_display_quantity,
    'reduce_only', COALESCE(p_reduce_only, FALSE)
  );
END;
$$;

REVOKE ALL ON FUNCTION _place_open_order_common(
  TEXT, TEXT, TEXT, TEXT, TEXT, order_type, order_status, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS rpc_place_limit_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION rpc_place_limit_order(
  p_market            TEXT,
  p_side              TEXT,
  p_margin_currency   TEXT,
  p_margin_amount     TEXT,
  p_leverage          TEXT,
  p_limit_price       TEXT,
  p_client_request_id TEXT,
  p_time_in_force     TEXT DEFAULT 'gtc',
  p_display_quantity  TEXT DEFAULT NULL,
  p_reduce_only       BOOLEAN DEFAULT FALSE
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
    p_limit_price, NULL, p_client_request_id, p_time_in_force, p_display_quantity,
    COALESCE(p_reduce_only, FALSE)
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_limit_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_limit_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN)
  TO authenticated, service_role;

DROP FUNCTION IF EXISTS rpc_place_stop_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION rpc_place_stop_order(
  p_market            TEXT,
  p_side              TEXT,
  p_margin_currency   TEXT,
  p_margin_amount     TEXT,
  p_leverage          TEXT,
  p_stop_price        TEXT,
  p_order_type        TEXT,
  p_limit_price       TEXT DEFAULT NULL,
  p_client_request_id TEXT DEFAULT NULL,
  p_reduce_only       BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type order_type;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(auth.uid(), 'rpc_place_stop_order');

  IF p_order_type = 'stop_market' THEN
    v_type := 'stop_market';
  ELSIF p_order_type = 'stop_limit' THEN
    v_type := 'stop_limit';
  ELSE
    RAISE EXCEPTION 'invalid_order_type';
  END IF;

  RETURN _place_open_order_common(
    p_market, p_side, p_margin_currency, p_margin_amount, p_leverage,
    v_type, 'pending'::order_status,
    p_limit_price, p_stop_price, p_client_request_id, 'gtc', NULL,
    COALESCE(p_reduce_only, FALSE)
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_stop_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_stop_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN)
  TO authenticated, service_role;

-- ─── Inject mode assert into market open RPC ─────────────────────────────────

DO $$
DECLARE
  v_def TEXT;
  v_new TEXT;
BEGIN
  v_def := pg_get_functiondef(
    'public.rpc_open_futures_position(text,text,text,text,text,text,text,text)'::regprocedure
  );

  IF position('_assert_futures_open_allowed' IN v_def) = 0 THEN
    v_new := regexp_replace(
      v_def,
      'v_side := p_side::position_side;',
      'v_side := p_side::position_side;'
        || E'\n  PERFORM _assert_futures_open_allowed(v_user_id, p_market, v_side, FALSE);',
      1
    );
    IF v_new = v_def THEN
      RAISE EXCEPTION 'E21: rpc_open_futures_position inject anchor not found';
    END IF;
    EXECUTE v_new;
  END IF;
END
$$;

REVOKE ALL ON FUNCTION rpc_open_futures_position(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_open_futures_position(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

-- ─── Fill path: reduce_only closes opposite ──────────────────────────────────

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
  v_opp_side       position_side;
  v_pos            futures_positions%ROWTYPE;
  v_pos_qty        NUMERIC;
  v_close_ratio    NUMERIC;
  v_settle         JSONB;
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

  -- ─── E21 reduce-only: close opposite, never open ───────────────────────────
  IF v_order.reduce_only THEN
    v_opp_side := CASE
      WHEN v_order.side = 'long' THEN 'short'::position_side
      ELSE 'long'::position_side
    END;

    SELECT * INTO v_pos
    FROM futures_positions
    WHERE user_id = v_order.user_id
      AND market = v_order.market
      AND side = v_opp_side
      AND status = 'open'
    ORDER BY opened_at NULLS LAST, id
    FOR UPDATE
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'reduce_only_no_position';
    END IF;

    PERFORM _unlock_wallet_internal(
      v_order.user_id, v_order.margin_currency, _fmt6(v_slice_margin),
      'order_margin_unlock', 'ord_unlock_ro:' || v_order.id::TEXT || ':' || v_tid::TEXT
    );

    v_pos_qty := v_pos.quantity::NUMERIC;
    IF v_slice_qty >= v_pos_qty THEN
      v_settle := _settle_futures_position(v_pos.id, v_fill_px, 'closed', 'reduce_only');
      v_pos_id := v_pos.id;
    ELSE
      v_close_ratio := trunc(v_slice_qty / v_pos_qty, 6);
      IF v_close_ratio <= 0 OR v_close_ratio >= 1 THEN
        RAISE EXCEPTION 'invalid_close_ratio';
      END IF;
      v_settle := _partial_settle_futures_position(v_pos.id, v_fill_px, v_close_ratio);
      v_pos_id := v_pos.id;
    END IF;

    INSERT INTO trading_order_fills (order_id, fill_price, fill_quantity, fee)
    VALUES (v_order.id, _fmt6(v_fill_px), _fmt6(v_slice_qty), '0.000000');

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
      'open_fee', '0.000000',
      'reduce_only', TRUE,
      'settle', v_settle,
      'filled_quantity', _fmt6(v_new_filled),
      'status', CASE WHEN v_new_filled >= v_total_qty THEN 'filled' ELSE 'partially_filled' END
    );
  END IF;

  -- ─── Standard open fill ────────────────────────────────────────────────────
  v_open_fee := v_notional * v_mkt.open_fee_rate::NUMERIC;
  v_slice_fee := v_open_fee * v_slice_ratio;
  v_inv_lev := 1 / v_lev;

  PERFORM _assert_position_limits(v_order.user_id, v_order.market, v_slice_notional);
  PERFORM _assert_futures_open_allowed(v_order.user_id, v_order.market, v_order.side, FALSE);

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
