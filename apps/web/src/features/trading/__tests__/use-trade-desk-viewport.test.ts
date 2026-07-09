import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TRADE_DESK_DESKTOP_MIN_WIDTH_PX,
  TRADE_DESK_TABLET_MIN_WIDTH_PX,
  TRADE_DESK_VIEWPORT_HOOK_MODULE,
} from '@/domain/trade-mobile-layout-display-contract';

import { useTradeDeskViewport } from '../use-trade-desk-viewport';

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<() => void>();

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: (_event: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_event: string, listener: () => void) => {
      listeners.delete(listener);
    },
  })) as typeof window.matchMedia;

  return {
    setMatches(next: boolean) {
      matches = next;
      listeners.forEach((listener) => listener());
    },
  };
}

function mockInnerWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

describe('useTradeDeskViewport', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('registers contract desktop breakpoint and hook module', () => {
    expect(TRADE_DESK_DESKTOP_MIN_WIDTH_PX).toBe(1024);
    expect(TRADE_DESK_TABLET_MIN_WIDTH_PX).toBe(768);
    expect(TRADE_DESK_VIEWPORT_HOOK_MODULE).toBe('features/trading/use-trade-desk-viewport.ts');
  });

  it('subscribes to desktop and tablet min-width media queries', () => {
    mockMatchMedia(false);
    mockInnerWidth(390);
    renderHook(() => useTradeDeskViewport());
    expect(window.matchMedia).toHaveBeenCalledWith(
      `(min-width: ${TRADE_DESK_DESKTOP_MIN_WIDTH_PX}px)`,
    );
    expect(window.matchMedia).toHaveBeenCalledWith(
      `(min-width: ${TRADE_DESK_TABLET_MIN_WIDTH_PX}px)`,
    );
  });

  it('returns desktop tier at 1024+', () => {
    mockMatchMedia(true);
    mockInnerWidth(1024);
    const { result } = renderHook(() => useTradeDeskViewport());
    expect(result.current).toEqual({
      layoutTier: 'desktop',
      isDesktop: true,
      isTablet: false,
      isMobile: false,
    });
  });

  it('returns tablet tier at 768–1023', () => {
    mockMatchMedia(false);
    mockInnerWidth(768);
    const { result } = renderHook(() => useTradeDeskViewport());
    expect(result.current).toEqual({
      layoutTier: 'tablet',
      isDesktop: false,
      isTablet: true,
      isMobile: false,
    });
  });

  it('returns mobile tier below 768', () => {
    mockMatchMedia(false);
    mockInnerWidth(390);
    const { result } = renderHook(() => useTradeDeskViewport());
    expect(result.current).toEqual({
      layoutTier: 'mobile',
      isDesktop: false,
      isTablet: false,
      isMobile: true,
    });
  });
});
