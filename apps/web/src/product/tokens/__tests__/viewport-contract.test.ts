import { describe, expect, it } from 'vitest';

import {
  CONTENT_SHELL_MAX_PX,
  expectsContentShellLetterbox,
  isAtLeastBreakpoint,
  isContentShellLetterboxOk,
  isUltrawideSmokeWidth,
  isViewportSmokeWidth,
  PANEL_MIN_PX,
  prefersContentShellCap,
  resolveViewportTier,
  tierMaxWidth,
  ULTRAWIDE_SMOKE_WIDTHS,
  VIEWPORT_BREAKPOINTS,
  VIEWPORT_SMOKE_WIDTHS,
  VIEWPORT_TIERS,
} from '@/product/tokens/viewport-contract';

describe('viewport-contract', () => {
  it('fixes the 4-tier smoke widths', () => {
    expect(VIEWPORT_SMOKE_WIDTHS).toEqual([390, 768, 1024, 2560]);
    expect(VIEWPORT_SMOKE_WIDTHS.every(isViewportSmokeWidth)).toBe(true);
    expect(isViewportSmokeWidth(375)).toBe(false);
  });

  it('keeps ultrawide smoke widths separate from the canonical 4-tier DoD', () => {
    expect(ULTRAWIDE_SMOKE_WIDTHS).toEqual([3440, 3840, 5120]);
    expect(ULTRAWIDE_SMOKE_WIDTHS.every(isUltrawideSmokeWidth)).toBe(true);
    expect(ULTRAWIDE_SMOKE_WIDTHS.every(expectsContentShellLetterbox)).toBe(true);
    for (const w of ULTRAWIDE_SMOKE_WIDTHS) {
      expect(isViewportSmokeWidth(w)).toBe(false);
      expect((VIEWPORT_SMOKE_WIDTHS as readonly number[]).includes(w)).toBe(false);
    }
    expect(isUltrawideSmokeWidth(2560)).toBe(false);
  });

  it('proves content-shell letterbox geometry for ultrawide harnesses', () => {
    expect(
      isContentShellLetterboxOk({
        viewportWidth: 3440,
        columnWidth: CONTENT_SHELL_MAX_PX,
        columnLeft: (3440 - CONTENT_SHELL_MAX_PX) / 2,
      }),
    ).toBe(true);
    expect(
      isContentShellLetterboxOk({
        viewportWidth: 1024,
        columnWidth: 1024,
        columnLeft: 0,
      }),
    ).toBe(false);
    expect(
      isContentShellLetterboxOk({
        viewportWidth: 5120,
        columnWidth: CONTENT_SHELL_MAX_PX + 40,
        columnLeft: 100,
      }),
    ).toBe(false);
  });

  it('aligns shell geometry tokens with layout.css contract', () => {
    expect(CONTENT_SHELL_MAX_PX).toBe(1680);
    expect(PANEL_MIN_PX).toBe(280);
  });

  it('resolves layout tiers across the 5-row breakpoint ladder', () => {
    expect(resolveViewportTier(320)).toBe('mobile');
    expect(resolveViewportTier(390)).toBe('mobile');
    expect(resolveViewportTier(479)).toBe('mobile');
    expect(resolveViewportTier(480)).toBe('mobilePlus');
    expect(resolveViewportTier(767)).toBe('mobilePlus');
    expect(resolveViewportTier(768)).toBe('tablet');
    expect(resolveViewportTier(1023)).toBe('tablet');
    expect(resolveViewportTier(1024)).toBe('desktop');
    expect(resolveViewportTier(1919)).toBe('desktop');
    expect(resolveViewportTier(1920)).toBe('ultra');
    expect(resolveViewportTier(2560)).toBe('ultra');
  });

  it('exposes tier max widths for test harnesses', () => {
    expect(tierMaxWidth('mobile')).toBe(VIEWPORT_BREAKPOINTS.mobilePlus - 1);
    expect(tierMaxWidth('ultra')).toBe(Number.POSITIVE_INFINITY);
    expect(VIEWPORT_TIERS).toHaveLength(5);
  });

  it('supports breakpoint helpers for responsive logic', () => {
    expect(isAtLeastBreakpoint(1024, 'desktop')).toBe(true);
    expect(isAtLeastBreakpoint(1023, 'desktop')).toBe(false);
    expect(prefersContentShellCap(1919)).toBe(false);
    expect(prefersContentShellCap(1920)).toBe(true);
  });
});
