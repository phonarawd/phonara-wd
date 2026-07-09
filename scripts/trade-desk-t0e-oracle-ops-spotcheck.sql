-- T0-e oracle ops spot-check (read-only audit + PR-1B chart verify smoke)
-- Operator gate — run after T0-a~d migrations applied (local db reset or remote).
-- Usage: psql $DATABASE_URL -f scripts/trade-desk-t0e-oracle-ops-spotcheck.sql
BEGIN;

DO $$
DECLARE
  v_major_sources INT;
  v_phon_sources INT;
  v_phon_ticks INT;
  v_btc_ticks INT;
  v_phon_age NUMERIC;
  v_btc_age NUMERIC;
  v_phon_candles INT;
  v_btc_candles INT;
  v_stale_threshold INT := 300;
BEGIN
  -- Symbol coverage audit (T0-a)
  SELECT COUNT(*)::INT INTO v_major_sources
    FROM market_sources ms
    JOIN spot_markets sm ON sm.symbol = ms.internal_symbol AND sm.is_active
   WHERE ms.internal_symbol <> 'PHON_USDT'
     AND ms.provider IN ('binance', 'bybit', 'okx')
     AND ms.enabled = TRUE;
  ASSERT v_major_sources = 60,
    format('symbol coverage: expected 20 majors × 3 sources = 60, got %s', v_major_sources);

  SELECT COUNT(*)::INT INTO v_phon_sources
    FROM market_sources
   WHERE internal_symbol IN ('PHON_USDT', 'PHONUSDT-PERP')
     AND provider IN ('binance', 'bybit', 'okx')
     AND enabled = TRUE;
  ASSERT v_phon_sources = 0,
    format('PHON must not have external market_sources, got %s', v_phon_sources);

  -- Tick bootstrap (T0-c)
  SELECT COUNT(*)::INT INTO v_phon_ticks FROM price_ticks WHERE symbol = 'PHON_USDT';
  SELECT COUNT(*)::INT INTO v_btc_ticks FROM price_ticks WHERE symbol = 'BTC_USDT';
  ASSERT v_phon_ticks >= 1,
    format('PHON_USDT price_ticks must be >= 1, got %s', v_phon_ticks);
  ASSERT v_btc_ticks >= 1,
    format('BTC_USDT price_ticks must be >= 1, got %s', v_btc_ticks);

  -- Oracle freshness audit (< 300s stale)
  SELECT EXTRACT(EPOCH FROM (NOW() - updated_at)) INTO v_phon_age
    FROM oracle_prices WHERE symbol = 'PHON_USDT';
  SELECT EXTRACT(EPOCH FROM (NOW() - updated_at)) INTO v_btc_age
    FROM oracle_prices WHERE symbol = 'BTC_USDT';

  IF v_phon_age > v_stale_threshold THEN
    RAISE WARNING 'PHON_USDT oracle stale: age=%s s (threshold %s)', v_phon_age, v_stale_threshold;
  END IF;
  IF v_btc_age > v_stale_threshold THEN
    RAISE WARNING 'BTC_USDT oracle stale: age=%s s (threshold %s)', v_btc_age, v_stale_threshold;
  END IF;

  -- PR-1B chart verify: rpc_get_candles must mount chart (>= 2 bars)
  v_phon_candles := jsonb_array_length(rpc_get_candles('PHON_USDT', '1m', 10));
  v_btc_candles := jsonb_array_length(rpc_get_candles('BTC_USDT', '1m', 10));
  ASSERT v_phon_candles >= 2,
    format('PR-1B PHON chart: rpc_get_candles must return >= 2 bars, got %s', v_phon_candles);
  ASSERT v_btc_candles >= 2,
    format('PR-1B BTC chart: rpc_get_candles must return >= 2 bars, got %s', v_btc_candles);

  RAISE NOTICE 'T0-e oracle ops spot-check OK — sources=% phon_ticks=% btc_ticks=% phon_candles=% btc_candles=% phon_age_s=% btc_age_s=%',
    v_major_sources, v_phon_ticks, v_btc_ticks, v_phon_candles, v_btc_candles, v_phon_age, v_btc_age;
END;
$$;

ROLLBACK;
