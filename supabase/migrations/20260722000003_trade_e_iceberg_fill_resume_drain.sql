-- Trade Phase E follow-up: first iceberg slice per tick · drain remainder on resume
-- Append-only fix — do not edit 20260722000002_trade_e_iceberg_fill_slice_loop.sql

CREATE OR REPLACE FUNCTION rpc_run_open_order_fills()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order           trading_open_orders%ROWTYPE;
  v_mark            NUMERIC;
  v_filled          INT := 0;
  v_triggered       INT := 0;
  v_skipped         INT := 0;
  v_errors          INT := 0;
  v_cancelled       INT := 0;
  v_detail          JSONB := '[]'::JSONB;
  v_err_msg         TEXT;
  v_res             JSONB;
  v_fillable        BOOLEAN;
  v_slice_iters     INT;
  v_max_slices      INT := 10000;
  v_entry_status    order_status;
  v_drain_remainder BOOLEAN;
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

    v_entry_status := v_order.status;
    v_drain_remainder := v_order.display_quantity IS NOT NULL AND v_entry_status = 'partially_filled';

    BEGIN
      v_slice_iters := 0;
      LOOP
        v_slice_iters := v_slice_iters + 1;
        IF v_slice_iters > v_max_slices THEN
          RAISE EXCEPTION 'iceberg_slice_limit_exceeded';
        END IF;

        v_res := _fill_house_order(v_order.id);
        v_filled := v_filled + 1;
        v_detail := v_detail || jsonb_build_object(
          'order_id', v_order.id,
          'position_id', v_res->>'position_id',
          'market', v_order.market,
          'status', v_res->>'status'
        );

        EXIT WHEN (v_res->>'status') = 'filled';
        EXIT WHEN NOT v_drain_remainder;
      END LOOP;
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
