/**
 * Trade limit/stop/margin/open orders — Phase 1 E14 discovery contract (order state machine + panel placement).
 * Order fills, margin locks, and status transitions are engine/RPC only; this module defines route ownership,
 * state-machine transitions, exposure rules, and UI panel mapping for `/trade?section=trade`.
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` · `TRADE_UX_CANON.md`
 */

import { TRADE_FUTURES_UI_CAPABILITIES } from '../features/trading/trade-rpc-capabilities';

export const TRADE_TERMINAL_PRIMARY_ROUTE = '/trade?section=trade' as const;

export const FUTURES_MARKET_OPEN_RPC = 'rpc_open_futures_position' as const;
export const FUTURES_LIMIT_ORDER_RPC = 'rpc_place_limit_order' as const;
export const FUTURES_STOP_ORDER_RPC = 'rpc_place_stop_order' as const;
export const FUTURES_CANCEL_ORDER_RPC = 'rpc_cancel_order' as const;
export const FUTURES_CLOSE_POSITION_RPC = 'rpc_close_futures_position' as const;
export const FUTURES_PARTIAL_CLOSE_RPC = 'rpc_partial_close_futures' as const;
export const FUTURES_UPDATE_SLTP_RPC = 'rpc_update_futures_position_sltp' as const;
export const FUTURES_SET_TRAILING_STOP_RPC = 'rpc_set_trailing_stop' as const;
export const FUTURES_CLEAR_TRAILING_STOP_RPC = 'rpc_clear_trailing_stop' as const;
export const FUTURES_ADJUST_ISOLATED_MARGIN_RPC = 'rpc_adjust_isolated_margin' as const;
export const FUTURES_SET_MARGIN_MODE_RPC = 'rpc_set_margin_mode' as const;
export const FUTURES_OPEN_ORDER_FILLS_RPC = 'rpc_run_open_order_fills' as const;

/**
 * Server-only fill worker — browser client NEVER invokes this RPC.
 * Callers (verified 2026-07-08 · UNVERIFIED-4 closed):
 * - pg_cron `trade-open-order-fills` → `_run_open_order_fills_logged()` (`20260620000133_trade_e2_open_orders.sql`)
 * - SQL integration tests (`trade_open_orders_*`, `trade_t2_futures_cron_test.sql`)
 * - E2E admin fixture (`tests/e2e/fixtures/trade-desk-money.ts`) · pentest service_role
 * REVOKE: anon/authenticated — `service_role` only.
 */
export const FUTURES_OPEN_ORDER_FILLS_CALLERS =
  'pg_cron:trade-open-order-fills · service_role tests/E2E · not browser client' as const;

export const SPOT_MARKET_BUY_RPC = 'rpc_spot_market_buy' as const;
export const SPOT_MARKET_SELL_RPC = 'rpc_spot_market_sell' as const;

/** DB enum `order_type` — `market` is immediate open only (no `trading_open_orders` row). */
export type FuturesOrderType = 'market' | 'limit' | 'stop_market' | 'stop_limit';

/** DB enum `time_in_force` — limit orders only (Phase E). */
export type FuturesTimeInForce = 'gtc' | 'post_only' | 'ioc' | 'fok';

/** DB enum `order_status` — client open-order query shows active subset only. */
export type FuturesOrderStatus =
  | 'pending'
  | 'open'
  | 'partially_filled'
  | 'filled'
  | 'cancelled'
  | 'triggered';

export type MarginMode = 'isolated' | 'cross';

export type TradeOrderEngineBranch =
  | 'futures_market_open'
  | 'futures_limit_order'
  | 'futures_stop_order'
  | 'futures_cancel_order'
  | 'futures_close_position'
  | 'futures_partial_close'
  | 'futures_open_orders_panel'
  | 'futures_margin_mode'
  | 'futures_cross_margin'
  | 'spot_market_only'
  | 'hedge_position_mode';

export type TradeOrderBranchEngineStatus = 'exists' | 'partial' | 'missing';

export type TradeOrderExposureMode = 'live' | 'built_hidden' | 'built_disabled' | 'defer_stub';

/** Engine branch inventory — Phase 1 audit 2026-07-02. */
export const TRADE_ORDER_ENGINE_BRANCHES: Readonly<
  Record<
    TradeOrderEngineBranch,
    {
      engine: TradeOrderBranchEngineStatus;
      rpc: string | null;
      moneyPath: boolean;
      table: string | null;
    }
  >
> = {
  futures_market_open: {
    engine: 'exists',
    rpc: FUTURES_MARKET_OPEN_RPC,
    moneyPath: true,
    table: 'futures_positions',
  },
  futures_limit_order: {
    engine: 'exists',
    rpc: FUTURES_LIMIT_ORDER_RPC,
    moneyPath: true,
    table: 'trading_open_orders',
  },
  futures_stop_order: {
    engine: 'exists',
    rpc: FUTURES_STOP_ORDER_RPC,
    moneyPath: true,
    table: 'trading_open_orders',
  },
  futures_cancel_order: {
    engine: 'exists',
    rpc: FUTURES_CANCEL_ORDER_RPC,
    moneyPath: true,
    table: 'trading_open_orders',
  },
  futures_close_position: {
    engine: 'exists',
    rpc: FUTURES_CLOSE_POSITION_RPC,
    moneyPath: true,
    table: 'futures_positions',
  },
  futures_partial_close: {
    engine: 'exists',
    rpc: FUTURES_PARTIAL_CLOSE_RPC,
    moneyPath: true,
    table: 'futures_positions',
  },
  futures_open_orders_panel: {
    engine: 'exists',
    rpc: null,
    moneyPath: false,
    table: 'trading_open_orders',
  },
  futures_margin_mode: {
    engine: 'exists',
    rpc: FUTURES_SET_MARGIN_MODE_RPC,
    moneyPath: false,
    table: 'margin_accounts',
  },
  futures_cross_margin: {
    engine: 'partial',
    rpc: FUTURES_SET_MARGIN_MODE_RPC,
    moneyPath: true,
    table: 'margin_accounts',
  },
  spot_market_only: {
    engine: 'exists',
    rpc: SPOT_MARKET_BUY_RPC,
    moneyPath: true,
    table: 'spot_holdings',
  },
  hedge_position_mode: {
    engine: 'missing',
    rpc: null,
    moneyPath: false,
    table: null,
  },
};

/** Initial DB status when order row is created (migration 20260620000133). */
export const FUTURES_ORDER_INITIAL_STATUS: Readonly<
  Record<FuturesOrderType, FuturesOrderStatus | null>
> = {
  market: null,
  limit: 'open',
  stop_market: 'pending',
  stop_limit: 'pending',
};

/** Statuses shown in client open-orders panel (`useOpenOrders` query filter). */
export const FUTURES_ACTIVE_ORDER_STATUSES: readonly FuturesOrderStatus[] = [
  'pending',
  'open',
  'triggered',
];

/** Terminal statuses — never shown in open-orders panel. */
export const FUTURES_TERMINAL_ORDER_STATUSES: readonly FuturesOrderStatus[] = [
  'filled',
  'cancelled',
  'partially_filled',
];

/** Order state machine transitions (engine-owned · cron fill worker `rpc_run_open_order_fills`). */
export const FUTURES_ORDER_STATE_TRANSITIONS: Readonly<
  Record<
    FuturesOrderStatus,
    ReadonlyArray<{
      to: FuturesOrderStatus;
      trigger: string;
      orderTypes?: readonly FuturesOrderType[];
    }>
  >
> = {
  pending: [
    {
      to: 'open',
      trigger: 'stop_limit stop_price crossed (mark)',
      orderTypes: ['stop_limit'],
    },
    {
      to: 'triggered',
      trigger: 'stop_market stop_price crossed (mark)',
      orderTypes: ['stop_market'],
    },
    {
      to: 'cancelled',
      trigger: 'user rpc_cancel_order',
      orderTypes: ['stop_market', 'stop_limit'],
    },
  ],
  open: [
    {
      to: 'filled',
      trigger: 'limit price crossed + _fill_house_order',
      orderTypes: ['limit', 'stop_limit'],
    },
    {
      to: 'cancelled',
      trigger: 'user rpc_cancel_order',
      orderTypes: ['limit', 'stop_limit'],
    },
  ],
  triggered: [
    {
      to: 'filled',
      trigger: 'stop_market immediate _fill_house_order',
      orderTypes: ['stop_market'],
    },
    {
      to: 'cancelled',
      trigger: 'user rpc_cancel_order',
      orderTypes: ['stop_market'],
    },
  ],
  partially_filled: [
    {
      to: 'filled',
      trigger: 'remaining quantity filled (enum reserved · house fill is atomic today)',
    },
  ],
  filled: [],
  cancelled: [],
};

/** Runtime dependency chains — place → lock margin → worker fill → position. */
export const FUTURES_ORDER_DEPENDENCY_CHAINS = {
  limit: [
    FUTURES_LIMIT_ORDER_RPC,
    '_place_open_order_common',
    '_lock_wallet_internal',
    'trading_open_orders.status=open',
    FUTURES_OPEN_ORDER_FILLS_RPC,
    '_fill_house_order',
    'futures_positions',
  ],
  stop_market: [
    FUTURES_STOP_ORDER_RPC,
    '_place_open_order_common',
    'trading_open_orders.status=pending',
    FUTURES_OPEN_ORDER_FILLS_RPC,
    'status=triggered',
    '_fill_house_order',
    'futures_positions',
  ],
  stop_limit: [
    FUTURES_STOP_ORDER_RPC,
    'trading_open_orders.status=pending',
    FUTURES_OPEN_ORDER_FILLS_RPC,
    'status=open',
    '_order_limit_crossed',
    '_fill_house_order',
    'futures_positions',
  ],
  market: [FUTURES_MARKET_OPEN_RPC, '_open_futures_position_internal', 'futures_positions'],
  cancel: [FUTURES_CANCEL_ORDER_RPC, '_unlock_wallet_internal', 'status=cancelled'],
} as const;

export type TradeOrderPanelPlacement = {
  panel: 'order_ticket' | 'open_orders' | 'positions' | 'order_book' | 'margin_mode';
  route: typeof TRADE_TERMINAL_PRIMARY_ROUTE;
  product: 'futures' | 'spot' | 'both';
  hook: string;
  component: string;
};

/** Panel ownership on trade terminal — E14 duplicate-owner gate: futures open orders live here only. */
export const TRADE_ORDER_PANEL_PLACEMENT: Readonly<TradeOrderPanelPlacement[]> = [
  {
    panel: 'order_ticket',
    route: TRADE_TERMINAL_PRIMARY_ROUTE,
    product: 'futures',
    hook: 'useFuturesTerminalWire',
    component: 'FuturesOrderTicketForm',
  },
  {
    panel: 'order_ticket',
    route: TRADE_TERMINAL_PRIMARY_ROUTE,
    product: 'spot',
    hook: 'useSpotTerminalWire',
    component: 'SpotOrderTicket',
  },
  {
    panel: 'open_orders',
    route: TRADE_TERMINAL_PRIMARY_ROUTE,
    product: 'futures',
    hook: 'useOpenOrders',
    component: 'OpenOrdersPanel',
  },
  {
    panel: 'positions',
    route: TRADE_TERMINAL_PRIMARY_ROUTE,
    product: 'futures',
    hook: 'useFuturesPositions',
    component: 'TradeBottomDock',
  },
  {
    panel: 'margin_mode',
    route: TRADE_TERMINAL_PRIMARY_ROUTE,
    product: 'futures',
    hook: 'useMarginAccount',
    component: 'MarginModeSegment',
  },
  {
    panel: 'order_book',
    route: TRADE_TERMINAL_PRIMARY_ROUTE,
    product: 'both',
    hook: 'useOrderBook',
    component: 'OrderBookPanel',
  },
];

/** Phase 1 audit wire status — limit/stop wired live on futures ticket (2026-07-02). */
export const TRADE_ORDER_UI_WIRE_STATUS: Readonly<
  Record<
    | 'futures_limit_tab'
    | 'futures_stop_tab'
    | 'futures_open_orders_dock'
    | 'futures_margin_isolated'
    | 'futures_margin_cross'
    | 'spot_limit_tab'
    | 'hedge_mode_toggle'
    | 'reduce_only_toggle'
    | 'position_tpsl_edit'
    | 'futures_entry_tpsl_limit_stop',
    TradeOrderExposureMode
  >
> = {
  futures_limit_tab: 'live',
  futures_stop_tab: 'live',
  futures_open_orders_dock: 'live',
  futures_margin_isolated: 'live',
  futures_margin_cross: 'built_disabled',
  spot_limit_tab: 'live',
  hedge_mode_toggle: 'built_hidden',
  reduce_only_toggle: 'built_disabled',
  position_tpsl_edit: 'live',
  futures_entry_tpsl_limit_stop: 'built_disabled',
};

export function resolveTradeOrderBranchExposure(
  branch: TradeOrderEngineBranch,
  crossMarginEnabled = false,
): TradeOrderExposureMode {
  if (branch === 'hedge_position_mode') return 'built_hidden';
  if (branch === 'futures_cross_margin') {
    return crossMarginEnabled ? 'live' : 'built_disabled';
  }
  const row = TRADE_ORDER_ENGINE_BRANCHES[branch];
  if (row.engine === 'exists') return 'live';
  if (row.engine === 'partial') return crossMarginEnabled ? 'live' : 'built_disabled';
  return 'built_hidden';
}

/** Open-orders panel must list only engine-active statuses — never invent filled/cancelled rows client-side. */
export function isActiveOpenOrderStatus(status: FuturesOrderStatus): boolean {
  return (FUTURES_ACTIVE_ORDER_STATUSES as readonly string[]).includes(status);
}

/** Cross margin selector blocked until launch flag `feature_cross_margin_enabled=true`. */
export function shouldDisableCrossMarginMode(crossMarginEnabled: boolean): boolean {
  return !crossMarginEnabled;
}

/** E21 — OKX hedge / dual-side position mode has no RPC; UI must not render hedge toggle. */
export function shouldHideHedgePositionMode(): boolean {
  return true;
}

/** Spot limit/stop/open-order RPCs wired (T1 · `spot_open_orders`). */
export function isSpotLimitStopSupported(): boolean {
  return true;
}

/** Map order type to placement RPC (market uses immediate open, not open_orders table). */
export function resolveFuturesOrderPlacementRpc(orderType: FuturesOrderType): string {
  if (orderType === 'market') return FUTURES_MARKET_OPEN_RPC;
  if (orderType === 'limit') return FUTURES_LIMIT_ORDER_RPC;
  return FUTURES_STOP_ORDER_RPC;
}

/**
 * Entry TP/SL at order placement — only `rpc_open_futures_position` accepts SL/TP params.
 * Limit/stop RPCs omit them until Phase E engine work (`entryTpSlOnOpenOrders`).
 */
export function supportsEntryTpSlOnOrderType(orderType: FuturesOrderType): boolean {
  if (orderType === 'market') return true;
  return TRADE_FUTURES_UI_CAPABILITIES.entryTpSlOnOpenOrders;
}

/** Re-export futures UI capability freeze for panel gating (reduce-only · post-open TP/SL edit). */
export const TRADE_FUTURES_PANEL_CAPABILITIES = TRADE_FUTURES_UI_CAPABILITIES;
