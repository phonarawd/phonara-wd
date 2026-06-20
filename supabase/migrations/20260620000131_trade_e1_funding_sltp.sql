-- ============================================================
-- Migration: 20260620000131_trade_e1_funding_sltp
-- Trade Wave E1: margin_mode · funding_rates/payments · SL/TP cron
-- ============================================================

SET search_path = public, pg_temp;

-- ─── margin_mode on futures_positions ────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'margin_mode') THEN
    CREATE TYPE margin_mode AS ENUM ('isolated', 'cross');
  END IF;
END $$;

ALTER TABLE futures_positions
  ADD COLUMN IF NOT EXISTS margin_mode margin_mode NOT NULL DEFAULT 'isolated';

-- ─── funding_rates (display + settlement schedule) ───────────────────────────

CREATE TABLE IF NOT EXISTS funding_rates (
  market           TEXT PRIMARY KEY REFERENCES futures_markets(symbol) ON DELETE RESTRICT,
  rate             TEXT NOT NULL DEFAULT '0'
    CONSTRAINT fr_rate_fmt CHECK (rate ~ '^-?\d+(\.\d+)?$'),
  next_funding_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '8 hours'),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO funding_rates (market, rate, next_funding_at)
SELECT fm.symbol, '0.000100', NOW() + INTERVAL '8 hours'
FROM futures_markets fm
WHERE fm.is_active
ON CONFLICT (market) DO NOTHING;

-- ─── funding_payments (append-only history) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS funding_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  position_id  UUID NOT NULL REFERENCES futures_positions(id) ON DELETE RESTRICT,
  market       TEXT NOT NULL REFERENCES futures_markets(symbol) ON DELETE RESTRICT,
  amount       TEXT NOT NULL
    CONSTRAINT fpay_amt_fmt CHECK (amount ~ '^-?\d+(\.\d+)?$'),
  currency     currency NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS funding_payments_user_idx ON funding_payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS funding_payments_position_idx ON funding_payments (position_id);

ALTER TABLE funding_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read funding_rates" ON funding_rates;
CREATE POLICY "authenticated read funding_rates" ON funding_rates
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "user read own funding_payments" ON funding_payments;
CREATE POLICY "user read own funding_payments" ON funding_payments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

REVOKE ALL ON funding_rates FROM PUBLIC, anon, authenticated;
GRANT SELECT ON funding_rates TO authenticated;

REVOKE ALL ON funding_payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON funding_payments TO authenticated;

-- ─── Stop trigger helper ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _position_stop_triggered(
  p_side position_side,
  p_mark NUMERIC,
  p_stop_loss TEXT,
  p_take_profit TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_side = 'long' THEN
      (p_stop_loss IS NOT NULL AND p_mark <= p_stop_loss::NUMERIC)
      OR (p_take_profit IS NOT NULL AND p_mark >= p_take_profit::NUMERIC)
    WHEN p_side = 'short' THEN
      (p_stop_loss IS NOT NULL AND p_mark >= p_stop_loss::NUMERIC)
      OR (p_take_profit IS NOT NULL AND p_mark <= p_take_profit::NUMERIC)
    ELSE FALSE
  END;
$$;

REVOKE ALL ON FUNCTION _position_stop_triggered(position_side, NUMERIC, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── rpc_run_stop_orders (service/cron only) ─────────────────────────────────

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
        AND (stop_loss IS NOT NULL OR take_profit IS NOT NULL)
      FOR UPDATE SKIP LOCKED
    LOOP
      IF NOT _position_stop_triggered(v_pos.side, v_mark, v_pos.stop_loss, v_pos.take_profit) THEN
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

-- ─── Funding accrual (zero-rate safe; advances schedule only when rate = 0) ───

CREATE OR REPLACE FUNCTION rpc_run_funding_accrual()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fr       funding_rates%ROWTYPE;
  v_advanced INT := 0;
BEGIN
  IF auth.role() = 'anon' OR (auth.role() = 'authenticated' AND NOT _is_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_fr IN
    SELECT * FROM funding_rates WHERE next_funding_at <= NOW()
  LOOP
    IF v_fr.rate::NUMERIC = 0 THEN
      UPDATE funding_rates
      SET next_funding_at = next_funding_at + INTERVAL '8 hours',
          updated_at = NOW()
      WHERE market = v_fr.market;
      v_advanced := v_advanced + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('advanced', v_advanced, 'ran_at', NOW());
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_funding_accrual() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_funding_accrual() TO service_role;

-- ─── Cron wrappers ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _run_stop_orders_logged()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_res JSONB;
  v_closed INT;
  v_err INT;
BEGIN
  v_res := rpc_run_stop_orders();
  v_closed := COALESCE((v_res->>'closed')::INT, 0);
  v_err := COALESCE((v_res->>'errors')::INT, 0);
  IF v_closed > 0 OR v_err > 0 THEN
    INSERT INTO liquidation_run_log (liquidated, skipped, errors, duration_ms, detail)
    VALUES (
      v_closed,
      COALESCE((v_res->>'skipped')::INT, 0),
      v_err,
      0,
      COALESCE(v_res->'detail', '[]'::JSONB)
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _run_stop_orders_logged() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'trade-stop-orders',
  '* * * * *',
  $$SELECT _run_stop_orders_logged();$$
);

SELECT cron.schedule(
  'trade-funding-accrual',
  '5 * * * *',
  $$SELECT rpc_run_funding_accrual();$$
);
