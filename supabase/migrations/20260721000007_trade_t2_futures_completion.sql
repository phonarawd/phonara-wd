-- ============================================================
-- Migration: 20260721000007_trade_t2_futures_completion
-- Trade Wave T2: SLTP edit RPC · funding wallet settlement · cron parity
-- ============================================================
-- S2: feature_funding_enabled ON — no retroactive payout for OFF period.
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Rate limit: post-open TP/SL edit ────────────────────────────────────────

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_update_futures_position_sltp', 20, 0.333, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- ─── Funding payment helper (TS computeFundingPayment parity) ───────────────

CREATE OR REPLACE FUNCTION _compute_funding_payment(
  p_notional TEXT,
  p_rate     TEXT,
  p_side     position_side
)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_rate::NUMERIC = 0 OR p_notional::NUMERIC = 0 THEN 0::NUMERIC
    WHEN p_side = 'long' THEN -trunc(p_notional::NUMERIC * p_rate::NUMERIC, 6)
    ELSE trunc(p_notional::NUMERIC * p_rate::NUMERIC, 6)
  END;
$$;

REVOKE ALL ON FUNCTION _compute_funding_payment(TEXT, TEXT, position_side)
  FROM PUBLIC, anon, authenticated;

-- ─── Per-market funding settlement (wallet + insurance counterparty) ──────────

CREATE OR REPLACE FUNCTION _apply_funding_for_market(
  p_market          TEXT,
  p_rate            TEXT,
  p_funding_period  TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pos       futures_positions%ROWTYPE;
  v_payment   NUMERIC;
  v_abs       NUMERIC;
  v_tid       UUID;
  v_idem      TEXT;
  v_ins_acct  TEXT;
  v_paid      INT := 0;
  v_skipped   INT := 0;
  v_errors    INT := 0;
  v_detail    JSONB := '[]'::JSONB;
  v_err_msg   TEXT;
BEGIN
  FOR v_pos IN
    SELECT *
    FROM futures_positions
    WHERE market = p_market
      AND status = 'open'
    FOR UPDATE SKIP LOCKED
  LOOP
    v_payment := _compute_funding_payment(v_pos.notional, p_rate, v_pos.side);
    IF v_payment = 0 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_idem := 'funding:' || p_market || ':' || p_funding_period::TEXT || ':' || v_pos.id::TEXT;
    IF EXISTS (SELECT 1 FROM wallet_ledger WHERE idempotency_key = v_idem) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_tid := gen_random_uuid();
    v_ins_acct := 'insurance_fund_' || lower(v_pos.margin_currency::TEXT);
    v_abs := abs(v_payment);

    BEGIN
      IF v_payment > 0 THEN
        PERFORM _credit_wallet_internal(
          v_pos.user_id, v_pos.margin_currency, _fmt6(v_abs),
          'futures_funding', v_idem
        );
        PERFORM _debit_system_account(
          v_ins_acct, _fmt6(v_abs),
          'futures_funding', v_pos.user_id, v_pos.id::TEXT, v_tid
        );
      ELSE
        PERFORM _debit_wallet_internal(
          v_pos.user_id, v_pos.margin_currency, _fmt6(v_abs),
          'futures_funding', v_idem
        );
        PERFORM _credit_system_account(
          v_ins_acct, _fmt6(v_abs),
          'futures_funding', v_pos.user_id, v_pos.id::TEXT, v_tid
        );
      END IF;

      INSERT INTO funding_payments (user_id, position_id, market, amount, currency)
      VALUES (v_pos.user_id, v_pos.id, p_market, _fmt6(v_payment), v_pos.margin_currency);

      v_paid := v_paid + 1;
      v_detail := v_detail || jsonb_build_object(
        'position_id', v_pos.id,
        'user_id', v_pos.user_id,
        'amount', _fmt6(v_payment),
        'currency', v_pos.margin_currency
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

  RETURN jsonb_build_object(
    'market', p_market,
    'paid', v_paid,
    'skipped', v_skipped,
    'errors', v_errors,
    'detail', v_detail
  );
END;
$$;

REVOKE ALL ON FUNCTION _apply_funding_for_market(TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;

-- ─── Funding accrual cron (schedule + wallet settlement when enabled) ────────

CREATE OR REPLACE FUNCTION rpc_run_funding_accrual()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fr       funding_rates%ROWTYPE;
  v_advanced INT := 0;
  v_settled  INT := 0;
  v_errors   INT := 0;
  v_detail   JSONB := '[]'::JSONB;
  v_apply    JSONB;
BEGIN
  IF auth.role() = 'anon' OR (auth.role() = 'authenticated' AND NOT _is_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_fr IN
    SELECT * FROM funding_rates WHERE next_funding_at <= NOW()
    FOR UPDATE
  LOOP
    IF v_fr.rate::NUMERIC = 0 THEN
      UPDATE funding_rates
      SET next_funding_at = next_funding_at + INTERVAL '8 hours',
          updated_at = NOW()
      WHERE market = v_fr.market;
      v_advanced := v_advanced + 1;
    ELSE
      PERFORM _assert_funding_settlement_enabled();
      v_apply := _apply_funding_for_market(v_fr.market, v_fr.rate, v_fr.next_funding_at);
      v_settled := v_settled + COALESCE((v_apply->>'paid')::INT, 0);
      v_errors := v_errors + COALESCE((v_apply->>'errors')::INT, 0);
      v_detail := v_detail || jsonb_build_array(v_apply);
      UPDATE funding_rates
      SET next_funding_at = next_funding_at + INTERVAL '8 hours',
          updated_at = NOW()
      WHERE market = v_fr.market;
      v_advanced := v_advanced + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'advanced', v_advanced,
    'settled', v_settled,
    'errors', v_errors,
    'detail', v_detail,
    'ran_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_funding_accrual() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_funding_accrual() TO service_role;

-- ─── S2 rollout: enable funding settlement (no retroactive payout) ─────────

UPDATE app_config
SET value = 'true', updated_at = NOW()
WHERE key = 'feature_funding_enabled';

-- ─── rpc_update_futures_position_sltp ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_update_futures_position_sltp(
  p_position_id UUID,
  p_stop_loss   TEXT DEFAULT NULL,
  p_take_profit TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pos     futures_positions%ROWTYPE;
  v_entry   NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_update_futures_position_sltp');
  PERFORM _assert_feature_enabled('futures');

  SELECT * INTO v_pos
  FROM futures_positions
  WHERE id = p_position_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_pos.status <> 'open' THEN RAISE EXCEPTION 'position_not_open'; END IF;

  v_entry := v_pos.entry_price::NUMERIC;

  IF p_stop_loss IS NOT NULL THEN
    PERFORM _assert_amount_text(p_stop_loss);
    IF v_pos.side = 'long' AND p_stop_loss::NUMERIC >= v_entry THEN
      RAISE EXCEPTION 'invalid_stop_loss';
    END IF;
    IF v_pos.side = 'short' AND p_stop_loss::NUMERIC <= v_entry THEN
      RAISE EXCEPTION 'invalid_stop_loss';
    END IF;
  END IF;

  IF p_take_profit IS NOT NULL THEN
    PERFORM _assert_amount_text(p_take_profit);
    IF v_pos.side = 'long' AND p_take_profit::NUMERIC <= v_entry THEN
      RAISE EXCEPTION 'invalid_take_profit';
    END IF;
    IF v_pos.side = 'short' AND p_take_profit::NUMERIC >= v_entry THEN
      RAISE EXCEPTION 'invalid_take_profit';
    END IF;
  END IF;

  UPDATE futures_positions SET
    stop_loss = p_stop_loss,
    take_profit = p_take_profit,
    updated_at = NOW()
  WHERE id = p_position_id;

  INSERT INTO position_ledger (position_id, user_id, event, price, payload)
  VALUES (
    p_position_id, v_user_id, 'sltp', v_pos.entry_price,
    jsonb_build_object(
      'stop_loss', p_stop_loss,
      'take_profit', p_take_profit,
      'previous_stop_loss', v_pos.stop_loss,
      'previous_take_profit', v_pos.take_profit
    )
  );

  RETURN jsonb_build_object(
    'position_id', p_position_id,
    'stop_loss', p_stop_loss,
    'take_profit', p_take_profit
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_update_futures_position_sltp(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_update_futures_position_sltp(UUID, TEXT, TEXT) TO authenticated, service_role;
