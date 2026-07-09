-- ============================================================
-- Migration: 20260721000002_trade_t0a_spot_market_sources.sql
-- Trade Wave T0-a: spot majors market_sources (display+settlement oracle feed)
-- ============================================================
-- Seeds 20 active spot majors (PHON_USDT excluded) × binance/bybit/okx.
-- Idempotent ON CONFLICT — safe to re-apply. PHON remains T0-b internal oracle.
-- ============================================================

SET search_path = public, pg_temp;

DO $$
DECLARE
  v_base TEXT;
  v_spot TEXT;
  v_bases TEXT[] := ARRAY[
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT',
    'MATIC', 'LTC', 'UNI', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'INJ', 'SUI'
  ];
BEGIN
  FOREACH v_base IN ARRAY v_bases LOOP
    v_spot := v_base || '_USDT';

    IF NOT EXISTS (
      SELECT 1 FROM spot_markets WHERE symbol = v_spot AND is_active
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO market_sources (internal_symbol, provider, provider_symbol, weight, enabled)
    VALUES
      (v_spot, 'binance', v_base || 'USDT', '1', TRUE),
      (v_spot, 'bybit',   v_base || 'USDT', '1', TRUE),
      (v_spot, 'okx',     v_base || '-USDT', '1', TRUE)
    ON CONFLICT (internal_symbol, provider) DO UPDATE SET
      provider_symbol = EXCLUDED.provider_symbol,
      weight = EXCLUDED.weight,
      enabled = EXCLUDED.enabled,
      updated_at = NOW();

    INSERT INTO app_config (key, value, description, is_public)
    VALUES (
      'oracle_min_sources:' || v_spot,
      '2',
      'Minimum non-stale oracle sources required for ' || v_spot || ' median updates.',
      FALSE
    )
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      description = EXCLUDED.description,
      is_public = FALSE,
      updated_at = NOW();
  END LOOP;
END
$$;
