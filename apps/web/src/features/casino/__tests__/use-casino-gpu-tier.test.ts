import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const isPixiE2eEngineOffMock = vi.hoisted(() => vi.fn(() => false));
const usePrefersReducedMotionMock = vi.hoisted(() => vi.fn(() => false));

vi.mock('@/domain/casino-games-batch-c-display-contract', () => ({
  isPixiE2eEngineOff: () => isPixiE2eEngineOffMock(),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => usePrefersReducedMotionMock(),
}));

import { useCasinoGpuTier } from '../use-casino-gpu-tier';

function stubNavigator(overrides: {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  saveData?: boolean;
}) {
  if (overrides.deviceMemory !== undefined) {
    Object.defineProperty(navigator, 'deviceMemory', {
      configurable: true,
      value: overrides.deviceMemory,
    });
  }
  if (overrides.hardwareConcurrency !== undefined) {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: overrides.hardwareConcurrency,
    });
  }
  if (overrides.saveData !== undefined) {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: overrides.saveData },
    });
  }
}

describe('useCasinoGpuTier (phase1a-trust-layer)', () => {
  beforeEach(() => {
    isPixiE2eEngineOffMock.mockReturnValue(false);
    usePrefersReducedMotionMock.mockReturnValue(false);
    stubNavigator({ deviceMemory: 8, hardwareConcurrency: 8, saveData: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves standard on a healthy desktop-class device', () => {
    const { result } = renderHook(() => useCasinoGpuTier());
    expect(result.current).toBe('standard');
  });

  it('resolves low when OS prefers-reduced-motion is on', () => {
    usePrefersReducedMotionMock.mockReturnValue(true);
    const { result } = renderHook(() => useCasinoGpuTier());
    expect(result.current).toBe('low');
  });

  it('resolves low under the E2E engine-off flag', () => {
    isPixiE2eEngineOffMock.mockReturnValue(true);
    const { result } = renderHook(() => useCasinoGpuTier());
    expect(result.current).toBe('low');
  });

  it('resolves low on a low-memory device', () => {
    stubNavigator({ deviceMemory: 2, hardwareConcurrency: 8, saveData: false });
    const { result } = renderHook(() => useCasinoGpuTier());
    expect(result.current).toBe('low');
  });

  it('resolves low on a low-core-count device', () => {
    stubNavigator({ deviceMemory: 8, hardwareConcurrency: 2, saveData: false });
    const { result } = renderHook(() => useCasinoGpuTier());
    expect(result.current).toBe('low');
  });

  it('resolves standard when deviceMemory/hardwareConcurrency are unsupported (undefined)', () => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: undefined,
    });
    const { result } = renderHook(() => useCasinoGpuTier());
    expect(result.current).toBe('standard');
  });
});
