-- E5 — trade/wallet realtime publication (client useRealtime parity)
BEGIN;

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
    ASSERT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ), format('%s must be in supabase_realtime publication', v_table);
  END LOOP;

  RAISE NOTICE 'TRADE WALLET REALTIME E5 OK — % tables published for client subscriptions', array_length(v_tables, 1);
END;
$$;

ROLLBACK;
