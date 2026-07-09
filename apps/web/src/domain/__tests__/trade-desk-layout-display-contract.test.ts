import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertTradeDeskLayoutBreakpointSync,
  P2_BREAKPOINT_UNIFY_TODO,
  TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX,
  TRADE_DESK_LAYOUT_BREAKPOINT_OWNERS,
  TRADE_DESK_LAYOUT_BREAKPOINTS,
  TRADE_DESK_LAYOUT_CSS_MODULE,
} from '../trade-desk-layout-display-contract';
import { VIEWPORT_BREAKPOINTS } from '@/product/tokens/viewport-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');

function readTradeDeskLayoutCss(): string {
  return readFileSync(resolve(WEB_SRC, TRADE_DESK_LAYOUT_CSS_MODULE), 'utf8');
}

describe('trade-desk-layout-display-contract P2-C breakpoint unify', () => {
  it('registers P2 todo and layout breakpoint owners', () => {
    expect(P2_BREAKPOINT_UNIFY_TODO).toBe('p2-breakpoint-unify');
    expect(TRADE_DESK_LAYOUT_BREAKPOINT_OWNERS).toEqual(
      expect.arrayContaining(['trade-desk-layout.css', 'use-trade-desk-viewport.ts']),
    );
  });

  it('locks mobile/tablet/desktop 3-tier breakpoints to viewport-contract SOT', () => {
    expect(TRADE_DESK_LAYOUT_BREAKPOINTS).toEqual({
      mobile: VIEWPORT_BREAKPOINTS.mobile,
      tablet: VIEWPORT_BREAKPOINTS.tablet,
      desktop: VIEWPORT_BREAKPOINTS.desktop,
    });
    expect(TRADE_DESK_LAYOUT_BREAKPOINTS).toEqual({
      mobile: 390,
      tablet: 768,
      desktop: 1024,
    });
  });

  it('aligns @container desktop min with JS desktop tier (not wide/1280)', () => {
    expect(TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX).toBe(VIEWPORT_BREAKPOINTS.desktop);
    expect(TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX).toBe(1024);
    expect(TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX).not.toBe(VIEWPORT_BREAKPOINTS.wide);
  });

  it('assertTradeDeskLayoutBreakpointSync stays green', () => {
    expect(() => assertTradeDeskLayoutBreakpointSync()).not.toThrow();
  });

  it('trade-desk-layout.css uses container desktop min from contract (no 1280 split-brain)', () => {
    const css = readTradeDeskLayoutCss();
    const containerDesktop = `${TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX}px`;

    expect(css).not.toMatch(/@container trade-desk \(min-width: 1280px\)/);
    expect(css).toContain(`@container trade-desk (min-width: ${containerDesktop})`);
    expect((css.match(/@container trade-desk \(min-width: 1280px\)/g) ?? []).length).toBe(0);
    expect(
      (
        css.match(
          new RegExp(
            `@container trade-desk \\(min-width: ${TRADE_DESK_CONTAINER_DESKTOP_MIN_WIDTH_PX}px\\)`,
            'g',
          ),
        ) ?? []
      ).length,
    ).toBeGreaterThanOrEqual(3);
  });
});
