-- ============================================================
-- Migration: 20260719000001_liquidation_notify_e1
-- E1 — liquidated branch push outbox (trade_position)
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _notify_position_liquidated(
  p_user_id UUID,
  p_position_id UUID,
  p_market TEXT,
  p_exit_price TEXT,
  p_realized_pnl TEXT,
  p_settlement_event TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM _enqueue_notification(
    p_user_id,
    'push',
    'trade_position',
    jsonb_build_object(
      'position_id', p_position_id,
      'market', p_market,
      'symbol', p_market,
      'exit_price', p_exit_price,
      'realized_pnl', p_realized_pnl,
      'settlement_event', p_settlement_event
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION _notify_position_liquidated(UUID, UUID, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _settle_futures_position(
  p_pos_id   UUID,
  p_exit     NUMERIC,
  p_status   position_status,
  p_event    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pos          futures_positions%ROWTYPE;
  v_qty          NUMERIC;
  v_entry        NUMERIC;
  v_margin       NUMERIC;
  v_pnl          NUMERIC;
  v_close_fee    NUMERIC;
  v_gross_equity NUMERIC;
  v_equity       NUMERIC;
  v_adjust       NUMERIC;
  v_close_rate   NUMERIC;
  v_bad_debt     NUMERIC := 0;
  v_fee_account  TEXT;
  v_ins_account  TEXT;
  v_tid          UUID := gen_random_uuid();
  v_u6           NUMERIC;
  v_h6           NUMERIC;
  v_ins6         NUMERIC;
  v_dust6        NUMERIC;
BEGIN
  SELECT * INTO v_pos FROM futures_positions WHERE id = p_pos_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.status <> 'open' THEN RAISE EXCEPTION 'position_not_open'; END IF;

  v_fee_account := 'house_fee_'      || lower(v_pos.margin_currency::TEXT);
  v_ins_account := 'insurance_fund_' || lower(v_pos.margin_currency::TEXT);

  SELECT close_fee_rate::NUMERIC INTO v_close_rate FROM futures_markets WHERE symbol = v_pos.market;

  v_qty    := v_pos.quantity::NUMERIC;
  v_entry  := v_pos.entry_price::NUMERIC;
  v_margin := v_pos.margin_amount::NUMERIC;

  IF v_pos.side = 'long' THEN
    v_pnl := v_qty * (p_exit - v_entry);
  ELSE
    v_pnl := v_qty * (v_entry - p_exit);
  END IF;

  v_close_fee    := (v_qty * p_exit) * v_close_rate;
  v_gross_equity := v_margin + v_pnl - v_close_fee;

  IF v_gross_equity < 0 THEN
    v_bad_debt := -v_gross_equity;
    v_equity   := 0;
  ELSE
    v_equity   := v_gross_equity;
  END IF;

  v_adjust := trunc(v_equity, 6) - v_margin;
  v_u6   := trunc(v_adjust, 6);
  v_h6   := trunc(v_close_fee, 6);
  v_ins6 := trunc((v_margin - v_equity) - v_close_fee, 6);
  v_dust6 := -(v_u6 + v_h6 + v_ins6);

  PERFORM _unlock_wallet_internal(v_pos.user_id, v_pos.margin_currency, _fmt6(v_margin),
    'futures_margin_unlock', 'fut_unlock:' || p_pos_id::TEXT);

  IF v_u6 > 0 THEN
    PERFORM _credit_wallet_internal(v_pos.user_id, v_pos.margin_currency, _fmt6(v_u6),
      'futures_pnl', 'fut_pnl:' || p_pos_id::TEXT);
  ELSIF v_u6 < 0 THEN
    PERFORM _debit_wallet_internal(v_pos.user_id, v_pos.margin_currency, _fmt6(abs(v_u6)),
      'futures_pnl', 'fut_pnl:' || p_pos_id::TEXT);
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

  UPDATE futures_positions SET
    status          = p_status,
    exit_price      = _fmt6(p_exit),
    realized_pnl    = _fmt6(v_pnl),
    close_fee       = _fmt6(v_close_fee),
    equity_returned = _fmt6(v_equity),
    closed_at       = NOW()
  WHERE id = p_pos_id;

  INSERT INTO position_ledger (position_id, user_id, event, price, realized_pnl, fee, payload)
  VALUES (p_pos_id, v_pos.user_id, p_event, _fmt6(p_exit), _fmt6(v_pnl), _fmt6(v_close_fee),
    jsonb_build_object('bad_debt', _fmt6(v_bad_debt), 'transfer_id', v_tid));

  IF p_status = 'liquidated' THEN
    PERFORM _notify_position_liquidated(
      v_pos.user_id,
      p_pos_id,
      v_pos.market,
      _fmt6(p_exit),
      _fmt6(v_pnl),
      p_event
    );
  END IF;

  RETURN jsonb_build_object(
    'position_id',    p_pos_id,
    'status',         p_status,
    'exit_price',     _fmt6(p_exit),
    'realized_pnl',   _fmt6(v_pnl),
    'close_fee',      _fmt6(v_close_fee),
    'equity_returned',_fmt6(v_equity),
    'bad_debt',       _fmt6(v_bad_debt)
  );
END;
$$;

REVOKE ALL ON FUNCTION _settle_futures_position(UUID, NUMERIC, position_status, TEXT)
  FROM PUBLIC, anon, authenticated;
