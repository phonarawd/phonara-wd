-- ============================================================
-- Oracle feed integration test
-- ============================================================
-- Proves the external-feed receiver path without durable residue:
--   * seeded BTC/ETH 3-source registry is present and PHON is excluded;
--   * service_role source submissions update via median only when enough
--     non-stale sources exist;
--   * outliers are rejected by _compute_oracle_median;
--   * circuit-breaker halts reject the median without updating oracle_prices;
--   * anon/authenticated cannot call the feed submission RPC directly.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_res JSONB;
  v_price TEXT;
  v_seed_count INT;
  v_phon_seed_count INT;
  v_ticks_before INT;
  v_ticks_after INT;
  v_audit_before INT;
  v_audit_after INT;
  v_alert_count INT;
  v_halted BOOLEAN;
  v_active BOOLEAN;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);

  SELECT COUNT(*)::INT INTO v_seed_count
    FROM market_sources
   WHERE internal_symbol IN ('BTCUSDT-SIM', 'ETHUSDT-SIM')
     AND provider IN ('binance', 'bybit', 'okx')
     AND enabled = TRUE;
  ASSERT v_seed_count = 6, format('BTC/ETH must have exactly six enabled 3-source mappings, got %s', v_seed_count);

  SELECT COUNT(*)::INT INTO v_phon_seed_count
    FROM market_sources
   WHERE internal_symbol IN ('PHONUSDT-PERP', 'PHON_USDT')
     AND provider IN ('binance', 'bybit', 'okx')
     AND enabled = TRUE;
  ASSERT v_phon_seed_count = 0, format('PHON markets must not be external-feed mapped, got %s', v_phon_seed_count);

  SELECT COUNT(*)::INT INTO v_seed_count
    FROM market_sources
   WHERE internal_symbol = 'SOLUSDT-SIM'
     AND provider IN ('binance', 'bybit', 'okx')
     AND enabled = TRUE;
  ASSERT v_seed_count = 3, format('SOL must have exactly three enabled sources, got %s', v_seed_count);

  SELECT COUNT(*)::INT INTO v_seed_count
    FROM oracle_source_prices
   WHERE symbol IN ('BTCUSDT-SIM', 'ETHUSDT-SIM')
     AND source_name = 'legacy';
  ASSERT v_seed_count = 0, format('external BTC/ETH feed must not include legacy median source rows, got %s', v_seed_count);

  INSERT INTO app_config (key, value, description, is_public)
  VALUES
    ('oracle_staleness_seconds', '300', 'Oracle feed test staleness window.', FALSE),
    ('oracle_min_sources', '1', 'Oracle feed test global fallback.', FALSE),
    ('oracle_outlier_pct', '5', 'Oracle feed test outlier threshold.', FALSE),
    ('oracle_min_sources:BTCUSDT-SIM', '2', 'Oracle feed test BTC minimum.', FALSE),
    ('oracle_min_sources:ETHUSDT-SIM', '2', 'Oracle feed test ETH minimum.', FALSE)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description,
        is_public = EXCLUDED.is_public,
        updated_at = NOW();

  -- BTC median path: one source stores but does not update; two/three sources update.
  DELETE FROM oracle_source_prices WHERE symbol = 'BTCUSDT-SIM';
  UPDATE market_circuit_breakers
     SET is_halted = FALSE,
         max_tick_pct = 10.0,
         staleness_seconds = 300,
         halt_reason = NULL,
         halted_at = NULL,
         price_at_halt = NULL,
         resumed_at = NULL,
         updated_at = NOW()
   WHERE symbol = 'BTCUSDT-SIM';
  UPDATE futures_markets SET is_active = TRUE WHERE symbol = 'BTCUSDT-SIM';
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('BTCUSDT-SIM', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

  SELECT COUNT(*)::INT INTO v_ticks_before FROM price_ticks WHERE symbol = 'BTCUSDT-SIM';
  SELECT COUNT(*)::INT INTO v_audit_before FROM price_change_audit WHERE symbol = 'BTCUSDT-SIM';

  v_res := rpc_submit_oracle_source_price('BTCUSDT-SIM', '68000.100000', 'binance');
  ASSERT (v_res->>'ok')::BOOLEAN = FALSE AND v_res->>'reason' = 'insufficient_sources',
    format('BTC one source must be stored but insufficient, got %s', v_res);
  SELECT price INTO v_price FROM oracle_prices WHERE symbol = 'BTCUSDT-SIM';
  ASSERT v_price = '68000.000000', format('BTC one source must not update oracle price, got %s', v_price);

  v_res := rpc_submit_oracle_source_price('BTCUSDT-SIM', '68000.300000', 'bybit');
  ASSERT COALESCE((v_res->>'circuit_breaker_triggered')::BOOLEAN, FALSE) = FALSE,
    format('BTC two-source median must not trip circuit breaker, got %s', v_res);
  ASSERT v_res->>'computed_median' = '68000.200000',
    format('BTC two-source median mismatch, got %s', v_res);

  v_res := rpc_submit_oracle_source_price('BTCUSDT-SIM', '68000.500000', 'okx');
  ASSERT v_res->>'computed_median' = '68000.300000',
    format('BTC three-source median mismatch, got %s', v_res);
  SELECT price INTO v_price FROM oracle_prices WHERE symbol = 'BTCUSDT-SIM';
  ASSERT v_price = '68000.300000', format('BTC oracle price must equal final median, got %s', v_price);

  SELECT COUNT(*)::INT INTO v_ticks_after FROM price_ticks WHERE symbol = 'BTCUSDT-SIM';
  SELECT COUNT(*)::INT INTO v_audit_after FROM price_change_audit WHERE symbol = 'BTCUSDT-SIM';
  ASSERT v_ticks_after >= v_ticks_before + 2,
    format('BTC two successful median updates must append price_ticks, before=%s after=%s', v_ticks_before, v_ticks_after);
  ASSERT v_audit_after >= v_audit_before + 2,
    format('BTC two successful median updates must append price audit rows, before=%s after=%s', v_audit_before, v_audit_after);

  -- Single-source alert path still exists for symbols governed by global min_sources=1.
  DELETE FROM oracle_source_prices WHERE symbol = 'ORACLE_FEED_SINGLE';
  DELETE FROM ops_alerts WHERE dedupe_key = 'oracle_single_source:ORACLE_FEED_SINGLE';
  INSERT INTO market_circuit_breakers (symbol, is_halted, max_tick_pct, staleness_seconds)
  VALUES ('ORACLE_FEED_SINGLE', FALSE, 10.0, 300)
  ON CONFLICT (symbol) DO UPDATE
    SET is_halted = FALSE,
        max_tick_pct = 10.0,
        staleness_seconds = 300,
        halt_reason = NULL,
        halted_at = NULL,
        price_at_halt = NULL,
        updated_at = NOW();
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('ORACLE_FEED_SINGLE', '10.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;
  DELETE FROM app_config WHERE key = 'oracle_min_sources:ORACLE_FEED_SINGLE';

  PERFORM rpc_submit_oracle_source_price('ORACLE_FEED_SINGLE', '10.000001', 'binance');
  SELECT COUNT(*)::INT INTO v_alert_count
    FROM ops_alerts
   WHERE dedupe_key = 'oracle_single_source:ORACLE_FEED_SINGLE'
     AND source_check_id = 'oracle_single_source'
     AND status = 'open';
  ASSERT v_alert_count = 1, format('global min_sources=1 must still open single-source alert, got %s', v_alert_count);

  -- ETH outlier rejection: a far OKX price must not move the median away from two valid sources.
  DELETE FROM oracle_source_prices WHERE symbol = 'ETHUSDT-SIM';
  UPDATE market_circuit_breakers
     SET is_halted = FALSE,
         max_tick_pct = 10.0,
         staleness_seconds = 300,
         halt_reason = NULL,
         halted_at = NULL,
         price_at_halt = NULL,
         resumed_at = NULL,
         updated_at = NOW()
   WHERE symbol = 'ETHUSDT-SIM';
  UPDATE futures_markets SET is_active = TRUE WHERE symbol = 'ETHUSDT-SIM';
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('ETHUSDT-SIM', '3500.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

  PERFORM rpc_submit_oracle_source_price('ETHUSDT-SIM', '3500.000000', 'binance');
  PERFORM rpc_submit_oracle_source_price('ETHUSDT-SIM', '3501.000000', 'bybit');
  v_res := rpc_submit_oracle_source_price('ETHUSDT-SIM', '10000.000000', 'okx');
  ASSERT v_res->>'computed_median' = '3500.500000',
    format('ETH outlier must be excluded from median, got %s', v_res);
  SELECT price INTO v_price FROM oracle_prices WHERE symbol = 'ETHUSDT-SIM';
  ASSERT v_price = '3500.500000', format('ETH oracle price must remain valid median, got %s', v_price);

  -- Circuit breaker: two valid sources produce a median outside the tick limit and halt the market.
  DELETE FROM oracle_source_prices WHERE symbol = 'BTCUSDT-SIM';
  UPDATE market_circuit_breakers
     SET is_halted = FALSE,
         max_tick_pct = 1.0,
         staleness_seconds = 300,
         halt_reason = NULL,
         halted_at = NULL,
         price_at_halt = NULL,
         resumed_at = NULL,
         updated_at = NOW()
   WHERE symbol = 'BTCUSDT-SIM';
  UPDATE futures_markets SET is_active = TRUE WHERE symbol = 'BTCUSDT-SIM';
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('BTCUSDT-SIM', '100.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

  PERFORM rpc_submit_oracle_source_price('BTCUSDT-SIM', '200.000000', 'binance');
  v_res := rpc_submit_oracle_source_price('BTCUSDT-SIM', '200.000000', 'bybit');
  ASSERT COALESCE((v_res->>'circuit_breaker_triggered')::BOOLEAN, FALSE) = TRUE,
    format('large median move must trigger circuit breaker, got %s', v_res);
  SELECT price INTO v_price FROM oracle_prices WHERE symbol = 'BTCUSDT-SIM';
  ASSERT v_price = '100.000000', format('circuit breaker must leave BTC oracle price unchanged, got %s', v_price);
  SELECT is_halted INTO v_halted FROM market_circuit_breakers WHERE symbol = 'BTCUSDT-SIM';
  ASSERT v_halted = TRUE, 'circuit breaker must halt BTC market';
  SELECT is_active INTO v_active FROM futures_markets WHERE symbol = 'BTCUSDT-SIM';
  ASSERT v_active = FALSE, 'circuit breaker must deactivate BTC futures market';
END;
$$;

DO $$
BEGIN
  ASSERT NOT has_function_privilege(
    'anon',
    'public.rpc_submit_oracle_source_price(text,text,text)',
    'EXECUTE'
  ), 'anon must not have EXECUTE on rpc_submit_oracle_source_price';
  ASSERT NOT has_function_privilege(
    'authenticated',
    'public.rpc_submit_oracle_source_price(text,text,text)',
    'EXECUTE'
  ), 'authenticated must not have EXECUTE on rpc_submit_oracle_source_price';
END;
$$;

ROLLBACK;
