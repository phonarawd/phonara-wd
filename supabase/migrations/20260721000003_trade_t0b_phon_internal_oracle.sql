-- ============================================================
-- Migration: 20260721000003_trade_t0b_phon_internal_oracle.sql
-- Trade Wave T0-b: PHON internal oracle (S3 — cron + admin override + PERP mirror)
-- ============================================================
-- PHON_USDT has no external market_sources (T0-a). Internal pg_cron re-publishes
-- the current mark every minute (tick append + freshness). PHONUSDT-PERP mirrors
-- PHON_USDT on every successful PHON mark update (cron or admin).
-- ============================================================

SET search_path = public, pg_temp;

INSERT INTO app_config (key, value, description, is_public)
VALUES
  (
    'phon_internal_oracle_enabled',
    'true',
    'When true, phonara_phon_internal_oracle cron re-publishes PHON_USDT mark every minute.',
    FALSE
  ),
  (
    'phon_internal_oracle_tick_seconds',
    '60',
    'PHON internal oracle cron interval in seconds (S3: 1 minute).',
    FALSE
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = FALSE,
  updated_at = NOW();

-- ─── Internal helper: mirror PHON spot mark to PHON perp ─────────────────────

CREATE OR REPLACE FUNCTION _mirror_phon_usdt_perp_mark(
  p_price  TEXT,
  p_source TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mirror_source TEXT := 'mirror:PHON_USDT';
  v_result        JSONB;
BEGIN
  IF p_source IS NOT NULL AND p_source <> '' THEN
    v_mirror_source := 'mirror:' || p_source;
  END IF;

  BEGIN
    v_result := rpc_update_oracle_price('PHONUSDT-PERP', p_price, p_reason, v_mirror_source);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'symbol', 'PHONUSDT-PERP',
        'ok', FALSE,
        'reason', SQLERRM,
        'mirror_failed', TRUE
      );
  END;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION _mirror_phon_usdt_perp_mark(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Extend rpc_update_oracle_price: PHON_USDT → PERP mirror on success ───────

CREATE OR REPLACE FUNCTION rpc_update_oracle_price(
  p_symbol TEXT,
  p_price  TEXT,
  p_reason TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id   UUID := auth.uid();
  v_old_price  NUMERIC;
  v_new_price  NUMERIC := p_price::NUMERIC;
  v_change_pct NUMERIC;
  v_cb         market_circuit_breakers%ROWTYPE;
  v_result     JSONB;
BEGIN
  IF v_actor_id IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF v_new_price <= 0 THEN RAISE EXCEPTION 'invalid_price'; END IF;
  IF p_source = 'admin' AND p_reason IS NULL THEN
    RAISE EXCEPTION 'admin_price_update_requires_reason';
  END IF;

  SELECT * INTO v_cb FROM market_circuit_breakers WHERE symbol = p_symbol FOR UPDATE;
  IF v_cb.is_halted THEN
    RAISE EXCEPTION 'market_halted' USING HINT = p_symbol;
  END IF;

  SELECT price::NUMERIC INTO v_old_price FROM oracle_prices WHERE symbol = p_symbol;

  IF v_old_price IS NOT NULL AND v_old_price > 0 THEN
    v_change_pct := abs((v_new_price / v_old_price - 1) * 100);
    IF v_change_pct > v_cb.max_tick_pct THEN
      UPDATE market_circuit_breakers SET
        is_halted = TRUE,
        halt_reason = 'price_move_' || round(v_change_pct, 4)::TEXT || 'pct_exceeds_limit_'
                      || round(v_cb.max_tick_pct, 2)::TEXT || 'pct',
        halted_at = NOW(),
        price_at_halt = v_old_price::TEXT,
        updated_at = NOW()
      WHERE symbol = p_symbol;

      UPDATE futures_markets SET is_active = FALSE WHERE symbol = p_symbol;
      UPDATE spot_markets     SET is_active = FALSE WHERE symbol = p_symbol;

      INSERT INTO price_change_audit (symbol, price_before, price_after, change_pct, source, actor_id, reason, circuit_breaker_triggered)
      VALUES (p_symbol, v_old_price::TEXT, p_price, v_change_pct, p_source, v_actor_id, p_reason, TRUE);

      RETURN jsonb_build_object(
        'symbol', p_symbol,
        'price', v_old_price::TEXT,
        'rejected_price', p_price,
        'change_pct', v_change_pct,
        'circuit_breaker_triggered', TRUE,
        'market_halted', TRUE
      );
    END IF;
  END IF;

  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES (p_symbol, p_price, NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  INSERT INTO price_ticks (symbol, price) VALUES (p_symbol, p_price);

  INSERT INTO price_change_audit (symbol, price_before, price_after, change_pct, source, actor_id, reason, circuit_breaker_triggered)
  VALUES (p_symbol, v_old_price::TEXT, p_price, v_change_pct, p_source, v_actor_id, p_reason, FALSE);

  v_result := jsonb_build_object(
    'symbol', p_symbol,
    'price', p_price,
    'change_pct', v_change_pct,
    'circuit_breaker_triggered', FALSE
  );

  IF p_symbol = 'PHON_USDT' THEN
    v_result := v_result || jsonb_build_object(
      'perp_mirror', _mirror_phon_usdt_perp_mark(p_price, p_source, p_reason)
    );
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION rpc_update_oracle_price(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_update_oracle_price(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ─── Internal cron runner (service_role) ────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_run_phon_internal_oracle()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_enabled TEXT;
  v_price   TEXT;
BEGIN
  SELECT value INTO v_enabled FROM app_config WHERE key = 'phon_internal_oracle_enabled';
  IF COALESCE(v_enabled, 'true') <> 'true' THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'disabled');
  END IF;

  SELECT price INTO v_price FROM oracle_prices WHERE symbol = 'PHON_USDT';
  IF v_price IS NULL OR v_price::NUMERIC <= 0 THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'no_phon_mark');
  END IF;

  RETURN rpc_update_oracle_price('PHON_USDT', v_price, NULL, 'internal:cron')
      || jsonb_build_object('ok', TRUE, 'source', 'internal:cron');
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_phon_internal_oracle() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_phon_internal_oracle() TO service_role;

CREATE OR REPLACE FUNCTION _run_phon_internal_oracle_logged()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_res JSONB;
BEGIN
  v_res := rpc_run_phon_internal_oracle();
  IF COALESCE((v_res->>'ok')::BOOLEAN, FALSE) = FALSE
     AND COALESCE(v_res->>'reason', '') NOT IN ('disabled', 'no_phon_mark') THEN
    INSERT INTO liquidation_run_log (liquidated, skipped, errors, duration_ms, detail)
    VALUES (0, 0, 1, 0, jsonb_build_array(v_res));
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _run_phon_internal_oracle_logged() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('phonara_phon_internal_oracle')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'phonara_phon_internal_oracle');

SELECT cron.schedule(
  'phonara_phon_internal_oracle',
  '* * * * *',
  $$SELECT _run_phon_internal_oracle_logged();$$
);
