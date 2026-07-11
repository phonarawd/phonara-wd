import { describe, expect, it } from 'vitest';
import {
  CROSS_MARGIN_CANARY_WAVE,
  CROSS_MARGIN_DISABLED_REASON_KEY,
  CROSS_MARGIN_LAUNCH_FLAG,
  FUTURES_SET_MARGIN_MODE_RPC,
  FUTURES_SET_POSITION_MODE_RPC,
  OKX_MARGIN_POSITION_ENGINE_BRANCHES,
  OKX_MARGIN_POSITION_PANEL_PLACEMENT,
  OKX_MARGIN_POSITION_PARITY_ACHIEVED,
  OKX_MARGIN_POSITION_UI_WIRE_STATUS,
  OKX_POSITION_MODE_ENGINE_BACKLOG,
  P9_TRADE_CROSS_MARGIN_CANARY_TODO,
  SCHEMA_HEDGE_FIELD_COUNT,
  SCHEMA_POSITION_MODE_FIELD_COUNT,
  TRADE_TERMINAL_PRIMARY_ROUTE,
  crossMarginBranchRequiresCanary,
  getCrossMarginDisabledReasonKey,
  getEffectivePositionMode,
  isMarginModeAccountScoped,
  resolveMarginCrossSelectorWireStatus,
  resolveOkxBranchExposure,
  shouldDisableCrossMarginSelector,
  shouldHideHedgePositionModeToggle,
  shouldShowOneWayPositionModeLabel,
} from '../margin-position-mode-display-contract';

describe('margin-position-mode-display-contract', () => {
  it('pins E21 hedge engine exists · UI live after tradeParityLive · OKX flag true', () => {
    expect(OKX_MARGIN_POSITION_PARITY_ACHIEVED).toBe(true);
    expect(SCHEMA_POSITION_MODE_FIELD_COUNT).toBe(1);
    expect(SCHEMA_HEDGE_FIELD_COUNT).toBe(1);
    expect(OKX_MARGIN_POSITION_ENGINE_BRANCHES.position_mode_hedge.engine).toBe('exists');
    expect(OKX_MARGIN_POSITION_ENGINE_BRANCHES.position_mode_hedge.rpc).toBe(
      FUTURES_SET_POSITION_MODE_RPC,
    );
  });

  it('confirms isolated margin EXISTS and cross is PARTIAL behind launch flag', () => {
    expect(OKX_MARGIN_POSITION_ENGINE_BRANCHES.margin_isolated.engine).toBe('exists');
    expect(OKX_MARGIN_POSITION_ENGINE_BRANCHES.margin_isolated.rpc).toBe(
      FUTURES_SET_MARGIN_MODE_RPC,
    );
    expect(OKX_MARGIN_POSITION_ENGINE_BRANCHES.margin_cross.engine).toBe('partial');
    expect(OKX_MARGIN_POSITION_ENGINE_BRANCHES.margin_cross.launchFlag).toBe(
      CROSS_MARGIN_LAUNCH_FLAG,
    );
    expect(OKX_MARGIN_POSITION_ENGINE_BRANCHES.leverage_adjust.engine).toBe('exists');
  });

  it('locks trade terminal as sole owner for margin/position mode surfaces', () => {
    const routes = new Set(OKX_MARGIN_POSITION_PANEL_PLACEMENT.map((row) => row.route));
    expect(routes).toEqual(new Set([TRADE_TERMINAL_PRIMARY_ROUTE]));
    expect(OKX_MARGIN_POSITION_PANEL_PLACEMENT.map((row) => row.component)).toContain(
      'MarginModeSegment',
    );
    expect(OKX_MARGIN_POSITION_PANEL_PLACEMENT.map((row) => row.component)).toContain(
      'PositionModeSegment',
    );
  });

  it('gates cross margin built_disabled until feature_cross_margin_enabled is true', () => {
    expect(shouldDisableCrossMarginSelector(false)).toBe(true);
    expect(shouldDisableCrossMarginSelector(true)).toBe(false);
    expect(resolveOkxBranchExposure('margin_cross', false)).toBe('built_disabled');
    expect(resolveOkxBranchExposure('margin_cross', true)).toBe('live');
    expect(resolveOkxBranchExposure('margin_isolated', false)).toBe('live');
  });

  it('shows hedge toggle when tradeParityLive · hides one-way fixed label', () => {
    expect(shouldHideHedgePositionModeToggle()).toBe(false);
    expect(shouldHideHedgePositionModeToggle(false)).toBe(true);
    expect(shouldShowOneWayPositionModeLabel()).toBe(false);
    expect(getEffectivePositionMode()).toBe('one_way');
    expect(getEffectivePositionMode('hedge')).toBe('hedge');
    expect(resolveOkxBranchExposure('position_mode_hedge')).toBe('live');
    expect(resolveOkxBranchExposure('position_mode_hedge', false, false)).toBe('built_hidden');
    expect(OKX_MARGIN_POSITION_UI_WIRE_STATUS.position_mode_hedge_toggle).toBe('live');
    expect(OKX_MARGIN_POSITION_UI_WIRE_STATUS.position_mode_one_way_label).toBe('live');
  });

  it('documents margin mode as account-scoped and cross margin §7 canary', () => {
    expect(isMarginModeAccountScoped()).toBe(true);
    expect(crossMarginBranchRequiresCanary()).toBe(true);
    expect(CROSS_MARGIN_CANARY_WAVE).toBe('phase4-trade-cross-margin');
    expect(P9_TRADE_CROSS_MARGIN_CANARY_TODO).toBe('p9-trade-cross-margin-canary');
    expect(getCrossMarginDisabledReasonKey()).toBe(CROSS_MARGIN_DISABLED_REASON_KEY);
    expect(resolveMarginCrossSelectorWireStatus(false)).toBe('built_disabled');
    expect(resolveMarginCrossSelectorWireStatus(true)).toBe('live');
    expect(OKX_MARGIN_POSITION_UI_WIRE_STATUS.margin_cross_selector).toBe('built_disabled');
  });

  it('documents OKX netting backlog after E21 UI unlock', () => {
    expect(OKX_POSITION_MODE_ENGINE_BACKLOG.length).toBeGreaterThanOrEqual(1);
    expect(OKX_POSITION_MODE_ENGINE_BACKLOG[0]?.item).toContain('netting');
    expect(OKX_POSITION_MODE_ENGINE_BACKLOG[0]?.blockedSurfaces).toContain(
      'position_mode_hedge_toggle',
    );
  });
});
