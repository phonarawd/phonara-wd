-- ============================================================
-- Trade majors Tier-1: futures catalog + oracle feed registry
-- ============================================================
-- Seeds 20 major SIM-PERP markets (BTC/ETH already exist — upsert).
-- PHON perp remains internal-oracle only (no market_sources).
-- ============================================================

SET search_path = public, pg_temp;

DO $$
DECLARE
  v_base TEXT;
  v_symbol TEXT;
  v_sort INT := 40;
  v_price TEXT;
  v_bases TEXT[] := ARRAY[
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT',
    'MATIC', 'LTC', 'UNI', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'INJ', 'SUI'
  ];
  v_prices JSONB := '{
    "BTC": "68000.000000",
    "ETH": "3500.000000",
    "SOL": "150.000000",
    "BNB": "600.000000",
    "XRP": "0.550000",
    "ADA": "0.450000",
    "DOGE": "0.120000",
    "AVAX": "35.000000",
    "LINK": "15.000000",
    "DOT": "7.000000",
    "MATIC": "0.550000",
    "LTC": "85.000000",
    "UNI": "8.000000",
    "ATOM": "8.000000",
    "NEAR": "5.000000",
    "APT": "8.000000",
    "ARB": "0.800000",
    "OP": "1.500000",
    "INJ": "20.000000",
    "SUI": "3.000000"
  }'::JSONB;
  v_precision INT;
  v_tick TEXT;
BEGIN
  FOREACH v_base IN ARRAY v_bases LOOP
    v_symbol := v_base || 'USDT-SIM';

    IF v_base IN ('BTC', 'ETH') THEN
      v_sort := CASE v_base WHEN 'BTC' THEN 20 WHEN 'ETH' THEN 30 END;
    ELSE
      v_sort := v_sort + 10;
    END IF;

    IF v_base IN ('BTC', 'ETH', 'BNB', 'LTC') THEN
      v_precision := 2;
      v_tick := '0.01';
    ELSIF v_base IN ('XRP', 'ADA', 'DOGE', 'MATIC', 'ARB', 'OP', 'SUI') THEN
      v_precision := 4;
      v_tick := '0.0001';
    ELSE
      v_precision := 3;
      v_tick := '0.001';
    END IF;

    v_price := v_prices ->> v_base;

    INSERT INTO futures_markets (
      symbol, base_label, max_leverage, open_fee_rate, close_fee_rate,
      maintenance_margin_rate, is_active, display_name, sort_order,
      price_precision, tick_size, min_notional, max_open_interest
    ) VALUES (
      v_symbol, v_base, '20', '0.0006', '0.0006', '0.005', TRUE,
      v_base || ' Perpetual', v_sort, v_precision, v_tick,
      '1.000000', '500000.000000'
    )
    ON CONFLICT (symbol) DO UPDATE SET
      base_label = EXCLUDED.base_label,
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      price_precision = EXCLUDED.price_precision,
      tick_size = EXCLUDED.tick_size,
      min_notional = EXCLUDED.min_notional,
      max_open_interest = EXCLUDED.max_open_interest,
      is_active = TRUE;

    INSERT INTO oracle_prices (symbol, price, updated_at)
    VALUES (v_symbol, v_price, NOW())
    ON CONFLICT (symbol) DO NOTHING;

    INSERT INTO market_circuit_breakers (symbol, max_tick_pct, staleness_seconds)
    VALUES (v_symbol, 10.0, 300)
    ON CONFLICT (symbol) DO UPDATE SET
      max_tick_pct = EXCLUDED.max_tick_pct,
      staleness_seconds = EXCLUDED.staleness_seconds;

    INSERT INTO market_sources (internal_symbol, provider, provider_symbol, weight, enabled)
    VALUES
      (v_symbol, 'binance', v_base || 'USDT', '1', TRUE),
      (v_symbol, 'bybit',   v_base || 'USDT', '1', TRUE),
      (v_symbol, 'okx',     v_base || '-USDT', '1', TRUE)
    ON CONFLICT (internal_symbol, provider) DO UPDATE SET
      provider_symbol = EXCLUDED.provider_symbol,
      weight = EXCLUDED.weight,
      enabled = EXCLUDED.enabled,
      updated_at = NOW();

    INSERT INTO app_config (key, value, description, is_public)
    VALUES (
      'oracle_min_sources:' || v_symbol,
      '2',
      'Minimum non-stale oracle sources required for ' || v_symbol || ' median updates.',
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

-- PHON perp metadata refresh (internal oracle — no market_sources)
UPDATE futures_markets
   SET display_name = 'PHON Perpetual',
       sort_order = 10,
       price_precision = 6,
       tick_size = '0.000001',
       min_notional = COALESCE(min_notional, '1.000000'),
       is_active = TRUE
 WHERE symbol = 'PHONUSDT-PERP';

INSERT INTO app_config (key, value, description, is_public)
VALUES (
  'trade_tier1_catalog_version',
  '1',
  'Tier-1 major futures catalog seed version for trade majors B-book program.',
  FALSE
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
