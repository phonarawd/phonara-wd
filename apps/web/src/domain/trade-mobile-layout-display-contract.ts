/**
 * Trade desk mobile + tablet layout — P9 WORLD step 22–23 · P2-A tablet tier.
 * Mobile (<768): chart | trade | positions | history · trade subtab order|book.
 * Tablet (768–1023): chart + ticket 2-col · trade|positions|history tabs · book subtab.
 * Desktop (1024+): 3-col grid — see trade-ultra-layout-display-contract.
 *
 * Authority: TRADE_UX_CANON.md · trade-exchange-parity-display-contract TRADE_UI_ZONE_OWNERS
 */

import {
  TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX,
  TRADE_DESK_LAYOUT_BREAKPOINTS,
} from '@/domain/trade-desk-layout-display-contract';

export const P9_TRADE_MOBILE_HISTORY_TAB_TODO = 'p9-trade-mobile-history-tab' as const;
export const P9_TRADE_MOBILE_FUTURES_BOOK_TAB_TODO = 'p9-trade-mobile-futures-book-tab' as const;
export const P2_MOBILE_375_SWIPE_TODO = 'p2-mobile-375-swipe' as const;

/** P2-B narrow mobile signoff width — iPhone SE class (375px). */
export const TRADE_DESK_MOBILE_NARROW_SIGNOFF_WIDTH_PX = 375 as const;

export const TRADE_DESK_MOBILE_ROOT_CLASS = 'trade-desk-mobile' as const;
export const TRADE_DESK_MOBILE_TABS_CLASS = 'trade-desk-mobile-tabs' as const;
export const TRADE_DESK_MOBILE_TABLIST_CLASS = 'trade-desk-mobile-tablist' as const;
export const TRADE_DESK_MOBILE_TAB_TRIGGER_CLASS = 'trade-desk-mobile-tab-trigger' as const;
export const TRADE_DESK_MOBILE_TAB_ICON_CLASS = 'trade-desk-mobile-tab-icon' as const;
export const TRADE_DESK_MOBILE_TAB_LABEL_CLASS = 'trade-desk-mobile-tab-label' as const;
export const TRADE_DESK_MOBILE_SWIPE_SURFACE_CLASS = 'trade-desk-mobile-swipe-surface' as const;
export const TRADE_DESK_MOBILE_SWIPE_SURFACE_TESTID = 'trade-desk-mobile-swipe-surface' as const;
export const TRADE_DESK_MOBILE_STICKY_CTA_CLASS = 'trade-desk-mobile-sticky-cta' as const;

/** Minimum touch target for 4-up mobile tablist (§22.2.2 · P2-B). */
export const TRADE_DESK_MOBILE_TAB_TOUCH_MIN_WIDTH_PX = 44 as const;

/** Horizontal swipe threshold — chart↔trade gesture assist only (P2-B). */
export const TRADE_DESK_MOBILE_SWIPE_MIN_DELTA_PX = 48 as const;

/** Adjacent tabs that accept horizontal swipe (tabs remain primary IA). */
export const TRADE_DESK_MOBILE_SWIPE_TAB_IDS = ['chart', 'trade'] as const;

export type TradeDeskMobileSwipeTabId = (typeof TRADE_DESK_MOBILE_SWIPE_TAB_IDS)[number];

/** Canonical mobile tab ids — 4 tabs only (§22.2.2 G1 · Bybit pattern). */
export const TRADE_DESK_MOBILE_TAB_IDS = ['chart', 'trade', 'positions', 'history'] as const;

export type TradeDeskMobileTabId = (typeof TRADE_DESK_MOBILE_TAB_IDS)[number];

export const TRADE_DESK_MOBILE_TAB_COUNT = TRADE_DESK_MOBILE_TAB_IDS.length;

/** Trade tab subtab ids — order ticket | order book (§22.2.2 G5 · spot/futures parity). */
export const TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS = ['order', 'book'] as const;

export type TradeDeskMobileTradeSubtabId = (typeof TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS)[number];

export const TRADE_DESK_MOBILE_TRADE_SUBTAB_COUNT = TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS.length;

export const TRADE_DESK_MOBILE_TRADE_STACK_CLASS = 'trade-desk-mobile-trade-stack' as const;

export const TRADE_DESK_MOBILE_LAYOUT_OWNERS = [
  'trade-desk-mobile-tabs.tsx',
  'trade-desk-tablet-layout.tsx',
  'spot-desk-page.tsx',
  'futures-desk-page.tsx',
] as const;

/** md+ tablet tier — mirrors trade-desk-layout-display-contract tablet (768px). */
export const TRADE_DESK_TABLET_MIN_WIDTH_PX = TRADE_DESK_LAYOUT_BREAKPOINTS.tablet;

/** Tablet upper bound (inclusive) — one px below desktop lg. */
export const TRADE_DESK_TABLET_MAX_WIDTH_PX = TRADE_DESK_LAYOUT_BREAKPOINTS.desktop - 1;

/** lg+ desktop trade desk layout — mirrors trade-desk-layout-display-contract desktop · `useTradeDeskViewport`. */
export const TRADE_DESK_DESKTOP_MIN_WIDTH_PX = TRADE_DESK_LAYOUT_BREAKPOINTS.desktop;

/** @container trade-desk min-width — same SOT as CSS (P2-C). */
export { TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX };

export const TRADE_DESK_VIEWPORT_HOOK_MODULE =
  'features/trading/use-trade-desk-viewport.ts' as const;

export const TRADE_DESK_TABLET_ROOT_CLASS = 'trade-desk-tablet' as const;
export const TRADE_DESK_TABLET_MAIN_GRID_CLASS = 'trade-desk-tablet-main-grid' as const;
export const TRADE_DESK_TABLET_MAIN_GRID_TESTID = 'trade-desk-tablet-main-grid' as const;
export const TRADE_DESK_TABLET_TABS_CLASS = 'trade-desk-tablet-tabs' as const;

/** Tablet shell tabs — chart is always visible in 2-col header; no chart tab. */
export const TRADE_DESK_TABLET_TAB_IDS = ['trade', 'positions', 'history'] as const;

export type TradeDeskTabletTabId = (typeof TRADE_DESK_TABLET_TAB_IDS)[number];

export const TRADE_DESK_TABLET_TAB_COUNT = TRADE_DESK_TABLET_TAB_IDS.length;

export type TradeDeskLayoutTier = 'mobile' | 'tablet' | 'desktop';

export function resolveTradeDeskLayoutTier(widthPx: number): TradeDeskLayoutTier {
  if (widthPx >= TRADE_DESK_DESKTOP_MIN_WIDTH_PX) return 'desktop';
  if (widthPx >= TRADE_DESK_TABLET_MIN_WIDTH_PX) return 'tablet';
  return 'mobile';
}

export function assertTradeMobileLayoutContractSync(): void {
  if (TRADE_DESK_MOBILE_TAB_COUNT !== 4) {
    throw new Error('trade-mobile-layout: mobile tab count must stay 4');
  }
  if (TRADE_DESK_MOBILE_TAB_IDS.join('|') !== 'chart|trade|positions|history') {
    throw new Error('trade-mobile-layout: tab id order drift');
  }
  if (TRADE_DESK_MOBILE_TRADE_SUBTAB_COUNT !== 2) {
    throw new Error('trade-mobile-layout: trade subtab count must stay 2');
  }
  if (TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS.join('|') !== 'order|book') {
    throw new Error('trade-mobile-layout: trade subtab id order drift');
  }
  if (TRADE_DESK_MOBILE_SWIPE_TAB_IDS.join('|') !== 'chart|trade') {
    throw new Error('trade-mobile-layout: swipe tab pair drift');
  }
  if (TRADE_DESK_MOBILE_TAB_TOUCH_MIN_WIDTH_PX !== 44) {
    throw new Error('trade-mobile-layout: mobile tab touch min-width must stay 44px');
  }
  if (TRADE_DESK_DESKTOP_MIN_WIDTH_PX !== TRADE_DESK_LAYOUT_BREAKPOINTS.desktop) {
    throw new Error('trade-mobile-layout: desktop min-width must mirror trade-desk-layout desktop');
  }
  if (TRADE_DESK_TABLET_MIN_WIDTH_PX !== TRADE_DESK_LAYOUT_BREAKPOINTS.tablet) {
    throw new Error('trade-mobile-layout: tablet min-width must mirror trade-desk-layout tablet');
  }
  if (TRADE_DESK_TABLET_MAX_WIDTH_PX !== TRADE_DESK_LAYOUT_BREAKPOINTS.desktop - 1) {
    throw new Error('trade-mobile-layout: tablet max-width must be desktop - 1');
  }
  if (TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX !== TRADE_DESK_DESKTOP_MIN_WIDTH_PX) {
    throw new Error('trade-mobile-layout: container desktop min must equal JS desktop min');
  }
  if (TRADE_DESK_TABLET_TAB_COUNT !== 3) {
    throw new Error('trade-mobile-layout: tablet tab count must stay 3');
  }
  if (TRADE_DESK_TABLET_TAB_IDS.join('|') !== 'trade|positions|history') {
    throw new Error('trade-mobile-layout: tablet tab id order drift');
  }
}
