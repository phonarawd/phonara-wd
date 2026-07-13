-- PIR E2 — realtime publication narrow + ledger composite index
-- Asserts: wallet_ledger / fill tables NOT in supabase_realtime;
--          remaining trade/wallet tables still published;
--          ledger_user_created_idx exists.
BEGIN;

DO $$
DECLARE
  v_table TEXT;
  v_dropped TEXT[] := ARRAY[
    'wallet_ledger',
    'spot_order_fills',
    'trading_order_fills'
  ];
  v_kept TEXT[] := ARRAY[
    'oracle_prices',
    'price_ticks',
    'wallets',
    'spot_open_orders',
    'trading_open_orders',
    'futures_positions',
    'staking_positions'
  ];
BEGIN
  -- E2-0: high-churn tables must be absent from publication
  FOREACH v_table IN ARRAY v_dropped
  LOOP
    ASSERT NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ), format('E2-0 FAIL: %s must NOT be in supabase_realtime', v_table);
  END LOOP;

  -- E2-1: low-churn trade/wallet tables remain published
  FOREACH v_table IN ARRAY v_kept
  LOOP
    ASSERT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ), format('E2-1 FAIL: %s must remain in supabase_realtime', v_table);
  END LOOP;

  -- E2-2: composite ledger index for user timeline reads
  ASSERT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'wallet_ledger'
      AND indexname = 'ledger_user_created_idx'
  ), 'E2-2 FAIL: ledger_user_created_idx must exist on wallet_ledger';

  RAISE NOTICE 'PIR E2 realtime-narrow OK — dropped % · kept % · ledger_user_created_idx',
    array_length(v_dropped, 1), array_length(v_kept, 1);
END;
$$;

ROLLBACK;
