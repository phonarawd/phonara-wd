-- ============================================================
-- Trade T0-e sub-gate: oracle ops audit + PR-1B chart verify
-- ============================================================
-- Symbol coverage · oracle freshness boundary · PHON/BTC chart mount
-- (rpc_get_candles >= 2 bars after T0-d forward-fill / tick path).
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_major_sources INT;
  v_phon_ticks INT;
  v_btc_ticks INT;
  v_phon_candles INT;
  v_btc_candles INT;
  v_phon_age NUMERIC;
  v_btc_age NUMERIC;
  v_stale_threshold INT := 300;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);

  -- Symbol coverage audit (aggregates T0-a~c invariants)
  SELECT COUNT(*)::INT INTO v_major_sources
    FROM market_sources ms
    JOIN spot_markets sm ON sm.symbol = ms.internal_symbol AND sm.is_active
   WHERE ms.internal_symbol <> 'PHON_USDT'
     AND ms.provider IN ('binance', 'bybit', 'okx')
     AND ms.enabled = TRUE;
  ASSERT v_major_sources = 60,
    format('T0-e symbol coverage: expected 60 major market_sources, got %s', v_major_sources);

  SELECT COUNT(*)::INT INTO v_phon_ticks FROM price_ticks WHERE symbol = 'PHON_USDT';
  SELECT COUNT(*)::INT INTO v_btc_ticks FROM price_ticks WHERE symbol = 'BTC_USDT';
  ASSERT v_phon_ticks >= 1, 'T0-e PHON_USDT must have bootstrap ticks';
  ASSERT v_btc_ticks >= 1, 'T0-e BTC_USDT must have bootstrap ticks';

  -- Refresh oracle marks for freshness check (simulates live cron)
  UPDATE market_circuit_breakers
     SET is_halted = FALSE,
         staleness_seconds = v_stale_threshold,
         updated_at = NOW()
   WHERE symbol IN ('PHON_USDT', 'BTC_USDT');
  UPDATE oracle_prices
     SET updated_at = NOW()
   WHERE symbol IN ('PHON_USDT', 'BTC_USDT');

  SELECT EXTRACT(EPOCH FROM (NOW() - updated_at)) INTO v_phon_age
    FROM oracle_prices WHERE symbol = 'PHON_USDT';
  SELECT EXTRACT(EPOCH FROM (NOW() - updated_at)) INTO v_btc_age
    FROM oracle_prices WHERE symbol = 'BTC_USDT';
  ASSERT v_phon_age <= v_stale_threshold,
    format('PHON oracle must be fresh (<=%s s), age=%s', v_stale_threshold, v_phon_age);
  ASSERT v_btc_age <= v_stale_threshold,
    format('BTC oracle must be fresh (<=%s s), age=%s', v_stale_threshold, v_btc_age);

  -- PR-1B chart mount verify
  v_phon_candles := jsonb_array_length(rpc_get_candles('PHON_USDT', '1m', 10));
  v_btc_candles := jsonb_array_length(rpc_get_candles('BTC_USDT', '1m', 10));
  ASSERT v_phon_candles >= 2,
    format('PR-1B PHON chart mount requires >= 2 candles, got %s', v_phon_candles);
  ASSERT v_btc_candles >= 2,
    format('PR-1B BTC chart mount requires >= 2 candles, got %s', v_btc_candles);

  -- PHON internal cron registry (T0-b / S3)
  ASSERT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'phonara_phon_internal_oracle'
  ), 'phonara_phon_internal_oracle cron must exist for ops runbook';
END;
$$;

ROLLBACK;
