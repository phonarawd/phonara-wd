-- PIR E2 (C-3): narrow supabase_realtime — drop high-churn ledger/fill tables.
-- Clients refresh ledger via wallets UPDATE; fills via open_orders + RPC invalidate.
-- Composite index speeds wallet_ledger user timeline reads after fanout removal.
-- Plan: platform_integrity_remediation_v1 · pir-e2-realtime-narrow

SET search_path = public, pg_temp;

-- ─── Publication: DROP high-churn tables (idempotent) ───────────────────────

DO $$
DECLARE
  v_table TEXT;
  v_drop TEXT[] := ARRAY[
    'wallet_ledger',
    'spot_order_fills',
    'trading_order_fills'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_drop
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE %I', v_table);
    END IF;
  END LOOP;
END;
$$;

-- ─── Ledger read path: (user_id, created_at DESC) for timeline queries ───────

CREATE INDEX IF NOT EXISTS ledger_user_created_idx
  ON wallet_ledger (user_id, created_at DESC);
