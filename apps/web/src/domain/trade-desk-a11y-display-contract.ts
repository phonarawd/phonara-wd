/**
 * P3-E — Trade desk accessibility (Plan trade_desk_qa_audit).
 * axe critical 0 all routes · keyboard submit · confirm dialog focus trap · contrast spot-check.
 */

import { TRADE_LAUNCH_RC_SURFACE_ROUTES } from './trade-desk-launch-rc-display-contract';
import { P9_TRADE_VISUAL_VIEWPORT_WIDTHS } from './p9-trade-visual-signoff-display-contract';

export const TRADE_DESK_A11Y_TODO = 'p3-a11y-expand' as const;

/** Surfaces that must pass axe critical 0 in vitest (operator browser = S4 authoritative for Radix tabs). */
export const TRADE_DESK_AXE_SURFACES = [
  'SpotDeskPage',
  'FuturesDeskPage',
  'FuturesPositionsPage',
  'FuturesOrdersPage',
  'StakingHubPage',
  'StakingPositionsPage',
] as const;

export type TradeDeskAxeSurface = (typeof TRADE_DESK_AXE_SURFACES)[number];

/** In-scope routes aligned with Launch RC §4A. */
export const TRADE_DESK_AXE_ROUTES = TRADE_LAUNCH_RC_SURFACE_ROUTES;

/** Mobile axe spot-check width (Plan P3-E mobile tabs). */
export const TRADE_DESK_AXE_MOBILE_WIDTH = P9_TRADE_VISUAL_VIEWPORT_WIDTHS[0];

/** Primary amount inputs — Enter submits when ticket enabled. */
export const TRADE_DESK_KEYBOARD_SUBMIT_INPUTS = [
  { surface: 'spot', testId: 'spot-amount-input', submitTestId: 'spot-submit' },
  { surface: 'futures', testId: 'futures-margin-input', submitTestId: 'futures-submit' },
] as const;

/** Logical tab order anchors on desktop spot ticket (P3-E). */
export const TRADE_DESK_SPOT_TAB_ORDER_TEST_IDS = [
  'spot-order-type-tabs',
  'spot-amount-input',
  'spot-submit',
] as const;

/** Logical tab order anchors on desktop futures ticket (P3-E). */
export const TRADE_DESK_FUTURES_TAB_ORDER_TEST_IDS = [
  'futures-order-type-tabs',
  'futures-margin-input',
  'futures-submit',
] as const;

export const TRADE_DESK_CONFIRM_DIALOG_TEST_ID = 'trade-confirm-dialog' as const;

export type TradeDeskContrastGate = 'advisory';

export type TradeDeskContrastSpotCheckRow = {
  id: string;
  foregroundVar: string;
  backgroundVar: string;
  /** WCAG 2.1 AA minimum contrast ratio (advisory spot-check). */
  minRatio: number;
  gate: TradeDeskContrastGate;
};

/** `--ds-*` token pairs on trade desk surfaces (WCAG AA advisory · both light/dark branches). */
export const TRADE_DESK_CONTRAST_SPOT_CHECK: readonly TradeDeskContrastSpotCheckRow[] = [
  {
    id: 'body-text',
    foregroundVar: '--ds-foreground',
    backgroundVar: '--ds-bg',
    minRatio: 4.5,
    gate: 'advisory',
  },
  {
    id: 'muted-on-surface',
    foregroundVar: '--ds-foreground-muted',
    backgroundVar: '--ds-surface',
    minRatio: 4.5,
    gate: 'advisory',
  },
  {
    id: 'market-up-on-surface',
    foregroundVar: '--ds-market-up',
    backgroundVar: '--ds-surface',
    minRatio: 3,
    gate: 'advisory',
  },
];

export const TRADE_DESK_A11Y_COLORS_CSS = 'apps/web/src/product/tokens/colors.css' as const;

export const TRADE_DESK_A11Y_E2E_SPEC = 'tests/e2e/trade-desk-smoke.spec.ts' as const;

/** E2E keyboard-only submit path (Plan P3-E DoD). */
export const TRADE_DESK_A11Y_E2E_KEYBOARD_TEST_TITLE =
  'E11 spot amount Enter triggers submit path (keyboard-only)' as const;

export const TRADE_DESK_A11Y_GATE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/trade-desk-a11y-display-contract.test.ts',
  'apps/web/src/product/surfaces/__tests__/p9-trade-visual-signoff.test.tsx',
  'apps/web/src/product/surfaces/trade/__tests__/spot-order-ticket.test.tsx',
  'apps/web/src/product/primitives/__tests__/confirm-dialog.test.tsx',
] as const;

export function assertTradeDeskA11ySync(): void {
  if (TRADE_DESK_AXE_SURFACES.length < 6) {
    throw new Error('trade-desk-a11y: axe surfaces must cover all Launch RC routes');
  }
  if (TRADE_DESK_KEYBOARD_SUBMIT_INPUTS.length !== 2) {
    throw new Error('trade-desk-a11y: spot + futures keyboard submit inputs required');
  }
  for (const row of TRADE_DESK_CONTRAST_SPOT_CHECK) {
    if (row.minRatio < 3) {
      throw new Error(`trade-desk-a11y: contrast ${row.id} minRatio too low`);
    }
  }
}
