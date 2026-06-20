-- ============================================================
-- Migration: 20260620000133_trade_e2_open_orders
-- Trade Wave E2: trading_open_orders · limit/stop place/cancel/fill
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_type') THEN
    CREATE TYPE order_type AS ENUM ('market', 'limit', 'stop_market', 'stop_limit');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending', 'open', 'partially_filled', 'filled', 'cancelled', 'triggered'
    );
  END IF;
END $$;

-- ─── Schema ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trading_open_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  market              TEXT NOT NULL REFERENCES futures_markets(symbol) ON DELETE RESTRICT,
  side                position_side NOT NULL,
  order_type          order_type NOT NULL,
  status              order_status NOT NULL DEFAULT 'open',
  margin_currency     currency NOT NULL,
  price               TEXT
    CONSTRAINT too_price_fmt CHECK (price IS NULL OR price ~ '^-?\d+(\.\d+)?$'),
  stop_price          TEXT
    CONSTRAINT too_stop_fmt CHECK (stop_price IS NULL OR stop_price ~ '^-?\d+(\.\d+)?$'),
  quantity            TEXT NOT NULL
    CONSTRAINT too_qty_fmt CHECK (quantity ~ '^\d+(\.\d+)?$'),
  filled_quantity     TEXT NOT NULL DEFAULT '0'
    CONSTRAINT too_filled_fmt CHECK (filled_quantity ~ '^\d+(\.\d+)?$'),
  leverage            TEXT NOT NULL
    CONSTRAINT too_lev_fmt CHECK (leverage ~ '^\d+(\.\d+)?$'),
  margin_amount       TEXT NOT NULL
    CONSTRAINT too_margin_fmt CHECK (margin_amount ~ '^\d+(\.\d+)?$'),
  margin_mode         margin_mode NOT NULL DEFAULT 'isolated',
  client_request_id   TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_request_id)
);

CREATE TABLE IF NOT EXISTS trading_order_fills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES trading_open_orders(id) ON DELETE RESTRICT,
  fill_price      TEXT NOT NULL
    CONSTRAINT tof_price_fmt CHECK (fill_price ~ '^\d+(\.\d+)?$'),
  fill_quantity   TEXT NOT NULL
    CONSTRAINT tof_qty_fmt CHECK (fill_quantity ~ '^\d+(\.\d+)?$'),
  fee             TEXT NOT NULL
    CONSTRAINT tof_fee_fmt CHECK (fee ~ '^\d+(\.\d+)?$'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trading_open_orders_user_status_idx
  ON trading_open_orders (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS trading_open_orders_market_status_idx
  ON trading_open_orders (market, status)
  WHERE status IN ('pending', 'open', 'triggered');
CREATE INDEX IF NOT EXISTS trading_order_fills_order_idx
  ON trading_order_fills (order_id, created_at DESC);

ALTER TABLE trading_open_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_order_fills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user read own trading_open_orders" ON trading_open_orders;
CREATE POLICY "user read own trading_open_orders" ON trading_open_orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user read own trading_order_fills" ON trading_order_fills;
CREATE POLICY "user read own trading_order_fills" ON trading_order_fills
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trading_open_orders o
      WHERE o.id = trading_order_fills.order_id AND o.user_id = auth.uid()
    )
  );

REVOKE ALL ON trading_open_orders FROM PUBLIC, anon, authenticated;
GRANT SELECT ON trading_open_orders TO authenticated;

REVOKE ALL ON trading_order_fills FROM PUBLIC, anon, authenticated;
GRANT SELECT ON trading_order_fills TO authenticated;

-- ─── Rate limits ─────────────────────────────────────────────────────────────

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_place_limit_order', 10, 0.167, 1, 60),
  ('rpc_place_stop_order',  10, 0.167, 1, 60),
  ('rpc_cancel_order',      20, 0.333, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _order_stop_entry_triggered(
  p_side position_side,
  p_mark NUMERIC,
  p_stop_price TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_stop_price IS NULL THEN FALSE
    WHEN p_side = 'long'  THEN p_mark >= p_stop_price::NUMERIC
    WHEN p_side = 'short' THEN p_mark <= p_stop_price::NUMERIC
    ELSE FALSE
  END;
$$;

REVOKE ALL ON FUNCTION _order_stop_entry_triggered(position_side, NUMERIC, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _order_limit_crossed(
  p_side position_side,
  p_mark NUMERIC,
  p_limit_price TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_limit_price IS NULL THEN FALSE
    WHEN p_side = 'long'  THEN p_mark <= p_limit_price::NUMERIC
    WHEN p_side = 'short' THEN p_mark >= p_limit_price::NUMERIC
    ELSE FALSE
  END;
$$;

REVOKE ALL ON FUNCTION _order_limit_crossed(position_side, NUMERIC, TEXT)
  FROM PUBLIC, anon, authenticated;

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
  p_client_request_id TEXT
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
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('futures');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_margin_amount);
  PERFORM _assert_amount_text(p_leverage);

  IF p_client_request_id IS NULL OR btrim(p_client_request_id) = '' THEN
    RAISE EXCEPTION 'client_request_id_required';
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

  PERFORM _lock_wallet_internal(
    v_user_id, v_ccy, _fmt6(v_margin),
    'order_margin_lock', 'ord_margin:' || v_order_id::TEXT
  );

  INSERT INTO trading_open_orders (
    id, user_id, market, side, order_type, status,
    margin_currency, price, stop_price, quantity, leverage, margin_amount,
    client_request_id
  ) VALUES (
    v_order_id, v_user_id, p_market, v_side, p_order_type, p_initial_status,
    v_ccy, p_price, p_stop_price, _fmt6(v_qty), p_leverage, _fmt6(v_margin),
    p_client_request_id
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'market', p_market,
    'side', p_side,
    'order_type', p_order_type,
    'status', p_initial_status,
    'quantity', _fmt6(v_qty),
    'margin_amount', _fmt6(v_margin),
    'price', p_price,
    'stop_price', p_stop_price
  );
END;
$$;

REVOKE ALL ON FUNCTION _place_open_order_common(
  TEXT, TEXT, TEXT, TEXT, TEXT, order_type, order_status, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

-- ─── Fill internal (house counterparty) ──────────────────────────────────────

CREATE OR REPLACE FUNCTION _fill_house_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order      trading_open_orders%ROWTYPE;
  v_mkt        futures_markets%ROWTYPE;
  v_mark       NUMERIC;
  v_fill_px    NUMERIC;
  v_margin     NUMERIC;
  v_lev        NUMERIC;
  v_mmr        NUMERIC;
  v_notional   NUMERIC;
  v_qty        NUMERIC;
  v_open_fee   NUMERIC;
  v_inv_lev    NUMERIC;
  v_liq        NUMERIC;
  v_pos_id     UUID := gen_random_uuid();
  v_tid        UUID := gen_random_uuid();
BEGIN
  SELECT * INTO v_order
  FROM trading_open_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.status NOT IN ('open', 'triggered') THEN
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
  v_qty := v_notional / v_fill_px;
  v_open_fee := v_notional * v_mkt.open_fee_rate::NUMERIC;
  v_inv_lev := 1 / v_lev;

  PERFORM _assert_position_limits(v_order.user_id, v_order.market, v_notional);

  IF v_order.side = 'long' THEN
    v_liq := v_fill_px * (1 - v_inv_lev + v_mmr);
  ELSE
    v_liq := v_fill_px * (1 + v_inv_lev - v_mmr);
  END IF;
  IF v_liq < 0 THEN v_liq := 0; END IF;

  PERFORM _unlock_wallet_internal(
    v_order.user_id, v_order.margin_currency, _fmt6(v_margin),
    'order_margin_unlock', 'ord_unlock:' || v_order.id::TEXT
  );
  PERFORM _lock_wallet_internal(
    v_order.user_id, v_order.margin_currency, _fmt6(v_margin),
    'futures_margin_lock', 'fut_margin:' || v_pos_id::TEXT
  );

  IF trunc(v_open_fee, 6) > 0 THEN
    PERFORM _debit_wallet_internal(
      v_order.user_id, v_order.margin_currency, _fmt6(v_open_fee),
      'futures_open_fee', 'fut_openfee:' || v_pos_id::TEXT
    );
    PERFORM _credit_system_account(
      'house_fee_' || lower(v_order.margin_currency::TEXT), _fmt6(v_open_fee),
      'futures_open_fee', v_order.user_id, v_pos_id::TEXT, v_tid
    );
  END IF;

  INSERT INTO futures_positions (
    id, user_id, market, side, margin_currency, margin_amount, leverage,
    entry_price, quantity, notional, open_fee, liquidation_price, margin_mode
  ) VALUES (
    v_pos_id, v_order.user_id, v_order.market, v_order.side, v_order.margin_currency,
    _fmt6(v_margin), v_order.leverage, _fmt6(v_fill_px), _fmt6(v_qty), _fmt6(v_notional),
    _fmt6(v_open_fee), _fmt6(v_liq), v_order.margin_mode
  );

  INSERT INTO position_ledger (position_id, user_id, event, price, fee, payload)
  VALUES (
    v_pos_id, v_order.user_id, 'open', _fmt6(v_fill_px), _fmt6(v_open_fee),
    jsonb_build_object(
      'side', v_order.side,
      'leverage', v_lev,
      'notional', _fmt6(v_notional),
      'source_order_id', v_order.id
    )
  );

  INSERT INTO trading_order_fills (order_id, fill_price, fill_quantity, fee)
  VALUES (v_order.id, _fmt6(v_fill_px), _fmt6(v_qty), _fmt6(v_open_fee));

  UPDATE trading_open_orders
  SET status = 'filled',
      filled_quantity = _fmt6(v_qty),
      updated_at = NOW()
  WHERE id = v_order.id;

  RETURN jsonb_build_object(
    'order_id', v_order.id,
    'position_id', v_pos_id,
    'fill_price', _fmt6(v_fill_px),
    'quantity', _fmt6(v_qty),
    'open_fee', _fmt6(v_open_fee)
  );
END;
$$;

REVOKE ALL ON FUNCTION _fill_house_order(UUID) FROM PUBLIC, anon, authenticated;

-- ─── Client RPCs ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_place_limit_order(
  p_market            TEXT,
  p_side              TEXT,
  p_margin_currency   TEXT,
  p_margin_amount     TEXT,
  p_leverage          TEXT,
  p_limit_price       TEXT,
  p_client_request_id TEXT
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
    p_limit_price, NULL, p_client_request_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_place_stop_order(
  p_market            TEXT,
  p_side              TEXT,
  p_margin_currency   TEXT,
  p_margin_amount     TEXT,
  p_leverage          TEXT,
  p_stop_price        TEXT,
  p_order_type        TEXT,
  p_limit_price       TEXT DEFAULT NULL,
  p_client_request_id TEXT DEFAULT NULL
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
    p_limit_price, p_stop_price, p_client_request_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_cancel_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order   trading_open_orders%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_cancel_order');
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('futures');

  SELECT * INTO v_order
  FROM trading_open_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_order.status NOT IN ('pending', 'open', 'triggered') THEN
    RAISE EXCEPTION 'order_not_cancellable';
  END IF;

  PERFORM _unlock_wallet_internal(
    v_user_id, v_order.margin_currency, v_order.margin_amount,
    'order_margin_unlock', 'ord_cancel:' || v_order.id::TEXT
  );

  UPDATE trading_open_orders
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('order_id', p_order_id, 'status', 'cancelled');
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_limit_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_limit_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_place_stop_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_stop_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_cancel_order(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_cancel_order(UUID) TO authenticated, service_role;

-- ─── Fill worker (service/cron only) ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_run_open_order_fills()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order    trading_open_orders%ROWTYPE;
  v_mark     NUMERIC;
  v_filled   INT := 0;
  v_triggered INT := 0;
  v_skipped  INT := 0;
  v_errors   INT := 0;
  v_detail   JSONB := '[]'::JSONB;
  v_err_msg  TEXT;
  v_res      JSONB;
BEGIN
  IF auth.role() = 'anon' OR (auth.role() = 'authenticated' AND NOT _is_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_order IN
    SELECT *
    FROM trading_open_orders
    WHERE status IN ('pending', 'open', 'triggered')
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

    IF v_order.status = 'pending' AND v_order.order_type IN ('stop_market', 'stop_limit') THEN
      IF NOT _order_stop_entry_triggered(v_order.side, v_mark, v_order.stop_price) THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

      IF v_order.order_type = 'stop_limit' THEN
        UPDATE trading_open_orders
        SET status = 'open', updated_at = NOW()
        WHERE id = v_order.id;
        v_order.status := 'open';
        v_triggered := v_triggered + 1;
        IF NOT _order_limit_crossed(v_order.side, v_mark, v_order.price) THEN
          CONTINUE;
        END IF;
      ELSE
        UPDATE trading_open_orders
        SET status = 'triggered', updated_at = NOW()
        WHERE id = v_order.id;
        v_order.status := 'triggered';
        v_triggered := v_triggered + 1;
      END IF;
    ELSIF v_order.order_type = 'limit' AND v_order.status = 'open' THEN
      IF NOT _order_limit_crossed(v_order.side, v_mark, v_order.price) THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
    END IF;

    BEGIN
      v_res := _fill_house_order(v_order.id);
      v_filled := v_filled + 1;
      v_detail := v_detail || jsonb_build_object(
        'order_id', v_order.id,
        'position_id', v_res->>'position_id',
        'market', v_order.market
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
    'skipped', v_skipped,
    'errors', v_errors,
    'detail', v_detail,
    'ran_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_open_order_fills() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_open_order_fills() TO service_role;

CREATE OR REPLACE FUNCTION _run_open_order_fills_logged()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_res JSONB;
  v_filled INT;
  v_err INT;
BEGIN
  v_res := rpc_run_open_order_fills();
  v_filled := COALESCE((v_res->>'filled')::INT, 0);
  v_err := COALESCE((v_res->>'errors')::INT, 0);
  IF v_filled > 0 OR v_err > 0 THEN
    INSERT INTO liquidation_run_log (liquidated, skipped, errors, duration_ms, detail)
    VALUES (
      v_filled,
      COALESCE((v_res->>'skipped')::INT, 0),
      v_err,
      0,
      COALESCE(v_res->'detail', '[]'::JSONB)
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _run_open_order_fills_logged() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'trade-open-order-fills',
  '* * * * *',
  $$SELECT _run_open_order_fills_logged();$$
);
