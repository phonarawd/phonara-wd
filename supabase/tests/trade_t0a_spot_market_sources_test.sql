-- ============================================================
-- Trade T0-a sub-gate: spot majors market_sources registry
-- ============================================================
-- Proves T0-a migration seeds 20 active spot majors × 3 providers = 60 rows,
-- excludes PHON external feed mapping, and spot median path updates oracle_prices.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_active_spot INT;
  v_major_count INT;
  v_spot_source_count INT;
  v_phon_source_count INT;
  v_perp_source_count INT;
  v_three_source_majors INT;
  v_res JSONB;
  v_price TEXT;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);

  SELECT COUNT(*)::INT INTO v_active_spot
    FROM spot_markets
   WHERE is_active;
  ASSERT v_active_spot >= 21,
    format('spot_markets must include PHON + 20 majors (>=21 active), got %s', v_active_spot);

  SELECT COUNT(*)::INT INTO v_major_count
    FROM spot_markets
   WHERE is_active
     AND symbol <> 'PHON_USDT';
  ASSERT v_major_count = 20,
    format('T0-a expects exactly 20 active spot majors excluding PHON, got %s', v_major_count);

  SELECT COUNT(*)::INT INTO v_spot_source_count
    FROM market_sources ms
    JOIN spot_markets sm
      ON sm.symbol = ms.internal_symbol
     AND sm.is_active
   WHERE ms.internal_symbol <> 'PHON_USDT'
     AND ms.provider IN ('binance', 'bybit', 'okx')
     AND ms.enabled = TRUE;
  ASSERT v_spot_source_count = 60,
    format('spot majors must have 20×3=60 enabled market_sources rows, got %s', v_spot_source_count);

  SELECT COUNT(*)::INT INTO v_phon_source_count
    FROM market_sources
   WHERE internal_symbol = 'PHON_USDT'
     AND provider IN ('binance', 'bybit', 'okx')
     AND enabled = TRUE;
  ASSERT v_phon_source_count = 0,
    format('PHON_USDT must not have external market_sources, got %s', v_phon_source_count);

  SELECT COUNT(*)::INT INTO v_perp_source_count
    FROM market_sources
   WHERE internal_symbol = 'PHONUSDT-PERP'
     AND provider IN ('binance', 'bybit', 'okx')
     AND enabled = TRUE;
  ASSERT v_perp_source_count = 0,
    format('PHONUSDT-PERP must not have external market_sources, got %s', v_perp_source_count);

  SELECT COUNT(*)::INT INTO v_three_source_majors
    FROM (
      SELECT ms.internal_symbol
        FROM market_sources ms
        JOIN spot_markets sm
          ON sm.symbol = ms.internal_symbol
         AND sm.is_active
       WHERE ms.internal_symbol <> 'PHON_USDT'
         AND ms.provider IN ('binance', 'bybit', 'okx')
         AND ms.enabled = TRUE
       GROUP BY ms.internal_symbol
      HAVING COUNT(*) = 3
    ) t;
  ASSERT v_three_source_majors = 20,
    format('each of 20 spot majors must have exactly 3 enabled sources, got %s symbols', v_three_source_majors);

  -- Spot median path: BTC_USDT two-source update (mirrors oracle_feed_test BTCUSDT-SIM).
  DELETE FROM oracle_source_prices WHERE symbol = 'BTC_USDT';
  UPDATE market_circuit_breakers
     SET is_halted = FALSE,
         max_tick_pct = 10.0,
         staleness_seconds = 300,
         halt_reason = NULL,
         halted_at = NULL,
         price_at_halt = NULL,
         resumed_at = NULL,
         updated_at = NOW()
   WHERE symbol = 'BTC_USDT';
  UPDATE spot_markets SET is_active = TRUE WHERE symbol = 'BTC_USDT';
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('BTC_USDT', '68000.000000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

  v_res := rpc_submit_oracle_source_price('BTC_USDT', '68000.100000', 'binance');
  ASSERT (v_res->>'ok')::BOOLEAN = FALSE AND v_res->>'reason' = 'insufficient_sources',
    format('BTC_USDT one source must be stored but insufficient, got %s', v_res);

  v_res := rpc_submit_oracle_source_price('BTC_USDT', '68000.300000', 'bybit');
  ASSERT COALESCE((v_res->>'circuit_breaker_triggered')::BOOLEAN, FALSE) = FALSE,
    format('BTC_USDT two-source median must not trip circuit breaker, got %s', v_res);
  ASSERT v_res->>'computed_median' = '68000.200000',
    format('BTC_USDT two-source median mismatch, got %s', v_res);

  SELECT price INTO v_price FROM oracle_prices WHERE symbol = 'BTC_USDT';
  ASSERT v_price = '68000.200000',
    format('BTC_USDT oracle price must equal spot median, got %s', v_price);
END;
$$;

ROLLBACK;
