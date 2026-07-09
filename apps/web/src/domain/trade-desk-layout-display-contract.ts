/**
 * Trade desk layout breakpoints — P2-C single SOT (Plan §P2-C).
 * JS hooks (`useTradeDeskViewport`) and CSS `@container trade-desk` must share these values.
 *
 * Authority: viewport-contract.ts · trade-desk-layout.css · trade-mobile-layout-display-contract.ts
 */

import { VIEWPORT_BREAKPOINTS } from '@/product/tokens/viewport-contract';

export const P2_BREAKPOINT_UNIFY_TODO = 'p2-breakpoint-unify' as const;

/** 3-tier trade desk layout breakpoints — mirrors viewport-contract mobile/tablet/desktop smoke tiers. */
export const TRADE_DESK_LAYOUT_BREAKPOINTS = {
  mobile: VIEWPORT_BREAKPOINTS.mobile,
  tablet: VIEWPORT_BREAKPOINTS.tablet,
  desktop: VIEWPORT_BREAKPOINTS.desktop,
} as const;

/**
 * `@container trade-desk` desktop min-width — aligned with JS `layoutTier === 'desktop'`.
 * Uses `desktop` (1024), not `wide` (1280), to avoid split-brain between hook and CSS.
 */
export const TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX = VIEWPORT_BREAKPOINTS.desktop;

/** CSS module path — container queries must stay in sync via contract tests. */
export const TRADE_DESK_LAYOUT_CSS_MODULE = 'product/surfaces/trade/trade-desk-layout.css' as const;

export const TRADE_DESK_LAYOUT_BREAKPOINT_OWNERS = [
  'trade-desk-layout.css',
  'use-trade-desk-viewport.ts',
  'trade-mobile-layout-display-contract.ts',
] as const;

export function assertTradeDeskLayoutBreakpointSync(): void {
  if (TRADE_DESK_LAYOUT_BREAKPOINTS.tablet !== VIEWPORT_BREAKPOINTS.tablet) {
    throw new Error('trade-desk-layout: tablet breakpoint must mirror viewport-contract tablet');
  }
  if (TRADE_DESK_LAYOUT_BREAKPOINTS.desktop !== VIEWPORT_BREAKPOINTS.desktop) {
    throw new Error('trade-desk-layout: desktop breakpoint must mirror viewport-contract desktop');
  }
  if (TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX !== TRADE_DESK_LAYOUT_BREAKPOINTS.desktop) {
    throw new Error(
      'trade-desk-layout: container desktop min must equal layout desktop breakpoint',
    );
  }
  const wideBreakpointPx: number = VIEWPORT_BREAKPOINTS.wide;
  if (TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX === wideBreakpointPx) {
    throw new Error(
      'trade-desk-layout: container min must not use wide (1280) — use desktop (1024)',
    );
  }
}
