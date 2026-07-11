import { describe, expect, it } from 'vitest';
import {
  FUTURES_ACTIVE_ORDER_STATUSES,
  FUTURES_CANCEL_ORDER_RPC,
  FUTURES_LIMIT_ORDER_RPC,
  FUTURES_MARKET_OPEN_RPC,
  FUTURES_ORDER_DEPENDENCY_CHAINS,
  FUTURES_ORDER_INITIAL_STATUS,
  FUTURES_ORDER_STATE_TRANSITIONS,
  FUTURES_STOP_ORDER_RPC,
  FUTURES_TERMINAL_ORDER_STATUSES,
  TRADE_FUTURES_PANEL_CAPABILITIES,
  TRADE_ORDER_ENGINE_BRANCHES,
  TRADE_ORDER_PANEL_PLACEMENT,
  TRADE_ORDER_UI_WIRE_STATUS,
  TRADE_TERMINAL_PRIMARY_ROUTE,
  isActiveOpenOrderStatus,
  isSpotLimitStopSupported,
  resolveFuturesOrderPlacementRpc,
  resolveTradeOrderBranchExposure,
  shouldDisableCrossMarginMode,
  shouldHideHedgePositionMode,
  supportsEntryTpSlOnOrderType,
} from '../trade-order-states-display-contract';

describe('trade-order-states-display-contract', () => {
  it('locks futures open-order panels to /trade?section=trade only', () => {
    const openOrderPanels = TRADE_ORDER_PANEL_PLACEMENT.filter(
      (row) => row.panel === 'open_orders',
    );
    expect(openOrderPanels).toHaveLength(1);
    expect(openOrderPanels[0]?.route).toBe(TRADE_TERMINAL_PRIMARY_ROUTE);
    expect(openOrderPanels[0]?.product).toBe('futures');
  });

  it('documents order state machine initial status per order type', () => {
    expect(FUTURES_ORDER_INITIAL_STATUS.limit).toBe('open');
    expect(FUTURES_ORDER_INITIAL_STATUS.stop_market).toBe('pending');
    expect(FUTURES_ORDER_INITIAL_STATUS.stop_limit).toBe('pending');
    expect(FUTURES_ORDER_INITIAL_STATUS.market).toBeNull();
  });

  it('maps limit/stop/market placement to correct RPCs', () => {
    expect(resolveFuturesOrderPlacementRpc('market')).toBe(FUTURES_MARKET_OPEN_RPC);
    expect(resolveFuturesOrderPlacementRpc('limit')).toBe(FUTURES_LIMIT_ORDER_RPC);
    expect(resolveFuturesOrderPlacementRpc('stop_market')).toBe(FUTURES_STOP_ORDER_RPC);
    expect(resolveFuturesOrderPlacementRpc('stop_limit')).toBe(FUTURES_STOP_ORDER_RPC);
  });

  it('documents active vs terminal order statuses for open-orders panel', () => {
    expect(FUTURES_ACTIVE_ORDER_STATUSES).toEqual(['pending', 'open', 'triggered']);
    expect(FUTURES_TERMINAL_ORDER_STATUSES).toContain('filled');
    expect(FUTURES_TERMINAL_ORDER_STATUSES).toContain('cancelled');
    for (const status of FUTURES_ACTIVE_ORDER_STATUSES) {
      expect(isActiveOpenOrderStatus(status)).toBe(true);
    }
    expect(isActiveOpenOrderStatus('filled')).toBe(false);
  });

  it('documents stop/limit state transitions through fill worker', () => {
    expect(FUTURES_ORDER_STATE_TRANSITIONS.pending.some((t) => t.to === 'triggered')).toBe(true);
    expect(FUTURES_ORDER_STATE_TRANSITIONS.pending.some((t) => t.to === 'open')).toBe(true);
    expect(FUTURES_ORDER_STATE_TRANSITIONS.open.some((t) => t.to === 'filled')).toBe(true);
    expect(FUTURES_ORDER_STATE_TRANSITIONS.triggered.some((t) => t.to === 'filled')).toBe(true);
    expect(
      FUTURES_ORDER_STATE_TRANSITIONS.open.some(
        (t) => t.to === 'cancelled' && t.trigger.includes('rpc_cancel_order'),
      ),
    ).toBe(true);
  });

  it('maps dependency chains for limit, stop, market, and cancel paths', () => {
    expect(FUTURES_ORDER_DEPENDENCY_CHAINS.limit[0]).toBe(FUTURES_LIMIT_ORDER_RPC);
    expect(FUTURES_ORDER_DEPENDENCY_CHAINS.limit).toContain('trading_open_orders.status=open');
    expect(FUTURES_ORDER_DEPENDENCY_CHAINS.stop_market).toContain('status=triggered');
    expect(FUTURES_ORDER_DEPENDENCY_CHAINS.market[0]).toBe(FUTURES_MARKET_OPEN_RPC);
    expect(FUTURES_ORDER_DEPENDENCY_CHAINS.cancel[0]).toBe(FUTURES_CANCEL_ORDER_RPC);
  });

  it('exposes spot limit/stop live and hedge live after E21 UI', () => {
    expect(shouldHideHedgePositionMode()).toBe(false);
    expect(isSpotLimitStopSupported()).toBe(true);
    expect(resolveTradeOrderBranchExposure('hedge_position_mode')).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.hedge_mode_toggle).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.spot_limit_tab).toBe('live');
  });

  it('gates cross margin until feature_cross_margin_enabled flag is on', () => {
    expect(shouldDisableCrossMarginMode(false)).toBe(true);
    expect(shouldDisableCrossMarginMode(true)).toBe(false);
    expect(resolveTradeOrderBranchExposure('futures_cross_margin', false)).toBe('built_disabled');
    expect(resolveTradeOrderBranchExposure('futures_cross_margin', true)).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.futures_margin_cross).toBe('built_disabled');
  });

  it('documents futures limit/stop/open orders as engine EXISTS', () => {
    expect(TRADE_ORDER_ENGINE_BRANCHES.futures_limit_order.engine).toBe('exists');
    expect(TRADE_ORDER_ENGINE_BRANCHES.futures_stop_order.engine).toBe('exists');
    expect(TRADE_ORDER_ENGINE_BRANCHES.futures_cancel_order.rpc).toBe(FUTURES_CANCEL_ORDER_RPC);
    expect(TRADE_ORDER_ENGINE_BRANCHES.futures_close_position.engine).toBe('exists');
    expect(TRADE_ORDER_ENGINE_BRANCHES.futures_partial_close.engine).toBe('exists');
    expect(TRADE_ORDER_ENGINE_BRANCHES.hedge_position_mode.engine).toBe('exists');
    expect(TRADE_ORDER_ENGINE_BRANCHES.hedge_position_mode.rpc).toBe('rpc_set_position_mode');
    expect(TRADE_ORDER_ENGINE_BRANCHES.futures_cross_margin.engine).toBe('partial');
  });

  it('gates reduce-only and post-open TP/SL edit live (E21 UI + EXISTS RPC)', () => {
    expect(TRADE_FUTURES_PANEL_CAPABILITIES.reduceOnlyOrders).toBe(true);
    expect(TRADE_FUTURES_PANEL_CAPABILITIES.positionTpSlEdit).toBe(true);
    expect(TRADE_FUTURES_PANEL_CAPABILITIES.entryTpSlOnOpenOrders).toBe(false);
    expect(TRADE_ORDER_UI_WIRE_STATUS.reduce_only_toggle).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.position_tpsl_edit).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.futures_entry_tpsl_limit_stop).toBe('built_disabled');
  });

  it('allows entry TP/SL on market only until open-order RPCs accept SL/TP (Phase E)', () => {
    expect(supportsEntryTpSlOnOrderType('market')).toBe(true);
    expect(supportsEntryTpSlOnOrderType('limit')).toBe(false);
    expect(supportsEntryTpSlOnOrderType('stop_market')).toBe(false);
    expect(supportsEntryTpSlOnOrderType('stop_limit')).toBe(false);
  });

  it('documents futures limit/stop tabs and open-orders dock as live wired', () => {
    expect(TRADE_ORDER_UI_WIRE_STATUS.futures_limit_tab).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.futures_stop_tab).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.futures_open_orders_dock).toBe('live');
  });
});
