-- PIR E4 (H-2): chunk liquidation / funding / stop / affiliate sweeps.
-- LIMIT + has_more so each TX holds row locks for a bounded batch; cron re-calls
-- while has_more until drained (or safety cap).
-- Plan: platform_integrity_remediation_v1 · pir-e4-sweep-chunk

SET search_path = public, pg_temp;

-- Default batch size (audit Fix-5). Override via p_batch_limit.
-- ─── Helpers: normalize batch limit ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION _pir_sweep_batch_limit(p_batch_limit INT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_batch_limit IS NULL THEN
    RETURN 200;
  END IF;
  IF p_batch_limit <= 0 THEN
    RAISE EXCEPTION 'invalid_batch_limit';
  END IF;
  RETURN p_batch_limit;
END;
$$;

REVOKE ALL ON FUNCTION _pir_sweep_batch_limit(INT) FROM PUBLIC, anon, authenticated;

-- ─── rpc_run_liquidations (chunked + keyset) ────────────────────────────────

DROP FUNCTION IF EXISTS rpc_run_liquidations();
DROP FUNCTION IF EXISTS rpc_run_liquidations(INT);

CREATE OR REPLACE FUNCTION rpc_run_liquidations(
  p_batch_limit INT DEFAULT 200,
  p_after_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mark        NUMERIC;
  v_pos         futures_positions%ROWTYPE;
  v_should_liq  BOOLEAN;
  v_liquidated  INT := 0;
  v_skipped     INT := 0;
  v_errors      INT := 0;
  v_examined    INT := 0;
  v_limit       INT := _pir_sweep_batch_limit(p_batch_limit);
  v_last_id     UUID := p_after_id;
  v_detail      JSONB := '[]'::JSONB;
  v_err_msg     TEXT;
  v_mark_cache  JSONB := '{}'::JSONB;
BEGIN
  IF auth.role() = 'anon' OR (auth.role() = 'authenticated' AND NOT _is_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_pos IN
    SELECT fp.*
    FROM futures_positions fp
    JOIN futures_markets fm ON fm.symbol = fp.market AND fm.is_active
    JOIN market_circuit_breakers mcb ON mcb.symbol = fp.market AND NOT mcb.is_halted
    WHERE fp.status = 'open'
      AND (p_after_id IS NULL OR fp.id > p_after_id)
    ORDER BY fp.id
    LIMIT v_limit
    FOR UPDATE OF fp SKIP LOCKED
  LOOP
    v_examined := v_examined + 1;
    v_last_id := v_pos.id;

    IF v_mark_cache ? v_pos.market THEN
      v_mark := (v_mark_cache ->> v_pos.market)::NUMERIC;
    ELSE
      BEGIN
        v_mark := _assert_price_fresh(v_pos.market);
        v_mark_cache := v_mark_cache || jsonb_build_object(v_pos.market, _fmt6(v_mark));
      EXCEPTION WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END;
    END IF;

    v_should_liq := _apply_liquidation_buffer(v_pos.id, v_mark);

    IF NOT v_should_liq THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      PERFORM _settle_futures_position(v_pos.id, v_mark, 'liquidated', 'auto_liquidate');
      v_liquidated := v_liquidated + 1;
      v_detail := v_detail || jsonb_build_object(
        'position_id', v_pos.id,
        'user_id', v_pos.user_id,
        'market', v_pos.market,
        'side', v_pos.side,
        'mark', _fmt6(v_mark)
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
    'liquidated', v_liquidated,
    'skipped', v_skipped,
    'errors', v_errors,
    'examined', v_examined,
    'batch_limit', v_limit,
    'last_id', v_last_id,
    'has_more', v_examined >= v_limit,
    'detail', v_detail,
    'ran_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_liquidations(INT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_liquidations(INT, UUID) TO service_role;

-- ─── Liquidation cron wrapper: drain while has_more (keyset) ────────────────

CREATE OR REPLACE FUNCTION _run_liquidations_logged()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_res   JSONB;
  v_liq   INT := 0;
  v_skip  INT := 0;
  v_err   INT := 0;
  v_detail JSONB := '[]'::JSONB;
  v_iters INT := 0;
  v_after UUID := NULL;
  v_chunk_liq INT;
  v_chunk_err INT;
BEGIN
  LOOP
    v_iters := v_iters + 1;
    v_res := rpc_run_liquidations(200, v_after);
    v_chunk_liq := COALESCE((v_res->>'liquidated')::INT, 0);
    v_chunk_err := COALESCE((v_res->>'errors')::INT, 0);
    v_liq := v_liq + v_chunk_liq;
    v_skip := v_skip + COALESCE((v_res->>'skipped')::INT, 0);
    v_err := v_err + v_chunk_err;
    IF v_res->>'last_id' IS NOT NULL THEN
      v_after := (v_res->>'last_id')::UUID;
    END IF;
    IF jsonb_typeof(v_res->'detail') = 'array' THEN
      v_detail := v_detail || COALESCE(v_res->'detail', '[]'::JSONB);
    END IF;

    EXIT WHEN NOT COALESCE((v_res->>'has_more')::BOOLEAN, FALSE);
    EXIT WHEN v_iters >= 50;
  END LOOP;

  IF v_liq > 0 OR v_err > 0 THEN
    INSERT INTO liquidation_run_log (liquidated, skipped, errors, duration_ms, detail)
    VALUES (
      v_liq, v_skip, v_err,
      EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start))::INT,
      v_detail
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _run_liquidations_logged() FROM PUBLIC, anon, authenticated;

-- ─── rpc_run_stop_orders (chunked + keyset) ─────────────────────────────────

DROP FUNCTION IF EXISTS rpc_run_stop_orders();
DROP FUNCTION IF EXISTS rpc_run_stop_orders(INT);

CREATE OR REPLACE FUNCTION rpc_run_stop_orders(
  p_batch_limit INT DEFAULT 200,
  p_after_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mark     NUMERIC;
  v_pos      futures_positions%ROWTYPE;
  v_closed   INT := 0;
  v_skipped  INT := 0;
  v_errors   INT := 0;
  v_examined INT := 0;
  v_limit    INT := _pir_sweep_batch_limit(p_batch_limit);
  v_last_id  UUID := p_after_id;
  v_detail   JSONB := '[]'::JSONB;
  v_err_msg  TEXT;
  v_extreme  TEXT;
  v_trigger  BOOLEAN;
  v_mark_cache JSONB := '{}'::JSONB;
BEGIN
  IF auth.role() = 'anon' OR (auth.role() = 'authenticated' AND NOT _is_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_pos IN
    SELECT fp.*
    FROM futures_positions fp
    JOIN futures_markets fm ON fm.symbol = fp.market AND fm.is_active
    JOIN market_circuit_breakers mcb ON mcb.symbol = fp.market AND NOT mcb.is_halted
    WHERE fp.status = 'open'
      AND (
        fp.stop_loss IS NOT NULL
        OR fp.take_profit IS NOT NULL
        OR fp.trailing_stop_callback_rate IS NOT NULL
      )
      AND (p_after_id IS NULL OR fp.id > p_after_id)
    ORDER BY fp.id
    LIMIT v_limit
    FOR UPDATE OF fp SKIP LOCKED
  LOOP
    v_examined := v_examined + 1;
    v_last_id := v_pos.id;
    v_trigger := FALSE;

    IF v_mark_cache ? v_pos.market THEN
      v_mark := (v_mark_cache ->> v_pos.market)::NUMERIC;
    ELSE
      BEGIN
        v_mark := _assert_price_fresh(v_pos.market);
        v_mark_cache := v_mark_cache || jsonb_build_object(v_pos.market, _fmt6(v_mark));
      EXCEPTION WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END;
    END IF;

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
        'market', v_pos.market,
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

  RETURN jsonb_build_object(
    'closed', v_closed,
    'skipped', v_skipped,
    'errors', v_errors,
    'examined', v_examined,
    'batch_limit', v_limit,
    'last_id', v_last_id,
    'has_more', v_examined >= v_limit,
    'detail', v_detail,
    'ran_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_stop_orders(INT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_stop_orders(INT, UUID) TO service_role;

CREATE OR REPLACE FUNCTION _run_stop_orders_logged()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_res JSONB;
  v_closed INT := 0;
  v_skip INT := 0;
  v_err INT := 0;
  v_detail JSONB := '[]'::JSONB;
  v_iters INT := 0;
  v_after UUID := NULL;
BEGIN
  LOOP
    v_iters := v_iters + 1;
    v_res := rpc_run_stop_orders(200, v_after);
    v_closed := v_closed + COALESCE((v_res->>'closed')::INT, 0);
    v_skip := v_skip + COALESCE((v_res->>'skipped')::INT, 0);
    v_err := v_err + COALESCE((v_res->>'errors')::INT, 0);
    IF v_res->>'last_id' IS NOT NULL THEN
      v_after := (v_res->>'last_id')::UUID;
    END IF;
    IF jsonb_typeof(v_res->'detail') = 'array' THEN
      v_detail := v_detail || COALESCE(v_res->'detail', '[]'::JSONB);
    END IF;

    EXIT WHEN NOT COALESCE((v_res->>'has_more')::BOOLEAN, FALSE);
    EXIT WHEN v_iters >= 50;
  END LOOP;

  IF v_closed > 0 OR v_err > 0 THEN
    INSERT INTO liquidation_run_log (liquidated, skipped, errors, duration_ms, detail)
    VALUES (v_closed, v_skip, v_err, 0, v_detail);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _run_stop_orders_logged() FROM PUBLIC, anon, authenticated;

-- ─── _apply_funding_for_market (chunked) ────────────────────────────────────
-- Do NOT advance next_funding_at while has_more — unpaid positions must finish
-- the same funding period on subsequent cron calls.

DROP FUNCTION IF EXISTS _apply_funding_for_market(TEXT, TEXT, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION _apply_funding_for_market(
  p_market          TEXT,
  p_rate            TEXT,
  p_funding_period  TIMESTAMPTZ,
  p_batch_limit     INT DEFAULT 200
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
  v_examined  INT := 0;
  v_limit     INT := _pir_sweep_batch_limit(p_batch_limit);
  v_detail    JSONB := '[]'::JSONB;
  v_err_msg   TEXT;
  v_has_more  BOOLEAN := FALSE;
BEGIN
  -- Only lock positions that still need a non-zero funding transfer for this period.
  -- Prevents has_more=true forever after a full batch of already-paid rows.
  FOR v_pos IN
    SELECT fp.*
    FROM futures_positions fp
    WHERE fp.market = p_market
      AND fp.status = 'open'
      AND _compute_funding_payment(fp.notional, p_rate, fp.side) <> 0
      AND NOT EXISTS (
        SELECT 1
          FROM wallet_ledger wl
         WHERE wl.idempotency_key =
           'funding:' || p_market || ':' || p_funding_period::TEXT || ':' || fp.id::TEXT
      )
    ORDER BY fp.id
    LIMIT v_limit
    FOR UPDATE OF fp SKIP LOCKED
  LOOP
    v_examined := v_examined + 1;
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

  IF v_examined >= v_limit THEN
    SELECT EXISTS (
      SELECT 1
        FROM futures_positions fp
       WHERE fp.market = p_market
         AND fp.status = 'open'
         AND _compute_funding_payment(fp.notional, p_rate, fp.side) <> 0
         AND NOT EXISTS (
           SELECT 1
             FROM wallet_ledger wl
            WHERE wl.idempotency_key =
              'funding:' || p_market || ':' || p_funding_period::TEXT || ':' || fp.id::TEXT
         )
    ) INTO v_has_more;
  END IF;

  RETURN jsonb_build_object(
    'market', p_market,
    'paid', v_paid,
    'skipped', v_skipped,
    'errors', v_errors,
    'examined', v_examined,
    'batch_limit', v_limit,
    'has_more', v_has_more,
    'detail', v_detail
  );
END;
$$;

REVOKE ALL ON FUNCTION _apply_funding_for_market(TEXT, TEXT, TIMESTAMPTZ, INT)
  FROM PUBLIC, anon, authenticated;

-- ─── rpc_run_funding_accrual (chunked · hold next_funding_at on has_more) ───

DROP FUNCTION IF EXISTS rpc_run_funding_accrual();

CREATE OR REPLACE FUNCTION rpc_run_funding_accrual(p_batch_limit INT DEFAULT 200)
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
  v_examined INT := 0;
  v_limit    INT := _pir_sweep_batch_limit(p_batch_limit);
  v_remaining INT;
  v_detail   JSONB := '[]'::JSONB;
  v_apply    JSONB;
  v_has_more BOOLEAN := FALSE;
BEGIN
  IF auth.role() = 'anon' OR (auth.role() = 'authenticated' AND NOT _is_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_remaining := v_limit;

  FOR v_fr IN
    SELECT * FROM funding_rates
    WHERE next_funding_at <= NOW()
    ORDER BY market
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;

    IF v_fr.rate::NUMERIC = 0 THEN
      UPDATE funding_rates
      SET next_funding_at = next_funding_at + INTERVAL '8 hours',
          updated_at = NOW()
      WHERE market = v_fr.market;
      v_advanced := v_advanced + 1;
    ELSE
      PERFORM _assert_funding_settlement_enabled();
      v_apply := _apply_funding_for_market(
        v_fr.market, v_fr.rate, v_fr.next_funding_at, v_remaining
      );
      v_settled := v_settled + COALESCE((v_apply->>'paid')::INT, 0);
      v_errors := v_errors + COALESCE((v_apply->>'errors')::INT, 0);
      v_examined := v_examined + COALESCE((v_apply->>'examined')::INT, 0);
      v_remaining := v_remaining - COALESCE((v_apply->>'examined')::INT, 0);
      v_detail := v_detail || jsonb_build_array(v_apply);

      IF COALESCE((v_apply->>'has_more')::BOOLEAN, FALSE) THEN
        -- Same funding period unfinished — do not advance schedule.
        v_has_more := TRUE;
        EXIT;
      END IF;

      UPDATE funding_rates
      SET next_funding_at = next_funding_at + INTERVAL '8 hours',
          updated_at = NOW()
      WHERE market = v_fr.market;
      v_advanced := v_advanced + 1;
    END IF;
  END LOOP;

  IF NOT v_has_more AND EXISTS (
    SELECT 1 FROM funding_rates WHERE next_funding_at <= NOW()
  ) AND v_remaining <= 0 THEN
    v_has_more := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'advanced', v_advanced,
    'settled', v_settled,
    'errors', v_errors,
    'examined', v_examined,
    'batch_limit', v_limit,
    'has_more', v_has_more,
    'detail', v_detail,
    'ran_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_funding_accrual(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_funding_accrual(INT) TO service_role;

-- Funding cron drain wrapper (replaces bare SELECT in schedule).
CREATE OR REPLACE FUNCTION _run_funding_accrual_logged()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_res JSONB;
  v_iters INT := 0;
BEGIN
  LOOP
    v_iters := v_iters + 1;
    v_res := rpc_run_funding_accrual();
    EXIT WHEN NOT COALESCE((v_res->>'has_more')::BOOLEAN, FALSE);
    EXIT WHEN v_iters >= 50;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION _run_funding_accrual_logged() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'trade-funding-accrual',
  '5 * * * *',
  $$SELECT _run_funding_accrual_logged();$$
);

-- ─── Affiliate settlements (chunked pay loop) ───────────────────────────────

DROP FUNCTION IF EXISTS rpc_run_affiliate_settlements(DATE);
DROP FUNCTION IF EXISTS _run_affiliate_settlements(DATE);

CREATE OR REPLACE FUNCTION _run_affiliate_settlements(
  p_settlement_date DATE DEFAULT CURRENT_DATE,
  p_batch_limit INT DEFAULT 200
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_date DATE := COALESCE(p_settlement_date, CURRENT_DATE);
  v_computed INT := 0;
  v_paid INT := 0;
  v_pending_approval INT := 0;
  v_examined INT := 0;
  v_limit INT := _pir_sweep_batch_limit(p_batch_limit);
  v_settlement affiliate_settlements%ROWTYPE;
  v_approval_id UUID;
  v_has_more BOOLEAN := FALSE;
BEGIN
  WITH direct_ggr AS (
    SELECT
      affiliate_id,
      currency,
      GREATEST(SUM(gross_revenue::NUMERIC), 0) AS ggr
    FROM affiliate_commission_daily_aggregates
    WHERE aggregate_date = v_date
    GROUP BY affiliate_id, currency
  ),
  direct_calc AS (
    SELECT
      dg.affiliate_id,
      dg.currency,
      dg.ggr,
      _affiliate_tier_for_settlement(dg.affiliate_id, v_date) AS tier_code,
      cfg.direct_commission_bps,
      trunc(dg.ggr * cfg.direct_commission_bps::NUMERIC / 10000, 6) AS direct_commission
    FROM direct_ggr dg
    JOIN affiliate_tier_configs cfg
      ON cfg.tier_code = _affiliate_tier_for_settlement(dg.affiliate_id, v_date)
  ),
  override_calc AS (
    SELECT
      ar.parent_id AS affiliate_id,
      dc.currency,
      SUM(dc.ggr) AS override_ggr,
      SUM(trunc(dc.ggr * parent_cfg.override_commission_bps::NUMERIC / 10000, 6)) AS override_raw,
      SUM(
        LEAST(
          GREATEST(trunc(dc.ggr * 0.5, 6) - dc.direct_commission, 0),
          trunc(dc.ggr * parent_cfg.override_commission_bps::NUMERIC / 10000, 6)
        )
      ) AS override_commission
    FROM affiliate_relationships ar
    JOIN direct_calc dc ON dc.affiliate_id = ar.child_id
    JOIN affiliate_tier_configs parent_cfg
      ON parent_cfg.tier_code = _affiliate_tier_for_settlement(ar.parent_id, v_date)
    GROUP BY ar.parent_id, dc.currency
  ),
  currency_rows AS (
    SELECT
      COALESCE(dc.affiliate_id, oc.affiliate_id) AS affiliate_id,
      COALESCE(dc.currency, oc.currency) AS currency,
      COALESCE(dc.ggr, 0) AS direct_ggr,
      COALESCE(dc.direct_commission, 0) AS direct_commission,
      COALESCE(oc.override_ggr, 0) AS override_ggr,
      COALESCE(oc.override_raw, 0) AS override_raw,
      COALESCE(oc.override_commission, 0) AS override_commission,
      COALESCE(oc.override_raw, 0) - COALESCE(oc.override_commission, 0) AS cap_reduction,
      COALESCE(dc.direct_commission, 0) + COALESCE(oc.override_commission, 0) AS total_commission
    FROM direct_calc dc
    FULL OUTER JOIN override_calc oc
      ON oc.affiliate_id = dc.affiliate_id
     AND oc.currency = dc.currency
  ),
  settlement_rows AS (
    SELECT
      affiliate_id,
      _affiliate_tier_for_settlement(affiliate_id, v_date) AS tier_code,
      jsonb_object_agg(currency::TEXT, _fmt6(direct_ggr)) AS direct_ggr,
      jsonb_object_agg(currency::TEXT, _fmt6(override_ggr)) AS override_ggr,
      jsonb_object_agg(currency::TEXT, _fmt6(direct_commission)) AS direct_commission,
      jsonb_object_agg(currency::TEXT, _fmt6(override_raw)) AS override_commission_raw,
      jsonb_object_agg(currency::TEXT, _fmt6(override_commission)) AS override_commission,
      jsonb_object_agg(currency::TEXT, _fmt6(cap_reduction)) AS cap_reduction,
      jsonb_object_agg(currency::TEXT, _fmt6(total_commission)) AS total_commission
    FROM currency_rows
    GROUP BY affiliate_id
  ),
  inserted AS (
    INSERT INTO affiliate_settlements (
      settlement_date,
      affiliate_id,
      tier_code,
      direct_ggr,
      override_ggr,
      direct_commission,
      override_commission_raw,
      override_commission,
      cap_reduction,
      total_commission
    )
    SELECT
      v_date,
      affiliate_id,
      tier_code,
      direct_ggr,
      override_ggr,
      direct_commission,
      override_commission_raw,
      override_commission,
      cap_reduction,
      total_commission
    FROM settlement_rows
    ON CONFLICT (settlement_date, affiliate_id) DO NOTHING
    RETURNING *
  )
  INSERT INTO affiliate_settlement_events (settlement_id, event_type, payload)
  SELECT id, 'computed', jsonb_build_object('settlement_date', settlement_date, 'affiliate_id', affiliate_id)
    FROM inserted;

  GET DIAGNOSTICS v_computed = ROW_COUNT;

  FOR v_settlement IN
    SELECT *
      FROM affiliate_settlements
     WHERE settlement_date = v_date
       AND state = 'computed'
     ORDER BY id
     LIMIT v_limit
     FOR UPDATE
  LOOP
    v_examined := v_examined + 1;
    IF _affiliate_commission_requires_approval(v_settlement.total_commission) THEN
      v_approval_id := _enqueue_affiliate_commission_approval(v_settlement);

      UPDATE affiliate_settlements
         SET state = 'pending_approval',
             updated_at = NOW()
       WHERE id = v_settlement.id;

      INSERT INTO affiliate_settlement_events (settlement_id, event_type, payload)
      VALUES (
        v_settlement.id,
        'pending_approval',
        jsonb_build_object(
          'settlement_date', v_date,
          'affiliate_id', v_settlement.affiliate_id,
          'approval_id', v_approval_id
        )
      );

      v_pending_approval := v_pending_approval + 1;
    ELSE
      PERFORM _pay_affiliate_settlement(v_settlement.id);
      v_paid := v_paid + 1;
    END IF;
  END LOOP;

  SELECT EXISTS (
    SELECT 1
      FROM affiliate_settlements
     WHERE settlement_date = v_date
       AND state = 'computed'
  ) INTO v_has_more;

  RETURN jsonb_build_object(
    'settlement_date', v_date,
    'computed', v_computed,
    'pending_approval', v_pending_approval,
    'paid', v_paid,
    'examined', v_examined,
    'batch_limit', v_limit,
    'has_more', v_has_more
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_run_affiliate_settlements(
  p_settlement_date DATE DEFAULT CURRENT_DATE,
  p_batch_limit INT DEFAULT 200
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN _run_affiliate_settlements(p_settlement_date, p_batch_limit);
END;
$$;

REVOKE ALL ON FUNCTION _run_affiliate_settlements(DATE, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION rpc_run_affiliate_settlements(DATE, INT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION rpc_run_affiliate_settlements(DATE, INT) TO authenticated, service_role;
