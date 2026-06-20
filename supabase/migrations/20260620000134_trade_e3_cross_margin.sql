-- ============================================================
-- Migration: 20260620000134_trade_e3_cross_margin
-- Trade Wave E3: margin_accounts · adjust margin · partial close
-- ============================================================

SET search_path = public, pg_temp;

-- ─── margin_accounts (user preference + cross pool balances) ────────────────

CREATE TABLE IF NOT EXISTS margin_accounts (
  user_id                UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE RESTRICT,
  margin_mode            margin_mode NOT NULL DEFAULT 'isolated',
  cross_collateral_phon  TEXT NOT NULL DEFAULT '0'
    CONSTRAINT ma_phon_fmt CHECK (cross_collateral_phon ~ '^\d+(\.\d+)?$'),
  cross_collateral_usdt  TEXT NOT NULL DEFAULT '0'
    CONSTRAINT ma_usdt_fmt CHECK (cross_collateral_usdt ~ '^\d+(\.\d+)?$'),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE margin_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user read own margin_accounts" ON margin_accounts;
CREATE POLICY "user read own margin_accounts" ON margin_accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

REVOKE ALL ON margin_accounts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON margin_accounts TO authenticated;

-- ─── Rate limits ─────────────────────────────────────────────────────────────

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_set_margin_mode',           10, 0.167, 1, 60),
  ('rpc_adjust_isolated_margin',    10, 0.167, 1, 60),
  ('rpc_partial_close_futures',     10, 0.167, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _futures_liquidation_price(
  p_side      position_side,
  p_entry     NUMERIC,
  p_margin    NUMERIC,
  p_quantity  NUMERIC,
  p_mmr       NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_notional NUMERIC;
  v_eff_lev  NUMERIC;
  v_inv_lev  NUMERIC;
  v_liq      NUMERIC;
BEGIN
  IF p_quantity <= 0 OR p_margin <= 0 OR p_entry <= 0 THEN
    RETURN 0;
  END IF;

  v_notional := p_quantity * p_entry;
  v_eff_lev := v_notional / p_margin;
  IF v_eff_lev < 1 THEN
    v_eff_lev := 1;
  END IF;
  v_inv_lev := 1 / v_eff_lev;

  IF p_side = 'long' THEN
    v_liq := p_entry * (1 - v_inv_lev + p_mmr);
  ELSE
    v_liq := p_entry * (1 + v_inv_lev - p_mmr);
  END IF;

  IF v_liq < 0 THEN
    v_liq := 0;
  END IF;

  RETURN v_liq;
END;
$$;

REVOKE ALL ON FUNCTION _futures_liquidation_price(position_side, NUMERIC, NUMERIC, NUMERIC, NUMERIC)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_signed_amount_text(p_value TEXT)
RETURNS VOID
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_value IS NULL OR p_value !~ '^-?\d+(\.\d+)?$' THEN
    RAISE EXCEPTION 'invalid_amount' USING HINT = COALESCE(p_value, 'null');
  END IF;
  IF p_value::NUMERIC = 0 THEN
    RAISE EXCEPTION 'invalid_amount' USING HINT = 'zero';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_signed_amount_text(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _partial_settle_futures_position(
  p_pos_id      UUID,
  p_exit        NUMERIC,
  p_close_ratio NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pos          futures_positions%ROWTYPE;
  v_mkt          futures_markets%ROWTYPE;
  v_qty          NUMERIC;
  v_entry        NUMERIC;
  v_margin       NUMERIC;
  v_close_qty    NUMERIC;
  v_remain_qty   NUMERIC;
  v_close_margin NUMERIC;
  v_remain_margin NUMERIC;
  v_pnl          NUMERIC;
  v_close_fee    NUMERIC;
  v_gross_equity NUMERIC;
  v_equity       NUMERIC;
  v_bad_debt     NUMERIC := 0;
  v_close_rate   NUMERIC;
  v_mmr          NUMERIC;
  v_fee_account  TEXT;
  v_ins_account  TEXT;
  v_tid          UUID := gen_random_uuid();
  v_u6           NUMERIC;
  v_h6           NUMERIC;
  v_ins6         NUMERIC;
  v_dust6        NUMERIC;
  v_remain_liq   NUMERIC;
  v_remain_notional NUMERIC;
  v_eff_lev      NUMERIC;
BEGIN
  SELECT * INTO v_pos FROM futures_positions WHERE id = p_pos_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.status <> 'open' THEN RAISE EXCEPTION 'position_not_open'; END IF;

  IF p_close_ratio <= 0 OR p_close_ratio >= 1 THEN
    RAISE EXCEPTION 'invalid_close_ratio';
  END IF;

  SELECT * INTO v_mkt FROM futures_markets WHERE symbol = v_pos.market;
  v_close_rate := v_mkt.close_fee_rate::NUMERIC;
  v_mmr := v_mkt.maintenance_margin_rate::NUMERIC;
  v_fee_account := 'house_fee_' || lower(v_pos.margin_currency::TEXT);
  v_ins_account := 'insurance_fund_' || lower(v_pos.margin_currency::TEXT);

  v_qty := v_pos.quantity::NUMERIC;
  v_entry := v_pos.entry_price::NUMERIC;
  v_margin := v_pos.margin_amount::NUMERIC;

  v_close_qty := trunc(v_qty * p_close_ratio, 6);
  v_remain_qty := v_qty - v_close_qty;
  IF v_close_qty <= 0 OR v_remain_qty <= 0 THEN
    RAISE EXCEPTION 'invalid_close_ratio';
  END IF;

  v_close_margin := trunc(v_margin * p_close_ratio, 6);
  v_remain_margin := v_margin - v_close_margin;

  IF v_pos.side = 'long' THEN
    v_pnl := v_close_qty * (p_exit - v_entry);
  ELSE
    v_pnl := v_close_qty * (v_entry - p_exit);
  END IF;

  v_close_fee := (v_close_qty * p_exit) * v_close_rate;
  v_gross_equity := v_close_margin + v_pnl - v_close_fee;

  IF v_gross_equity < 0 THEN
    v_bad_debt := -v_gross_equity;
    v_equity := 0;
  ELSE
    v_equity := v_gross_equity;
  END IF;

  v_u6 := trunc(trunc(v_equity, 6) - v_close_margin, 6);
  v_h6 := trunc(v_close_fee, 6);
  v_ins6 := trunc((v_close_margin - v_equity) - v_close_fee, 6);
  v_dust6 := -(v_u6 + v_h6 + v_ins6);

  PERFORM _unlock_wallet_internal(
    v_pos.user_id, v_pos.margin_currency, _fmt6(v_close_margin),
    'futures_margin_unlock', 'fut_partial_unlock:' || p_pos_id::TEXT || ':' || v_tid::TEXT
  );

  IF v_u6 > 0 THEN
    PERFORM _credit_wallet_internal(v_pos.user_id, v_pos.margin_currency, _fmt6(v_u6),
      'futures_pnl', 'fut_partial_pnl:' || p_pos_id::TEXT || ':' || v_tid::TEXT);
  ELSIF v_u6 < 0 THEN
    PERFORM _debit_wallet_internal(v_pos.user_id, v_pos.margin_currency, _fmt6(abs(v_u6)),
      'futures_pnl', 'fut_partial_pnl:' || p_pos_id::TEXT || ':' || v_tid::TEXT);
  END IF;

  IF v_h6 > 0 THEN
    PERFORM _credit_system_account(v_fee_account, _fmt6(v_h6),
      'futures_close_fee', v_pos.user_id, p_pos_id::TEXT, v_tid);
  END IF;

  IF v_ins6 > 0 THEN
    PERFORM _credit_system_account(v_ins_account, _fmt6(v_ins6),
      'futures_counterparty', v_pos.user_id, p_pos_id::TEXT, v_tid);
  ELSIF v_ins6 < 0 THEN
    PERFORM _debit_system_account(v_ins_account, _fmt6(abs(v_ins6)),
      'futures_counterparty', v_pos.user_id, p_pos_id::TEXT, v_tid);
  END IF;

  IF v_dust6 > 0 THEN
    PERFORM _credit_system_account('dust_' || lower(v_pos.margin_currency::TEXT), _fmt6(v_dust6),
      'rounding_dust', v_pos.user_id, p_pos_id::TEXT, v_tid);
  ELSIF v_dust6 < 0 THEN
    PERFORM _debit_system_account('dust_' || lower(v_pos.margin_currency::TEXT), _fmt6(abs(v_dust6)),
      'rounding_dust', v_pos.user_id, p_pos_id::TEXT, v_tid);
  END IF;

  v_remain_notional := v_remain_qty * v_entry;
  v_eff_lev := v_remain_notional / NULLIF(v_remain_margin, 0);
  v_remain_liq := _futures_liquidation_price(v_pos.side, v_entry, v_remain_margin, v_remain_qty, v_mmr);

  UPDATE futures_positions SET
    quantity = _fmt6(v_remain_qty),
    margin_amount = _fmt6(v_remain_margin),
    notional = _fmt6(v_remain_notional),
    leverage = _fmt6(v_eff_lev),
    liquidation_price = _fmt6(v_remain_liq),
    updated_at = NOW()
  WHERE id = p_pos_id;

  INSERT INTO position_ledger (position_id, user_id, event, price, realized_pnl, fee, payload)
  VALUES (
    p_pos_id, v_pos.user_id, 'partial_close', _fmt6(p_exit), _fmt6(v_pnl), _fmt6(v_close_fee),
    jsonb_build_object(
      'close_ratio', p_close_ratio,
      'closed_quantity', _fmt6(v_close_qty),
      'remaining_quantity', _fmt6(v_remain_qty),
      'equity_returned', _fmt6(v_equity),
      'bad_debt', _fmt6(v_bad_debt),
      'transfer_id', v_tid
    )
  );

  RETURN jsonb_build_object(
    'position_id', p_pos_id,
    'status', 'open',
    'exit_price', _fmt6(p_exit),
    'close_ratio', p_close_ratio,
    'closed_quantity', _fmt6(v_close_qty),
    'remaining_quantity', _fmt6(v_remain_qty),
    'realized_pnl', _fmt6(v_pnl),
    'close_fee', _fmt6(v_close_fee),
    'equity_returned', _fmt6(v_equity),
    'bad_debt', _fmt6(v_bad_debt)
  );
END;
$$;

REVOKE ALL ON FUNCTION _partial_settle_futures_position(UUID, NUMERIC, NUMERIC)
  FROM PUBLIC, anon, authenticated;

-- ─── Client RPCs ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_set_margin_mode(p_mode TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_mode    margin_mode;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_set_margin_mode');
  PERFORM _assert_feature_enabled('futures');

  IF p_mode NOT IN ('isolated', 'cross') THEN
    RAISE EXCEPTION 'invalid_margin_mode';
  END IF;
  v_mode := p_mode::margin_mode;

  IF EXISTS (
    SELECT 1 FROM futures_positions
    WHERE user_id = v_user_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'open_positions_block';
  END IF;

  IF EXISTS (
    SELECT 1 FROM trading_open_orders
    WHERE user_id = v_user_id AND status IN ('pending', 'open', 'triggered')
  ) THEN
    RAISE EXCEPTION 'open_orders_block';
  END IF;

  INSERT INTO margin_accounts (user_id, margin_mode, updated_at)
  VALUES (v_user_id, v_mode, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET margin_mode = EXCLUDED.margin_mode, updated_at = NOW();

  RETURN jsonb_build_object('user_id', v_user_id, 'margin_mode', v_mode);
END;
$$;

CREATE OR REPLACE FUNCTION rpc_adjust_isolated_margin(
  p_position_id UUID,
  p_delta         TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_pos        futures_positions%ROWTYPE;
  v_mkt        futures_markets%ROWTYPE;
  v_delta      NUMERIC;
  v_new_margin NUMERIC;
  v_qty        NUMERIC;
  v_entry      NUMERIC;
  v_mmr        NUMERIC;
  v_eff_lev    NUMERIC;
  v_new_liq    NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_adjust_isolated_margin');
  PERFORM _assert_feature_enabled('futures');
  PERFORM _assert_signed_amount_text(p_delta);

  v_delta := p_delta::NUMERIC;

  SELECT * INTO v_pos
  FROM futures_positions
  WHERE id = p_position_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_pos.status <> 'open' THEN RAISE EXCEPTION 'position_not_open'; END IF;
  IF v_pos.margin_mode <> 'isolated' THEN RAISE EXCEPTION 'not_isolated_margin'; END IF;

  SELECT * INTO v_mkt FROM futures_markets WHERE symbol = v_pos.market AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  v_qty := v_pos.quantity::NUMERIC;
  v_entry := v_pos.entry_price::NUMERIC;
  v_mmr := v_mkt.maintenance_margin_rate::NUMERIC;
  v_new_margin := v_pos.margin_amount::NUMERIC + v_delta;

  IF v_new_margin <= 0 THEN
    RAISE EXCEPTION 'margin_too_low';
  END IF;

  v_eff_lev := (v_qty * v_entry) / v_new_margin;
  IF v_eff_lev > v_mkt.max_leverage::NUMERIC THEN
    RAISE EXCEPTION 'leverage_too_high';
  END IF;

  IF v_delta > 0 THEN
    PERFORM _lock_wallet_internal(
      v_user_id, v_pos.margin_currency, _fmt6(v_delta),
      'futures_margin_lock', 'fut_margin_adj:' || p_position_id::TEXT
    );
  ELSE
    PERFORM _unlock_wallet_internal(
      v_user_id, v_pos.margin_currency, _fmt6(abs(v_delta)),
      'futures_margin_unlock', 'fut_margin_adj:' || p_position_id::TEXT
    );
  END IF;

  v_new_liq := _futures_liquidation_price(v_pos.side, v_entry, v_new_margin, v_qty, v_mmr);

  UPDATE futures_positions SET
    margin_amount = _fmt6(v_new_margin),
    leverage = _fmt6(v_eff_lev),
    liquidation_price = _fmt6(v_new_liq),
    updated_at = NOW()
  WHERE id = p_position_id;

  INSERT INTO position_ledger (position_id, user_id, event, price, payload)
  VALUES (
    p_position_id, v_user_id, 'margin_adjust', v_pos.entry_price,
    jsonb_build_object('delta', _fmt6(v_delta), 'new_margin', _fmt6(v_new_margin))
  );

  RETURN jsonb_build_object(
    'position_id', p_position_id,
    'delta', _fmt6(v_delta),
    'margin_amount', _fmt6(v_new_margin),
    'liquidation_price', _fmt6(v_new_liq)
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_partial_close_futures(
  p_position_id UUID,
  p_close_ratio TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pos     futures_positions%ROWTYPE;
  v_exit    NUMERIC;
  v_ratio   NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_partial_close_futures');
  PERFORM _assert_feature_enabled('futures');

  PERFORM _assert_amount_text(p_close_ratio);
  v_ratio := p_close_ratio::NUMERIC;

  SELECT * INTO v_pos FROM futures_positions WHERE id = p_position_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;

  v_exit := _assert_price_fresh(v_pos.market);

  RETURN _partial_settle_futures_position(p_position_id, v_exit, v_ratio);
END;
$$;

REVOKE ALL ON FUNCTION rpc_set_margin_mode(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_set_margin_mode(TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_adjust_isolated_margin(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_adjust_isolated_margin(UUID, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_partial_close_futures(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_partial_close_futures(UUID, TEXT) TO authenticated, service_role;
