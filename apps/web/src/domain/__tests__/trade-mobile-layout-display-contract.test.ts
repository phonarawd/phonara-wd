import { describe, expect, it } from 'vitest';

import {
  assertTradeMobileLayoutContractSync,
  P9_TRADE_MOBILE_FUTURES_BOOK_TAB_TODO,
  P9_TRADE_MOBILE_HISTORY_TAB_TODO,
  TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX,
  TRADE_DESK_DESKTOP_MIN_WIDTH_PX,
  TRADE_DESK_MOBILE_LAYOUT_OWNERS,
  P2_MOBILE_375_SWIPE_TODO,
  TRADE_DESK_MOBILE_NARROW_SIGNOFF_WIDTH_PX,
  TRADE_DESK_MOBILE_ROOT_CLASS,
  TRADE_CHART_GESTURE_OWNER_ATTR,
  TRADE_CHART_GESTURE_OWNER_SELECTOR,
  TRADE_DESK_MOBILE_SWIPE_SURFACE_TESTID,
  TRADE_DESK_MOBILE_SWIPE_TAB_IDS,
  TRADE_DESK_MOBILE_TAB_TOUCH_MIN_WIDTH_PX,
  TRADE_DESK_MOBILE_TABLIST_CLASS,
  TRADE_DESK_MOBILE_STICKY_CTA_CLASS,
  TRADE_DESK_MOBILE_TAB_COUNT,
  TRADE_DESK_MOBILE_TAB_IDS,
  TRADE_DESK_MOBILE_TABS_CLASS,
  TRADE_DESK_MOBILE_TRADE_STACK_CLASS,
  TRADE_DESK_MOBILE_TRADE_SUBTAB_COUNT,
  TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS,
  TRADE_DESK_TABLET_MAIN_GRID_TESTID,
  TRADE_DESK_TABLET_MAX_WIDTH_PX,
  TRADE_DESK_TABLET_MIN_WIDTH_PX,
  TRADE_DESK_TABLET_TAB_COUNT,
  TRADE_DESK_TABLET_TAB_IDS,
  TRADE_DESK_VIEWPORT_HOOK_MODULE,
  resolveTradeDeskLayoutTier,
} from '../trade-mobile-layout-display-contract';
import { TRADE_DESK_LAYOUT_BREAKPOINTS } from '../trade-desk-layout-display-contract';
import { VIEWPORT_BREAKPOINTS } from '@/product/tokens/viewport-contract';

describe('trade-mobile-layout-display-contract §25.12.9.1-E #22–23', () => {
  it('registers P9 todo ids and mobile layout tokens', () => {
    expect(P9_TRADE_MOBILE_HISTORY_TAB_TODO).toBe('p9-trade-mobile-history-tab');
    expect(P9_TRADE_MOBILE_FUTURES_BOOK_TAB_TODO).toBe('p9-trade-mobile-futures-book-tab');
    expect(P2_MOBILE_375_SWIPE_TODO).toBe('p2-mobile-375-swipe');
    expect(TRADE_DESK_MOBILE_NARROW_SIGNOFF_WIDTH_PX).toBe(375);
    expect(TRADE_DESK_MOBILE_TAB_TOUCH_MIN_WIDTH_PX).toBe(44);
    expect(TRADE_DESK_MOBILE_TABLIST_CLASS).toBe('trade-desk-mobile-tablist');
    expect(TRADE_DESK_MOBILE_SWIPE_SURFACE_TESTID).toBe('trade-desk-mobile-swipe-surface');
    expect(TRADE_CHART_GESTURE_OWNER_ATTR).toBe('data-chart-gesture-owner');
    expect(TRADE_CHART_GESTURE_OWNER_SELECTOR).toBe('[data-chart-gesture-owner]');
    expect([...TRADE_DESK_MOBILE_SWIPE_TAB_IDS]).toEqual(['chart', 'trade']);
    expect(TRADE_DESK_MOBILE_ROOT_CLASS).toBe('trade-desk-mobile');
    expect(TRADE_DESK_MOBILE_TABS_CLASS).toBe('trade-desk-mobile-tabs');
    expect(TRADE_DESK_MOBILE_TRADE_STACK_CLASS).toBe('trade-desk-mobile-trade-stack');
    expect(TRADE_DESK_MOBILE_STICKY_CTA_CLASS).toBe('trade-desk-mobile-sticky-cta');
    expect(TRADE_DESK_MOBILE_LAYOUT_OWNERS).toEqual(
      expect.arrayContaining(['trade-desk-mobile-tabs.tsx', 'futures-desk-page.tsx']),
    );
  });

  it('locks chart|trade|positions|history 4-tab canon', () => {
    expect(TRADE_DESK_MOBILE_TAB_COUNT).toBe(4);
    expect([...TRADE_DESK_MOBILE_TAB_IDS]).toEqual(['chart', 'trade', 'positions', 'history']);
  });

  it('locks order|book trade subtab canon', () => {
    expect(TRADE_DESK_MOBILE_TRADE_SUBTAB_COUNT).toBe(2);
    expect([...TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS]).toEqual(['order', 'book']);
  });

  it('assertTradeMobileLayoutContractSync stays green', () => {
    expect(() => assertTradeMobileLayoutContractSync()).not.toThrow();
  });

  it('keeps trade desk desktop breakpoint aligned with trade-desk-layout SOT', () => {
    expect(TRADE_DESK_DESKTOP_MIN_WIDTH_PX).toBe(TRADE_DESK_LAYOUT_BREAKPOINTS.desktop);
    expect(TRADE_DESK_DESKTOP_MIN_WIDTH_PX).toBe(VIEWPORT_BREAKPOINTS.desktop);
    expect(TRADE_DESK_DESKTOP_MIN_WIDTH_PX).toBe(1024);
    expect(TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX).toBe(TRADE_DESK_DESKTOP_MIN_WIDTH_PX);
    expect(TRADE_DESK_VIEWPORT_HOOK_MODULE).toBe('features/trading/use-trade-desk-viewport.ts');
  });

  it('locks tablet tier 768–1023 with chart+ticket 2-col IA (P2-A)', () => {
    expect(TRADE_DESK_TABLET_MIN_WIDTH_PX).toBe(768);
    expect(TRADE_DESK_TABLET_MAX_WIDTH_PX).toBe(1023);
    expect(TRADE_DESK_TABLET_TAB_COUNT).toBe(3);
    expect([...TRADE_DESK_TABLET_TAB_IDS]).toEqual(['trade', 'positions', 'history']);
    expect(TRADE_DESK_TABLET_MAIN_GRID_TESTID).toBe('trade-desk-tablet-main-grid');
    expect(TRADE_DESK_MOBILE_LAYOUT_OWNERS).toEqual(
      expect.arrayContaining(['trade-desk-tablet-layout.tsx']),
    );
  });

  it('resolveTradeDeskLayoutTier maps smoke widths to mobile/tablet/desktop', () => {
    expect(resolveTradeDeskLayoutTier(375)).toBe('mobile');
    expect(resolveTradeDeskLayoutTier(390)).toBe('mobile');
    expect(resolveTradeDeskLayoutTier(767)).toBe('mobile');
    expect(resolveTradeDeskLayoutTier(768)).toBe('tablet');
    expect(resolveTradeDeskLayoutTier(1023)).toBe('tablet');
    expect(resolveTradeDeskLayoutTier(1024)).toBe('desktop');
  });
});
