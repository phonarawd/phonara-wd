import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DA_W4_REDUCED_MOTION_MEDIA_QUERY } from '@/domain/da-w4-gate-motion-display-contract';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';

type MediaListener = (event: MediaQueryListEvent) => void;

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<MediaListener>();
  const media = {
    matches,
    media: DA_W4_REDUCED_MOTION_MEDIA_QUERY,
    addEventListener: vi.fn((event: string, listener: MediaListener) => {
      if (event === 'change') listeners.add(listener);
    }),
    removeEventListener: vi.fn((event: string, listener: MediaListener) => {
      if (event === 'change') listeners.delete(listener);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  };

  const matchMedia = vi.fn((query: string) => {
    expect(query).toBe(DA_W4_REDUCED_MOTION_MEDIA_QUERY);
    return media;
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matchMedia,
  });

  return {
    media,
    matchMedia,
    emitChange(next: boolean) {
      media.matches = next;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
  };
}

describe('usePrefersReducedMotion · DA W4 GATE regression', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when OS prefers motion', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion: reduce matches', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('subscribes to media change and updates preference', () => {
    const { emitChange } = stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      emitChange(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      emitChange(false);
    });
    expect(result.current).toBe(false);
  });

  it('removes change listener on unmount', () => {
    const { media } = stubMatchMedia(false);
    const { unmount } = renderHook(() => usePrefersReducedMotion());
    expect(media.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
