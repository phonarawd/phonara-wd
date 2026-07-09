-- ============================================================
-- Migration: 20260724000001_trade_wallet_realtime_publication
-- E5 — trade/wallet realtime publication (PQA F5 · launch-engine-e5)
-- ============================================================
-- Adds trade/wallet subscription tables to supabase_realtime publication.
-- Display-only push: existing RLS + GRANT boundaries unchanged (own-row or public read).
-- Settlement / balance mutations remain RPC-only; no schema or policy changes.
-- Client hooks: use-trading.ts · use-wallet.ts · use-trade-realtime-feedback.ts
-- ============================================================

SET search_path = public, pg_temp;

DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'oracle_prices',
    'price_ticks',
    'wallets',
    'wallet_ledger',
    'spot_open_orders',
    'trading_open_orders',
    'futures_positions',
    'staking_positions',
    'spot_order_fills',
    'trading_order_fills'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', v_table);
    END IF;
  END LOOP;
END;
$$;
