-- ============================================================
-- Migration: 20260721000006_trade_t1_spot_open_orders
-- Trade Wave T1: spot_open_orders · limit/stop place/cancel/fill
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Schema ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spot_open_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  market              TEXT NOT NULL REFERENCES spot_markets(symbol) ON DELETE RESTRICT,
  side                TEXT NOT NULL
    CONSTRAINT soo_side_chk CHECK (side IN ('buy', 'sell')),
  order_type          order_type NOT NULL,
  status              order_status NOT NULL DEFAULT 'open',
  stake_currency      currency NOT NULL,
  stake_amount        TEXT NOT NULL
    CONSTRAINT soo_stake_fmt CHECK (stake_amount ~ '^\d+(\.\d+)?$'),
  price               TEXT
    CONSTRAINT soo_price_fmt CHECK (price IS NULL OR price ~ '^\d+(\.\d+)?$'),
  stop_price          TEXT
    CONSTRAINT soo_stop_fmt CHECK (stop_price IS NULL OR stop_price ~ '^\d+(\.\d+)?$'),
  quantity            TEXT NOT NULL
    CONSTRAINT soo_qty_fmt CHECK (quantity ~ '^\d+(\.\d+)?$'),
  filled_quantity     TEXT NOT NULL DEFAULT '0'
    CONSTRAINT soo_filled_fmt CHECK (filled_quantity ~ '^\d+(\.\d+)?$'),
  base_asset          TEXT NOT NULL,
  client_request_id   TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_request_id)
);

CREATE TABLE IF NOT EXISTS spot_order_fills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES spot_open_orders(id) ON DELETE RESTRICT,
  fill_price      TEXT NOT NULL
    CONSTRAINT sof_price_fmt CHECK (fill_price ~ '^\d+(\.\d+)?$'),
  fill_quantity   TEXT NOT NULL
    CONSTRAINT sof_qty_fmt CHECK (fill_quantity ~ '^\d+(\.\d+)?$'),
  fee             TEXT NOT NULL
    CONSTRAINT sof_fee_fmt CHECK (fee ~ '^\d+(\.\d+)?$'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS spot_open_orders_user_status_idx
  ON spot_open_orders (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS spot_open_orders_market_status_idx
  ON spot_open_orders (market, status)
  WHERE status IN ('pending', 'open', 'triggered');
CREATE INDEX IF NOT EXISTS spot_order_fills_order_idx
  ON spot_order_fills (order_id, created_at DESC);

ALTER TABLE spot_open_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_order_fills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user read own spot_open_orders" ON spot_open_orders;
CREATE POLICY "user read own spot_open_orders" ON spot_open_orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user read own spot_order_fills" ON spot_order_fills;
CREATE POLICY "user read own spot_order_fills" ON spot_order_fills
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spot_open_orders o
      WHERE o.id = spot_order_fills.order_id AND o.user_id = auth.uid()
    )
  );

REVOKE ALL ON spot_open_orders FROM PUBLIC, anon, authenticated;
GRANT SELECT ON spot_open_orders TO authenticated;

REVOKE ALL ON spot_order_fills FROM PUBLIC, anon, authenticated;
GRANT SELECT ON spot_order_fills TO authenticated;

-- ─── Rate limits ─────────────────────────────────────────────────────────────

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_place_spot_limit_order', 10, 0.167, 1, 60),
  ('rpc_place_spot_stop_order',  10, 0.167, 1, 60),
  ('rpc_cancel_spot_order',      20, 0.333, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- ─── Spot order trigger helpers (buy/sell · mirrors futures long/short) ─────

CREATE OR REPLACE FUNCTION _spot_order_stop_entry_triggered(
  p_side TEXT,
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
    WHEN p_side = 'buy'  THEN p_mark >= p_stop_price::NUMERIC
    WHEN p_side = 'sell' THEN p_mark <= p_stop_price::NUMERIC
    ELSE FALSE
  END;
$$;

REVOKE ALL ON FUNCTION _spot_order_stop_entry_triggered(TEXT, NUMERIC, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _spot_order_limit_crossed(
  p_side TEXT,
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
    WHEN p_side = 'buy'  THEN p_mark <= p_limit_price::NUMERIC
    WHEN p_side = 'sell' THEN p_mark >= p_limit_price::NUMERIC
    ELSE FALSE
  END;
$$;

REVOKE ALL ON FUNCTION _spot_order_limit_crossed(TEXT, NUMERIC, TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── Lock / unlock spot sell base (wallet PHON or spot_holdings majors) ─────

CREATE OR REPLACE FUNCTION _lock_spot_sell_base(
  p_user_id UUID,
  p_market  TEXT,
  p_base    TEXT,
  p_qty     NUMERIC,
  p_order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hold NUMERIC;
BEGIN
  IF p_base = 'PHON' THEN
    PERFORM _lock_wallet_internal(
      p_user_id, 'PHON'::currency, _fmt6(p_qty),
      'spot_order_lock', 'spot_lock:' || p_order_id::TEXT
    );
    RETURN;
  END IF;

  SELECT quantity::NUMERIC INTO v_hold
  FROM spot_holdings
  WHERE user_id = p_user_id AND base_asset = p_base
  FOR UPDATE;

  IF v_hold IS NULL OR v_hold < p_qty THEN
    RAISE EXCEPTION 'insufficient_balance' USING HINT = p_base;
  END IF;

  PERFORM _upsert_spot_holding(p_user_id, p_base, -p_qty);
END;
$$;

REVOKE ALL ON FUNCTION _lock_spot_sell_base(UUID, TEXT, TEXT, NUMERIC, UUID)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _unlock_spot_sell_base(
  p_user_id UUID,
  p_base    TEXT,
  p_qty     NUMERIC,
  p_order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_base = 'PHON' THEN
    PERFORM _unlock_wallet_internal(
      p_user_id, 'PHON'::currency, _fmt6(p_qty),
      'spot_order_unlock', 'spot_unlock:' || p_order_id::TEXT
    );
    RETURN;
  END IF;

  PERFORM _upsert_spot_holding(p_user_id, p_base, p_qty);
END;
$$;

REVOKE ALL ON FUNCTION _unlock_spot_sell_base(UUID, TEXT, NUMERIC, UUID)
  FROM PUBLIC, anon, authenticated;

-- ─── Place common ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _place_spot_open_order_common(
  p_market            TEXT,
  p_side              TEXT,
  p_stake_currency    TEXT,
  p_amount            TEXT,
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
  v_mkt      spot_markets%ROWTYPE;
  v_ccy      currency;
  v_side     TEXT;
  v_amt      NUMERIC;
  v_ref_px   NUMERIC;
  v_stake    NUMERIC;
  v_qty      NUMERIC;
  v_base     TEXT;
  v_order_id UUID := gen_random_uuid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('spot');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_amount);

  IF p_client_request_id IS NULL OR btrim(p_client_request_id) = '' THEN
    RAISE EXCEPTION 'client_request_id_required';
  END IF;

  INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
  VALUES (
    v_user_id,
    p_client_request_id,
    CASE
      WHEN p_order_type = 'limit' THEN 'rpc_place_spot_limit_order'
      ELSE 'rpc_place_spot_stop_order'
    END
  )
  ON CONFLICT (user_id, client_request_id) DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'duplicate_request'; END IF;

  IF p_side NOT IN ('buy', 'sell') THEN RAISE EXCEPTION 'invalid_side'; END IF;
  IF p_stake_currency NOT IN ('PHON', 'USDT') THEN RAISE EXCEPTION 'invalid_stake_currency'; END IF;

  v_side := p_side;
  v_ccy  := p_stake_currency::currency;
  v_amt  := p_amount::NUMERIC;
  IF v_amt <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT * INTO v_mkt FROM spot_markets WHERE symbol = p_market AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  v_base := split_part(p_market, '_', 1);

  IF v_side = 'buy' THEN
    IF p_market = 'PHON_USDT' AND v_ccy <> 'USDT' THEN
      RAISE EXCEPTION 'invalid_stake_currency' USING HINT = 'PHON_USDT buy requires USDT';
    END IF;

    IF p_order_type = 'limit' THEN
      IF p_price IS NULL THEN RAISE EXCEPTION 'limit_price_required'; END IF;
      PERFORM _assert_amount_text(p_price);
      v_ref_px := p_price::NUMERIC;
    ELSIF p_order_type IN ('stop_market', 'stop_limit') THEN
      IF p_stop_price IS NULL THEN RAISE EXCEPTION 'stop_price_required'; END IF;
      PERFORM _assert_amount_text(p_stop_price);
      v_ref_px := p_stop_price::NUMERIC;
      IF p_order_type = 'stop_limit' THEN
        IF p_price IS NULL THEN RAISE EXCEPTION 'limit_price_required'; END IF;
        PERFORM _assert_amount_text(p_price);
        IF p_price::NUMERIC <= 0 THEN RAISE EXCEPTION 'invalid_price'; END IF;
      END IF;
    ELSE
      RAISE EXCEPTION 'invalid_order_type';
    END IF;

    IF v_ref_px <= 0 THEN RAISE EXCEPTION 'invalid_price'; END IF;

    v_stake := trunc(v_amt, 6);
    v_qty := trunc(v_stake / v_ref_px, 6);

    IF v_mkt.min_notional IS NOT NULL AND v_stake < v_mkt.min_notional::NUMERIC THEN
      RAISE EXCEPTION 'below_min_notional' USING HINT = p_market;
    END IF;

    PERFORM _assert_rg_domain_entry_allowed(v_user_id, 'trading', v_ccy);

    PERFORM _lock_wallet_internal(
      v_user_id, v_ccy, _fmt6(v_stake),
      'spot_order_lock', 'spot_lock:' || v_order_id::TEXT
    );
  ELSE
    v_qty := trunc(v_amt, 6);
    v_stake := v_qty;

    IF p_order_type = 'limit' THEN
      IF p_price IS NULL THEN RAISE EXCEPTION 'limit_price_required'; END IF;
      PERFORM _assert_amount_text(p_price);
      v_ref_px := p_price::NUMERIC;
    ELSIF p_order_type IN ('stop_market', 'stop_limit') THEN
      IF p_stop_price IS NULL THEN RAISE EXCEPTION 'stop_price_required'; END IF;
      PERFORM _assert_amount_text(p_stop_price);
      v_ref_px := p_stop_price::NUMERIC;
      IF p_order_type = 'stop_limit' THEN
        IF p_price IS NULL THEN RAISE EXCEPTION 'limit_price_required'; END IF;
        PERFORM _assert_amount_text(p_price);
      END IF;
    ELSE
      RAISE EXCEPTION 'invalid_order_type';
    END IF;

    IF v_ref_px <= 0 THEN RAISE EXCEPTION 'invalid_price'; END IF;

    IF v_mkt.min_notional IS NOT NULL AND trunc(v_qty * v_ref_px, 6) < v_mkt.min_notional::NUMERIC THEN
      RAISE EXCEPTION 'below_min_notional' USING HINT = p_market;
    END IF;

    PERFORM _assert_rg_domain_entry_allowed(v_user_id, 'trading', v_ccy);

    PERFORM _lock_spot_sell_base(v_user_id, p_market, v_base, v_qty, v_order_id);
  END IF;

  INSERT INTO spot_open_orders (
    id, user_id, market, side, order_type, status,
    stake_currency, stake_amount, price, stop_price, quantity, base_asset,
    client_request_id
  ) VALUES (
    v_order_id, v_user_id, p_market, v_side, p_order_type, p_initial_status,
    v_ccy, _fmt6(v_stake), p_price, p_stop_price, _fmt6(v_qty), v_base,
    p_client_request_id
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'market', p_market,
    'side', v_side,
    'order_type', p_order_type,
    'status', p_initial_status,
    'quantity', _fmt6(v_qty),
    'stake_amount', _fmt6(v_stake),
    'stake_currency', v_ccy,
    'price', p_price,
    'stop_price', p_stop_price
  );
END;
$$;

REVOKE ALL ON FUNCTION _place_spot_open_order_common(
  TEXT, TEXT, TEXT, TEXT, order_type, order_status, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

-- ─── Fill internal (house counterparty · PHON_USDT + majors) ─────────────────

CREATE OR REPLACE FUNCTION _fill_house_spot_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order      spot_open_orders%ROWTYPE;
  v_mkt        spot_markets%ROWTYPE;
  v_mark       NUMERIC;
  v_fill_px    NUMERIC;
  v_fee_rate   NUMERIC;
  v_gross_base NUMERIC;
  v_fee        NUMERIC;
  v_net_base   NUMERIC;
  v_gross_stake NUMERIC;
  v_net_stake  NUMERIC;
  v_trade_id   UUID := gen_random_uuid();
  v_tid        UUID := gen_random_uuid();
  v_usdt_spent NUMERIC;
BEGIN
  SELECT * INTO v_order
  FROM spot_open_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.status NOT IN ('open', 'triggered') THEN
    RAISE EXCEPTION 'order_not_fillable';
  END IF;

  SELECT * INTO v_mkt FROM spot_markets WHERE symbol = v_order.market AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  v_mark := _assert_price_fresh(v_order.market);
  v_fee_rate := v_mkt.fee_rate::NUMERIC;

  IF v_order.order_type = 'limit' THEN
    IF NOT _spot_order_limit_crossed(v_order.side, v_mark, v_order.price) THEN
      RAISE EXCEPTION 'limit_not_crossed';
    END IF;
    v_fill_px := v_order.price::NUMERIC;
  ELSIF v_order.order_type = 'stop_market' THEN
    IF NOT _spot_order_stop_entry_triggered(v_order.side, v_mark, v_order.stop_price) THEN
      RAISE EXCEPTION 'stop_not_triggered';
    END IF;
    v_fill_px := v_mark;
  ELSIF v_order.order_type = 'stop_limit' THEN
    IF NOT _spot_order_limit_crossed(v_order.side, v_mark, v_order.price) THEN
      RAISE EXCEPTION 'limit_not_crossed';
    END IF;
    v_fill_px := v_order.price::NUMERIC;
  ELSE
    RAISE EXCEPTION 'invalid_order_type';
  END IF;

  IF v_order.side = 'buy' THEN
    PERFORM _unlock_wallet_internal(
      v_order.user_id, v_order.stake_currency, v_order.stake_amount,
      'spot_order_unlock', 'spot_fill_unlock:' || v_order.id::TEXT
    );

    IF v_order.market = 'PHON_USDT' THEN
      v_usdt_spent := v_order.stake_amount::NUMERIC;
      v_gross_base := v_usdt_spent / v_fill_px;
      v_fee := v_gross_base * v_fee_rate;
      v_net_base := trunc(v_gross_base - v_fee, 6);

      PERFORM _debit_wallet_internal(v_order.user_id, 'USDT', _fmt6(v_usdt_spent),
        'spot_buy_pay', 'spot_pay:' || v_trade_id::TEXT);
      PERFORM _credit_system_account('house_liquidity_usdt', _fmt6(v_usdt_spent),
        'spot_buy_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
      PERFORM _credit_wallet_internal(v_order.user_id, 'PHON', _fmt6(v_net_base),
        'spot_buy_recv', 'spot_recv:' || v_trade_id::TEXT);
      IF v_fee > 0 THEN
        PERFORM _credit_system_account('house_fee_phon', _fmt6(v_fee),
          'spot_buy_fee', v_order.user_id, v_trade_id::TEXT, v_tid);
      END IF;
      PERFORM _debit_system_account('house_liquidity_phon', _fmt6(v_net_base + v_fee),
        'spot_buy_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);

      INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
        fee_currency, fee_amount, base_asset, stake_currency, base_amount)
      VALUES (v_trade_id, v_order.user_id, v_order.market, 'buy', _fmt6(v_fill_px), _fmt6(v_net_base),
        _fmt6(v_usdt_spent), 'PHON', _fmt6(v_fee), v_order.base_asset, 'USDT'::currency, _fmt6(v_net_base));
    ELSE
      IF v_order.stake_currency = 'USDT' THEN
        v_usdt_spent := v_order.stake_amount::NUMERIC;
      ELSE
        v_usdt_spent := trunc(v_order.stake_amount::NUMERIC * _assert_price_fresh('PHON_USDT'), 6);
      END IF;
      v_gross_base := v_usdt_spent / v_fill_px;
      v_fee := v_gross_base * v_fee_rate;
      v_net_base := trunc(v_gross_base - v_fee, 6);

      IF v_order.stake_currency = 'USDT' THEN
        PERFORM _debit_wallet_internal(v_order.user_id, 'USDT', _fmt6(v_usdt_spent),
          'spot_buy_pay', 'spot_pay:' || v_trade_id::TEXT);
        PERFORM _credit_system_account('house_liquidity_usdt', _fmt6(v_usdt_spent),
          'spot_buy_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
      ELSE
        PERFORM _debit_wallet_internal(v_order.user_id, 'PHON', _fmt6(v_order.stake_amount::NUMERIC),
          'spot_buy_pay', 'spot_pay:' || v_trade_id::TEXT);
        PERFORM _credit_system_account('house_liquidity_phon', _fmt6(v_order.stake_amount::NUMERIC),
          'spot_buy_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
      END IF;

      PERFORM _upsert_spot_holding(v_order.user_id, v_order.base_asset, v_net_base);

      IF v_fee > 0 THEN
        PERFORM _credit_system_account(
          CASE WHEN v_order.stake_currency = 'USDT' THEN 'house_fee_usdt' ELSE 'house_fee_phon' END,
          _fmt6(trunc(v_fee * v_fill_px, 6)),
          'spot_buy_fee', v_order.user_id, v_trade_id::TEXT, v_tid
        );
      END IF;

      INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
        fee_currency, fee_amount, base_asset, stake_currency, base_amount)
      VALUES (
        v_trade_id, v_order.user_id, v_order.market, 'buy', _fmt6(v_fill_px),
        CASE WHEN v_order.base_asset = 'PHON' THEN _fmt6(v_net_base) ELSE '0.000000' END,
        _fmt6(v_usdt_spent),
        CASE WHEN v_order.stake_currency = 'USDT' THEN 'USDT'::currency ELSE 'PHON'::currency END,
        _fmt6(trunc(v_fee * v_fill_px, 6)),
        v_order.base_asset, v_order.stake_currency, _fmt6(v_net_base)
      );
    END IF;
  ELSE
    IF v_order.base_asset = 'PHON' THEN
      PERFORM _unlock_wallet_internal(
        v_order.user_id, 'PHON'::currency, v_order.quantity,
        'spot_order_unlock', 'spot_fill_unlock:' || v_order.id::TEXT
      );
    END IF;

    IF v_order.market = 'PHON_USDT' THEN
      v_gross_stake := trunc(v_order.quantity::NUMERIC * v_fill_px, 6);
      v_fee := trunc(v_gross_stake * v_fee_rate, 6);
      v_net_stake := v_gross_stake - v_fee;

      PERFORM _debit_wallet_internal(v_order.user_id, 'PHON', v_order.quantity,
        'spot_sell_pay', 'spot_pay:' || v_trade_id::TEXT);
      PERFORM _credit_system_account('house_liquidity_phon', v_order.quantity,
        'spot_sell_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
      PERFORM _credit_wallet_internal(v_order.user_id, 'USDT', _fmt6(v_net_stake),
        'spot_sell_recv', 'spot_recv:' || v_trade_id::TEXT);
      IF v_fee > 0 THEN
        PERFORM _credit_system_account('house_fee_usdt', _fmt6(v_fee),
          'spot_sell_fee', v_order.user_id, v_trade_id::TEXT, v_tid);
      END IF;
      PERFORM _debit_system_account('house_liquidity_usdt', _fmt6(v_net_stake + v_fee),
        'spot_sell_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);

      INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
        fee_currency, fee_amount, base_asset, stake_currency, base_amount)
      VALUES (v_trade_id, v_order.user_id, v_order.market, 'sell', _fmt6(v_fill_px), v_order.quantity,
        _fmt6(v_net_stake), 'USDT', _fmt6(v_fee), v_order.base_asset, 'USDT'::currency, v_order.quantity);
    ELSE
      v_gross_stake := trunc(v_order.quantity::NUMERIC * v_fill_px, 6);
      v_fee := trunc(v_gross_stake * v_fee_rate, 6);
      v_net_stake := v_gross_stake - v_fee;

      IF v_order.stake_currency = 'USDT' THEN
        PERFORM _credit_wallet_internal(v_order.user_id, 'USDT', _fmt6(v_net_stake),
          'spot_sell_recv', 'spot_recv:' || v_trade_id::TEXT);
        PERFORM _debit_system_account('house_liquidity_usdt', _fmt6(v_net_stake + v_fee),
          'spot_sell_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
        IF v_fee > 0 THEN
          PERFORM _credit_system_account('house_fee_usdt', _fmt6(v_fee),
            'spot_sell_fee', v_order.user_id, v_trade_id::TEXT, v_tid);
        END IF;
      ELSE
        v_net_stake := trunc(v_net_stake / NULLIF(_assert_price_fresh('PHON_USDT'), 0), 6);
        v_fee := trunc(v_fee / NULLIF(_assert_price_fresh('PHON_USDT'), 0), 6);
        PERFORM _credit_wallet_internal(v_order.user_id, 'PHON', _fmt6(v_net_stake),
          'spot_sell_recv', 'spot_recv:' || v_trade_id::TEXT);
        PERFORM _debit_system_account('house_liquidity_phon', _fmt6(v_net_stake + v_fee),
          'spot_sell_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
        IF v_fee > 0 THEN
          PERFORM _credit_system_account('house_fee_phon', _fmt6(v_fee),
            'spot_sell_fee', v_order.user_id, v_trade_id::TEXT, v_tid);
        END IF;
      END IF;

      INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
        fee_currency, fee_amount, base_asset, stake_currency, base_amount)
      VALUES (
        v_trade_id, v_order.user_id, v_order.market, 'sell', _fmt6(v_fill_px), '0.000000',
        CASE WHEN v_order.stake_currency = 'USDT' THEN _fmt6(v_net_stake) ELSE '0.000000' END,
        v_order.stake_currency, _fmt6(v_fee), v_order.base_asset, v_order.stake_currency, v_order.quantity
      );
    END IF;
  END IF;

  INSERT INTO spot_order_fills (order_id, fill_price, fill_quantity, fee)
  VALUES (
    v_order.id,
    _fmt6(v_fill_px),
    v_order.quantity,
    _fmt6(COALESCE(v_fee, 0))
  );

  UPDATE spot_open_orders
  SET status = 'filled',
      filled_quantity = v_order.quantity,
      updated_at = NOW()
  WHERE id = v_order.id;

  RETURN jsonb_build_object(
    'order_id', v_order.id,
    'trade_id', v_trade_id,
    'fill_price', _fmt6(v_fill_px),
    'quantity', v_order.quantity,
    'side', v_order.side
  );
END;
$$;

REVOKE ALL ON FUNCTION _fill_house_spot_order(UUID) FROM PUBLIC, anon, authenticated;

-- ─── Client RPCs ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_place_spot_limit_order(
  p_market            TEXT,
  p_side              TEXT,
  p_stake_currency    TEXT,
  p_amount            TEXT,
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
  PERFORM _enforce_rate_limit(auth.uid(), 'rpc_place_spot_limit_order');

  RETURN _place_spot_open_order_common(
    p_market, p_side, p_stake_currency, p_amount,
    'limit'::order_type, 'open'::order_status,
    p_limit_price, NULL, p_client_request_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_place_spot_stop_order(
  p_market            TEXT,
  p_side              TEXT,
  p_stake_currency    TEXT,
  p_amount            TEXT,
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
  PERFORM _enforce_rate_limit(auth.uid(), 'rpc_place_spot_stop_order');

  IF p_order_type = 'stop_market' THEN
    v_type := 'stop_market';
  ELSIF p_order_type = 'stop_limit' THEN
    v_type := 'stop_limit';
  ELSE
    RAISE EXCEPTION 'invalid_order_type';
  END IF;

  RETURN _place_spot_open_order_common(
    p_market, p_side, p_stake_currency, p_amount,
    v_type, 'pending'::order_status,
    p_limit_price, p_stop_price, p_client_request_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_cancel_spot_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order   spot_open_orders%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_cancel_spot_order');
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('spot');

  SELECT * INTO v_order
  FROM spot_open_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_order.status NOT IN ('pending', 'open', 'triggered') THEN
    RAISE EXCEPTION 'order_not_cancellable';
  END IF;

  IF v_order.side = 'buy' THEN
    PERFORM _unlock_wallet_internal(
      v_user_id, v_order.stake_currency, v_order.stake_amount,
      'spot_order_unlock', 'spot_cancel:' || v_order.id::TEXT
    );
  ELSE
    PERFORM _unlock_spot_sell_base(
      v_user_id, v_order.base_asset, v_order.quantity::NUMERIC, v_order.id
    );
  END IF;

  UPDATE spot_open_orders
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('order_id', p_order_id, 'status', 'cancelled');
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_spot_limit_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_spot_limit_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_place_spot_stop_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_spot_stop_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_cancel_spot_order(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_cancel_spot_order(UUID) TO authenticated, service_role;

-- ─── Fill worker (service/cron only) ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_run_spot_order_fills()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order      spot_open_orders%ROWTYPE;
  v_mark       NUMERIC;
  v_filled     INT := 0;
  v_triggered  INT := 0;
  v_skipped    INT := 0;
  v_errors     INT := 0;
  v_detail     JSONB := '[]'::JSONB;
  v_err_msg    TEXT;
  v_res        JSONB;
BEGIN
  IF auth.role() = 'anon' OR (auth.role() = 'authenticated' AND NOT _is_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_order IN
    SELECT *
    FROM spot_open_orders
    WHERE status IN ('pending', 'open', 'triggered')
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM spot_markets sm
      JOIN market_circuit_breakers mcb ON mcb.symbol = sm.symbol
      WHERE sm.symbol = v_order.market AND sm.is_active AND NOT mcb.is_halted
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
      IF NOT _spot_order_stop_entry_triggered(v_order.side, v_mark, v_order.stop_price) THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

      IF v_order.order_type = 'stop_limit' THEN
        UPDATE spot_open_orders
        SET status = 'open', updated_at = NOW()
        WHERE id = v_order.id;
        v_order.status := 'open';
        v_triggered := v_triggered + 1;
        IF NOT _spot_order_limit_crossed(v_order.side, v_mark, v_order.price) THEN
          CONTINUE;
        END IF;
      ELSE
        UPDATE spot_open_orders
        SET status = 'triggered', updated_at = NOW()
        WHERE id = v_order.id;
        v_order.status := 'triggered';
        v_triggered := v_triggered + 1;
      END IF;
    ELSIF v_order.order_type = 'limit' AND v_order.status = 'open' THEN
      IF NOT _spot_order_limit_crossed(v_order.side, v_mark, v_order.price) THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
    END IF;

    BEGIN
      v_res := _fill_house_spot_order(v_order.id);
      v_filled := v_filled + 1;
      v_detail := v_detail || jsonb_build_object(
        'order_id', v_order.id,
        'trade_id', v_res->>'trade_id',
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

REVOKE ALL ON FUNCTION rpc_run_spot_order_fills() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_spot_order_fills() TO service_role;

CREATE OR REPLACE FUNCTION _run_spot_order_fills_logged()
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
  v_res := rpc_run_spot_order_fills();
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

REVOKE ALL ON FUNCTION _run_spot_order_fills_logged() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'trade-spot-order-fills',
  '* * * * *',
  $$SELECT _run_spot_order_fills_logged();$$
);
