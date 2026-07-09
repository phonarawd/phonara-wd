import { describe, expect, it } from 'vitest';

import {
  assertTradeUltraLayoutContractSync,
  P9_TRADE_ULTRA_LAYOUT_TODO,
  TRADE_DESK_CHART_CENTER_FRACTION,
  TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX,
  TRADE_DESK_DESKTOP_GRID_COLUMNS,
  TRADE_DESK_MAIN_GRID_CLASS,
  TRADE_DESK_PAGE_SHELL_CLASS,
  TRADE_DESK_TABLE_SCROLL_CLASS,
  TRADE_DESK_ULTRA_LAYOUT_OWNERS,
  TRADE_DESK_ULTRA_SMOKE_WIDTH_PX,
} from '../trade-ultra-layout-display-contract';
import { CONTENT_SHELL_MAX_PX, PANEL_MIN_PX } from '@/product/tokens/viewport-contract';

describe('trade-ultra-layout-display-contract §25.12.9.1-E #21', () => {
  it('registers P9 todo id and layout class tokens', () => {
    expect(P9_TRADE_ULTRA_LAYOUT_TODO).toBe('p9-trade-ultra-layout');
    expect(TRADE_DESK_PAGE_SHELL_CLASS).toBe('trade-desk-page');
    expect(TRADE_DESK_MAIN_GRID_CLASS).toBe('trade-desk-main-grid');
    expect(TRADE_DESK_TABLE_SCROLL_CLASS).toBe('trade-desk-table-scroll');
    expect(TRADE_DESK_ULTRA_LAYOUT_OWNERS).toEqual(
      expect.arrayContaining(['spot-desk-page.tsx', 'futures-desk-page.tsx']),
    );
  });

  it('keeps chart center at 50% and panel min-width token parity', () => {
    expect(TRADE_DESK_CHART_CENTER_FRACTION).toBe(0.5);
    expect(TRADE_DESK_DESKTOP_GRID_COLUMNS).toContain('var(--ds-panel-min)');
    expect(TRADE_DESK_DESKTOP_GRID_COLUMNS).toContain('2fr');
    expect(PANEL_MIN_PX).toBe(280);
    expect(CONTENT_SHELL_MAX_PX).toBe(1680);
    expect(TRADE_DESK_ULTRA_SMOKE_WIDTH_PX).toBe(2560);
  });

  it('keeps container desktop min aligned with layout breakpoint SOT (P2-C)', () => {
    expect(TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX).toBe(1024);
  });

  it('assertTradeUltraLayoutContractSync stays green', () => {
    expect(() => assertTradeUltraLayoutContractSync()).not.toThrow();
  });
});
