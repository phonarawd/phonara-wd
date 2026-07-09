-- ============================================================
-- Migration: 20260721000004_trade_t0c_price_ticks_bootstrap.sql
-- Trade Wave T0-c: price_ticks bootstrap from oracle_prices
-- ============================================================
-- One append-only bootstrap tick per symbol that has an oracle mark but zero
-- price_ticks history. Closes E29 gap (oracle_prices-only seed, no ticks).
-- Targets: 20 active spot majors + PHON_USDT + PHONUSDT-PERP mirror.
-- Idempotent NOT EXISTS guard — safe to re-apply. PHON scope requires T0-b applied first.
-- ============================================================

SET search_path = public, pg_temp;

INSERT INTO price_ticks (symbol, price, created_at)
SELECT op.symbol, op.price, op.updated_at
  FROM oracle_prices op
 WHERE op.price::NUMERIC > 0
   AND NOT EXISTS (
     SELECT 1 FROM price_ticks pt WHERE pt.symbol = op.symbol
   )
   AND (
     op.symbol IN ('PHON_USDT', 'PHONUSDT-PERP')
     OR EXISTS (
       SELECT 1
         FROM spot_markets sm
        WHERE sm.symbol = op.symbol
          AND sm.is_active
          AND sm.symbol <> 'PHON_USDT'
     )
   );

INSERT INTO app_config (key, value, description, is_public)
VALUES (
  'trade_t0c_ticks_bootstrap_version',
  '1',
  'T0-c price_ticks bootstrap from oracle_prices (E29 regression closeout).',
  FALSE
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = FALSE,
  updated_at = NOW();
