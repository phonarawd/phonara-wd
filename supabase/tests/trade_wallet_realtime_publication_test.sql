-- E5 — trade/wallet realtime publication (client useRealtime parity)
-- PIR E2 narrowed: wallet_ledger + fill tables dropped from publication
-- (ledger via wallets UPDATE; fills via open_orders + RPC invalidate).
BEGIN;

DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'oracle_prices',
    'price_ticks',
    'wallets',
    'spot_open_orders',
    'trading_open_orders',
    'futures_positions',
    'staking_positions'
  ];
  v_dropped TEXT[] := ARRAY[
    'wallet_ledger',
    'spot_order_fills',
    'trading_order_fills'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables
  LOOP
    ASSERT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ), format('%s must be in supabase_realtime publication', v_table);
  END LOOP;

  FOREACH v_table IN ARRAY v_dropped
  LOOP
    ASSERT NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ), format('%s must NOT be in supabase_realtime (PIR E2)', v_table);
  END LOOP;

  RAISE NOTICE 'TRADE WALLET REALTIME E5+E2 OK — % tables published · % high-churn dropped',
    array_length(v_tables, 1), array_length(v_dropped, 1);
END;
$$;

ROLLBACK;
