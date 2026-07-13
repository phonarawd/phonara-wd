/**
 * P1-A — Limit fill panel refresh (Trade Desk QA) · PIR E2 narrow.
 * Fills tables are NOT in supabase_realtime (high-churn). Refresh via
 * open_orders postgres_changes + post-RPC invalidation (ENGINE_BOUNDARY).
 */

export const TRADE_FILL_REALTIME_TODO = 'p1-fill-realtime' as const;

/** Advisory latency target for limit fill → fills panel row (Plan P3-A T2). */
export const TRADE_FILL_PANEL_REFRESH_TARGET_MS = 2_000 as const;

export type TradeFillRealtimeDesk = 'spot' | 'futures';

/** PIR E2: fills dropped from publication — open_orders is the realtime source. */
export type TradeFillRealtimeSource = 'open_orders';

export type TradeFillRealtimeRow = {
  desk: TradeFillRealtimeDesk;
  /** Query/table for fills panel (REST only — not published). */
  fillsTable: 'spot_order_fills' | 'trading_order_fills';
  openOrdersTable: 'spot_open_orders' | 'trading_open_orders';
  queryKeyField: 'spotOrderFills' | 'orderFills';
  realtimeSource: TradeFillRealtimeSource;
};

/** Canonical fill invalidation surfaces (display-only · ENGINE_BOUNDARY). */
export const TRADE_FILL_REALTIME_MATRIX: readonly TradeFillRealtimeRow[] = [
  {
    desk: 'spot',
    fillsTable: 'spot_order_fills',
    openOrdersTable: 'spot_open_orders',
    queryKeyField: 'spotOrderFills',
    realtimeSource: 'open_orders',
  },
  {
    desk: 'futures',
    fillsTable: 'trading_order_fills',
    openOrdersTable: 'trading_open_orders',
    queryKeyField: 'orderFills',
    realtimeSource: 'open_orders',
  },
] as const;

export const TRADE_FILL_INVALIDATE_SURFACES = [
  'hooks/use-trading.ts',
  'features/trading/use-trade-realtime-feedback.ts',
] as const;

export function findTradeFillRealtimeRow(
  desk: TradeFillRealtimeDesk,
): TradeFillRealtimeRow | undefined {
  return TRADE_FILL_REALTIME_MATRIX.find((row) => row.desk === desk);
}
