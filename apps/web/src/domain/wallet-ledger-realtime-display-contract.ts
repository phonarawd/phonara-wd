/**
 * PIR E2 — wallet ledger realtime narrow (C-3).
 * `wallet_ledger` is NOT in supabase_realtime; clients invalidate ledger
 * queries when `wallets` changes (balance mutation always updates wallets).
 * Display-only — no client money recompute · ENGINE_BOUNDARY.
 */

export const WALLET_LEDGER_REALTIME_TODO = 'pir-e2-realtime-narrow' as const;

/** Tables dropped from supabase_realtime (high-churn fanout). */
export const WALLET_LEDGER_REALTIME_DROPPED_TABLES = [
  'wallet_ledger',
  'spot_order_fills',
  'trading_order_fills',
] as const;

/** Ledger refresh source after publication DROP. */
export const WALLET_LEDGER_REALTIME_SOURCE_TABLE = 'wallets' as const;

export const WALLET_LEDGER_REALTIME_HOOK = 'hooks/use-wallet.ts' as const;

export const WALLET_LEDGER_REALTIME_OWNERS = [
  WALLET_LEDGER_REALTIME_HOOK,
  'features/trading/use-trade-realtime-feedback.ts',
  'hooks/use-trading.ts',
] as const;

/** TanStack partial key — invalidates all ledger limits for a user. */
export function walletLedgerQueryKeyPrefix(
  userId: string | null,
): readonly ['ledger', string | null] {
  return ['ledger', userId] as const;
}
