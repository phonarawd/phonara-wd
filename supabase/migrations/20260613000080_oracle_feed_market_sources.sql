-- ============================================================
-- Oracle feed market/source seed
-- ============================================================
-- Seeds the DB-side source registry for the external price-feed worker.
-- The worker reads this table dynamically and submits one source price per row.
-- PHON markets are intentionally excluded because they are internally managed.
-- ============================================================

SET search_path = public, pg_temp;

INSERT INTO market_sources (internal_symbol, provider, provider_symbol, weight, enabled)
VALUES
  ('BTCUSDT-SIM', 'binance', 'BTCUSDT',  '1', TRUE),
  ('BTCUSDT-SIM', 'bybit',   'BTCUSDT',  '1', TRUE),
  ('BTCUSDT-SIM', 'okx',     'BTC-USDT', '1', TRUE),
  ('ETHUSDT-SIM', 'binance', 'ETHUSDT',  '1', TRUE),
  ('ETHUSDT-SIM', 'bybit',   'ETHUSDT',  '1', TRUE),
  ('ETHUSDT-SIM', 'okx',     'ETH-USDT', '1', TRUE)
ON CONFLICT (internal_symbol, provider) DO UPDATE
  SET provider_symbol = EXCLUDED.provider_symbol,
      weight = EXCLUDED.weight,
      enabled = EXCLUDED.enabled,
      updated_at = NOW();
