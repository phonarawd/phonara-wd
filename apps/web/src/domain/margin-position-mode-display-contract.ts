/**
 * OKX margin / position mode parity — Phase 1 E21 discovery contract.
 * Margin mode and leverage are engine/RPC only; hedge/dual-side position mode is MISSING.
 * This module defines OKX parity audit, launch-gate exposure, honest one-way UI rules,
 * and engine backlog for `/trade?section=trade`.
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` · `TRADE_UX_CANON.md`
 */

import {
  FUTURES_MARKET_OPEN_RPC,
  FUTURES_SET_MARGIN_MODE_RPC,
  TRADE_TERMINAL_PRIMARY_ROUTE,
  type MarginMode,
} from './trade-order-states-display-contract';
import { LAUNCH_GATES } from '../lib/launch-gates';

export {
  FUTURES_MARKET_OPEN_RPC,
  FUTURES_SET_MARGIN_MODE_RPC,
  TRADE_TERMINAL_PRIMARY_ROUTE,
  type MarginMode,
};

export const P9_TRADE_POSITION_MODE_LABEL_TODO = 'p9-trade-position-mode-label' as const;
export const P9_TRADE_CROSS_MARGIN_CANARY_TODO = 'p9-trade-cross-margin-canary' as const;

export const MARGIN_ACCOUNTS_TABLE = 'margin_accounts' as const;
export const CROSS_MARGIN_LAUNCH_FLAG = 'feature_cross_margin_enabled' as const;

/** §7 Money Rollout wave id when cross margin flips live on trade terminal. */
export const CROSS_MARGIN_CANARY_WAVE = 'phase4-trade-cross-margin' as const;

/** i18n key shown when cross selector is disabled — sync with `TRADE_USER_COMPLAINT_RISKS.cross-margin-live-claim`. */
export const CROSS_MARGIN_DISABLED_REASON_KEY = 'trade.margin.crossDisabled' as const;

/**
 * OKX hedge/position-mode parity — E21 UI unlock sets `tradeParityLive`.
 * Netting/flip backlog remains (see `OKX_POSITION_MODE_ENGINE_BACKLOG`).
 */
export const OKX_MARGIN_POSITION_PARITY_ACHIEVED = true as const;

export const FUTURES_SET_POSITION_MODE_RPC = 'rpc_set_position_mode' as const;

/** E21 — `margin_accounts.position_mode` + hedge RPC exist; UI unlock = GATE/UI. */
export const SCHEMA_POSITION_MODE_FIELD_COUNT = 1 as const;
export const SCHEMA_HEDGE_FIELD_COUNT = 1 as const;

/** Account position mode — one_way default · hedge after E21 UI unlock. */
export type EffectivePositionMode = 'one_way' | 'hedge';

export type OkxMarginPositionBranch =
  | 'margin_isolated'
  | 'margin_cross'
  | 'leverage_adjust'
  | 'position_mode_one_way'
  | 'position_mode_hedge';

export type OkxBranchEngineStatus = 'exists' | 'partial' | 'missing';

export type OkxMarginPositionExposureMode =
  | 'live'
  | 'built_hidden'
  | 'built_disabled'
  | 'defer_stub';

/** OKX feature inventory vs PHONARA engine (Phase 1 audit 2026-07-02). */
export const OKX_MARGIN_POSITION_ENGINE_BRANCHES: Readonly<
  Record<
    OkxMarginPositionBranch,
    {
      engine: OkxBranchEngineStatus;
      rpc: string | null;
      table: string | null;
      moneyPath: boolean;
      launchFlag: typeof CROSS_MARGIN_LAUNCH_FLAG | null;
      okxFeature: string;
    }
  >
> = {
  margin_isolated: {
    engine: 'exists',
    rpc: FUTURES_SET_MARGIN_MODE_RPC,
    table: MARGIN_ACCOUNTS_TABLE,
    moneyPath: false,
    launchFlag: null,
    okxFeature: 'Isolated margin (account-level)',
  },
  margin_cross: {
    engine: 'partial',
    rpc: FUTURES_SET_MARGIN_MODE_RPC,
    table: MARGIN_ACCOUNTS_TABLE,
    moneyPath: true,
    launchFlag: CROSS_MARGIN_LAUNCH_FLAG,
    okxFeature: 'Cross margin (account-level)',
  },
  leverage_adjust: {
    engine: 'exists',
    rpc: FUTURES_MARKET_OPEN_RPC,
    table: 'futures_positions',
    moneyPath: true,
    launchFlag: null,
    okxFeature: 'Leverage slider (p_leverage on open)',
  },
  position_mode_one_way: {
    engine: 'exists',
    rpc: FUTURES_MARKET_OPEN_RPC,
    table: 'futures_positions',
    moneyPath: true,
    launchFlag: null,
    okxFeature: 'One-way mode (implicit — net long/short only)',
  },
  position_mode_hedge: {
    engine: 'exists',
    rpc: FUTURES_SET_POSITION_MODE_RPC,
    table: MARGIN_ACCOUNTS_TABLE,
    moneyPath: false,
    launchFlag: null,
    okxFeature: 'Hedge / dual-side position mode',
  },
};

export type OkxMarginPositionPanelPlacement = {
  surface: 'margin_mode_segment' | 'position_mode_label' | 'leverage_control';
  route: typeof TRADE_TERMINAL_PRIMARY_ROUTE;
  hook: string;
  component: string;
};

export const OKX_MARGIN_POSITION_PANEL_PLACEMENT: Readonly<OkxMarginPositionPanelPlacement[]> = [
  {
    surface: 'margin_mode_segment',
    route: TRADE_TERMINAL_PRIMARY_ROUTE,
    hook: 'useMarginAccount',
    component: 'MarginModeSegment',
  },
  {
    surface: 'position_mode_label',
    route: TRADE_TERMINAL_PRIMARY_ROUTE,
    hook: 'useFuturesTerminalWire',
    component: 'PositionModeSegment',
  },
  {
    surface: 'leverage_control',
    route: TRADE_TERMINAL_PRIMARY_ROUTE,
    hook: 'useFuturesTerminalWire',
    component: 'LeverageControl',
  },
];

/** UI wire status on trade terminal advanced panel (2026-07-02). */
export const OKX_MARGIN_POSITION_UI_WIRE_STATUS: Readonly<
  Record<
    | 'margin_isolated_selector'
    | 'margin_cross_selector'
    | 'leverage_slider'
    | 'position_mode_one_way_label'
    | 'position_mode_hedge_toggle',
    OkxMarginPositionExposureMode
  >
> = {
  margin_isolated_selector: 'live',
  margin_cross_selector: 'built_disabled',
  leverage_slider: 'live',
  position_mode_one_way_label: 'live',
  position_mode_hedge_toggle: 'live',
};

/** Remaining after E21 UI unlock — OKX netting backlog only. */
export const OKX_POSITION_MODE_ENGINE_BACKLOG: Readonly<
  Array<{
    item: string;
    priority: 'high' | 'medium';
    blockedSurfaces: readonly string[];
  }>
> = [
  {
    item: 'OKX-style one_way netting/flip (Closed Beta stacks same-side)',
    priority: 'medium',
    blockedSurfaces: ['position_mode_hedge_toggle', 'hedge_position_cards'],
  },
];

export function resolveOkxBranchExposure(
  branch: OkxMarginPositionBranch,
  crossMarginEnabled = false,
  tradeParityLive = LAUNCH_GATES.tradeParityLive,
): OkxMarginPositionExposureMode {
  if (branch === 'position_mode_hedge') {
    return tradeParityLive ? 'live' : 'built_hidden';
  }
  if (branch === 'margin_cross') {
    return crossMarginEnabled ? 'live' : 'built_disabled';
  }
  const row = OKX_MARGIN_POSITION_ENGINE_BRANCHES[branch];
  if (row.engine === 'exists') return 'live';
  if (row.engine === 'partial') return crossMarginEnabled ? 'live' : 'built_disabled';
  return 'built_hidden';
}

/** Cross margin selector disabled until launch flag `feature_cross_margin_enabled=true`. */
export function shouldDisableCrossMarginSelector(crossMarginEnabled: boolean): boolean {
  return !crossMarginEnabled;
}

/**
 * Hedge toggle stays hidden until E21 UI (`tradeParityLive`).
 * Engine exists after WAVE — fake visible toggle still FAIL when locked.
 */
export function shouldHideHedgePositionModeToggle(
  tradeParityLive = LAUNCH_GATES.tradeParityLive,
): boolean {
  return !tradeParityLive;
}

/** Honest one-way fixed label — show while hedge UI locked; never fake a hedge toggle. */
export function shouldShowOneWayPositionModeLabel(
  tradeParityLive = LAUNCH_GATES.tradeParityLive,
): boolean {
  return shouldHideHedgePositionModeToggle(tradeParityLive);
}

export function getEffectivePositionMode(
  mode: EffectivePositionMode | null | undefined = 'one_way',
): EffectivePositionMode {
  return mode === 'hedge' ? 'hedge' : 'one_way';
}

/** Margin mode is account-level (margin_accounts), not per-position — OKX parity note for UI copy. */
export function isMarginModeAccountScoped(): boolean {
  return true;
}

export function crossMarginBranchRequiresCanary(): boolean {
  return true;
}

/** Parity contract disabled+key — honest reason while `feature_cross_margin_enabled` is off. */
export function getCrossMarginDisabledReasonKey(): typeof CROSS_MARGIN_DISABLED_REASON_KEY {
  return CROSS_MARGIN_DISABLED_REASON_KEY;
}

/** Dynamic wire status for `MarginModeSegment` cross button (default launch = built_disabled). */
export function resolveMarginCrossSelectorWireStatus(
  crossMarginEnabled: boolean,
): OkxMarginPositionExposureMode {
  return resolveOkxBranchExposure('margin_cross', crossMarginEnabled);
}
