/**
 * Trade desk ultra-wide layout — P9 WORLD step 21 (Plan §22.2.2 G5 · §25.4).
 * Panel min-width · chart 50% center at 2560+ · table overflow 0 · @container queries.
 *
 * Authority: TRADE_UX_CANON.md · layout.css `--ds-panel-min` · viewport-contract.ts
 */

import {
  TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX,
  TRADE_DESK_LAYOUT_BREAKPOINTS,
} from '@/domain/trade-desk-layout-display-contract';
import {
  CONTENT_SHELL_MAX_PX,
  PANEL_MIN_PX,
  VIEWPORT_BREAKPOINTS,
  VIEWPORT_SMOKE_WIDTHS,
} from '@/product/tokens/viewport-contract';

export const P9_TRADE_ULTRA_LAYOUT_TODO = 'p9-trade-ultra-layout' as const;

export const TRADE_DESK_PAGE_SHELL_CLASS = 'trade-desk-page' as const;
export const TRADE_DESK_MAIN_GRID_CLASS = 'trade-desk-main-grid' as const;
export const TRADE_DESK_SIDE_RAIL_CLASS = 'trade-desk-side-rail' as const;
export const TRADE_DESK_CHART_SLOT_CLASS = 'trade-desk-chart-slot' as const;
export const TRADE_DESK_TICKET_SLOT_CLASS = 'trade-desk-ticket-slot' as const;
export const TRADE_DESK_TABLE_SCROLL_CLASS = 'trade-desk-table-scroll' as const;
export const TRADE_DESK_BOTTOM_DOCK_SLOT_CLASS = 'trade-desk-bottom-dock-slot' as const;

/** Chart center column share at ultra (2560+) — §22.2.2 G5 */
export const TRADE_DESK_CHART_CENTER_FRACTION = 0.5 as const;

/** lg+ 3-panel grid: 1 : 2 : 1 → center chart 50% with side panel min-width preserved */
export const TRADE_DESK_DESKTOP_GRID_COLUMNS =
  'minmax(var(--ds-panel-min), 1fr) minmax(0, 2fr) minmax(var(--ds-panel-min), 1fr)' as const;

export const TRADE_DESK_ULTRA_SMOKE_WIDTH_PX = VIEWPORT_BREAKPOINTS.superwide;

/** @container trade-desk desktop enhancements — re-export P2-C SOT. */
export { TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX, TRADE_DESK_LAYOUT_BREAKPOINTS };

export const TRADE_DESK_ULTRA_LAYOUT_OWNERS = [
  'spot-desk-page.tsx',
  'futures-desk-page.tsx',
] as const;

export function assertTradeUltraLayoutContractSync(): void {
  if (PANEL_MIN_PX !== 280) {
    throw new Error('trade-ultra-layout: --ds-panel-min must stay 280px');
  }
  if (CONTENT_SHELL_MAX_PX !== 1680) {
    throw new Error('trade-ultra-layout: --ds-content-max drift');
  }
  if (TRADE_DESK_CHART_CENTER_FRACTION !== 0.5) {
    throw new Error('trade-ultra-layout: chart center fraction must be 50%');
  }
  if (!(VIEWPORT_SMOKE_WIDTHS as readonly number[]).includes(TRADE_DESK_ULTRA_SMOKE_WIDTH_PX)) {
    throw new Error('trade-ultra-layout: 2560 smoke width required');
  }
  if (TRADE_DESK_DESKTOP_GRID_COLUMNS.includes('var(--ds-panel-min)') !== true) {
    throw new Error('trade-ultra-layout: desktop grid must preserve panel min-width token');
  }
  if (TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX !== TRADE_DESK_LAYOUT_BREAKPOINTS.desktop) {
    throw new Error('trade-ultra-layout: container desktop min must mirror layout breakpoint SOT');
  }
}
