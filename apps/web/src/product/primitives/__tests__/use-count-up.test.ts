import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatCountUpGrouped, useCountUp } from '@/product/primitives/lib/use-count-up';
import { resolveCountUpDurationMs } from '@/product/primitives/lib/motion-tier';

const matchMediaMock = vi.fn();

beforeEach(() => {
  matchMediaMock.mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }));
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matchMediaMock,
  });
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(performance.now());
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useCountUp §34.15 Signal Pulse', () => {
  it('snaps to target when reduced-motion is preferred', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: String(query).includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }));

    const { result, rerender } = renderHook(
      ({ target }: { target: string }) => useCountUp(target, { tier: 'L1' }),
      { initialProps: { target: '100.000000' } },
    );
    expect(result.current).toBe('100.000000');

    act(() => {
      rerender({ target: '200.000000' });
    });
    expect(result.current).toBe('200.000000');
  });

  it('snaps instantly for L2 financial tier', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: string }) => useCountUp(target, { tier: 'L2' }),
      { initialProps: { target: '10' } },
    );
    act(() => {
      rerender({ target: '99' });
    });
    expect(result.current).toBe('99');
    expect(resolveCountUpDurationMs('L2', false)).toBe(0);
  });

  it('returns target when disabled', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: string }) => useCountUp(target, { enabled: false }),
      { initialProps: { target: '1' } },
    );
    act(() => {
      rerender({ target: '50' });
    });
    expect(result.current).toBe('50');
  });

  it('formatCountUpGrouped groups integers without float math', () => {
    expect(formatCountUpGrouped('12000')).toBe('12,000');
    expect(formatCountUpGrouped('-1500')).toBe('-1,500');
  });
});
