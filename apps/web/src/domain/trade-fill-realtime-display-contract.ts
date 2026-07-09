/**
 * P1-A — Limit fill panel realtime / post-trade invalidation (Trade Desk QA audit).
 * Fills query keys must refresh on async cron fills and RPC success paths.
 */

export const TRADE_FILL_REALTIME_TODO = 'p1-fill-realtime' as const;

/** Advisory latency target for limit fill → fills panel row (Plan P3-A T2). */
export const TRADE_FILL_PANEL_REFRESH_TARGET_MS = 2_000 as const;

export type TradeFillRealtimeDesk = 'spot' | 'futures';

export type TradeFillRealtimeRow = {
  desk: TradeFillRealtimeDesk;
  fillsTable: 'spot_order_fills' | 'trading_order_fills';
  openOrdersTable: 'spot_open_orders' | 'trading_open_orders';
  queryKeyField: 'spotOrderFills' | 'orderFills';
  realtimeEvent: 'INSERT';
};

/** Canonical fill invalidation surfaces (display-only · ENGINE_BOUNDARY). */
export const TRADE_FILL_REALTIME_MATRIX: readonly TradeFillRealtimeRow[] = [
  {
    desk: 'spot',
    fillsTable: 'spot_order_fills',
    openOrdersTable: 'spot_open_orders',
    queryKeyField: 'spotOrderFills',
    realtimeEvent: 'INSERT',
  },
  {
    desk: 'futures',
    fillsTable: 'trading_order_fills',
    openOrdersTable: 'trading_open_orders',
    queryKeyField: 'orderFills',
    realtimeEvent: 'INSERT',
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
