import { describe, expect, it } from 'vitest';

import {
  CASINO_GPU_TIER_ATTRIBUTE,
  CASINO_GPU_TIER_LOW_MAX_DEVICE_MEMORY_GB,
  CASINO_GPU_TIER_LOW_MAX_HARDWARE_CONCURRENCY,
  isCasinoGpuTierReduced,
  resolveCasinoGpuTier,
  type CasinoGpuTierSignals,
} from '../casino-gpu-tier';

const STANDARD_SIGNALS: CasinoGpuTierSignals = {
  prefersReducedMotion: false,
  deviceMemoryGb: 8,
  hardwareConcurrency: 8,
  saveData: false,
  e2eEngineOff: false,
};

describe('casino-gpu-tier (phase1a-trust-layer)', () => {
  it('locks the DOM attribute name and low-tier thresholds', () => {
    expect(CASINO_GPU_TIER_ATTRIBUTE).toBe('data-gpu-tier');
    expect(CASINO_GPU_TIER_LOW_MAX_DEVICE_MEMORY_GB).toBe(2);
    expect(CASINO_GPU_TIER_LOW_MAX_HARDWARE_CONCURRENCY).toBe(2);
  });

  it('resolves standard tier when every signal is healthy', () => {
    expect(resolveCasinoGpuTier(STANDARD_SIGNALS)).toBe('standard');
  });

  it('forces low tier on OS prefers-reduced-motion', () => {
    expect(resolveCasinoGpuTier({ ...STANDARD_SIGNALS, prefersReducedMotion: true })).toBe('low');
  });

  it('forces low tier under the E2E engine-off flag', () => {
    expect(resolveCasinoGpuTier({ ...STANDARD_SIGNALS, e2eEngineOff: true })).toBe('low');
  });

  it('forces low tier when the browser requests save-data', () => {
    expect(resolveCasinoGpuTier({ ...STANDARD_SIGNALS, saveData: true })).toBe('low');
  });

  it('forces low tier at/under the device-memory threshold, not above it', () => {
    expect(resolveCasinoGpuTier({ ...STANDARD_SIGNALS, deviceMemoryGb: 2 })).toBe('low');
    expect(resolveCasinoGpuTier({ ...STANDARD_SIGNALS, deviceMemoryGb: 1 })).toBe('low');
    expect(resolveCasinoGpuTier({ ...STANDARD_SIGNALS, deviceMemoryGb: 4 })).toBe('standard');
  });

  it('forces low tier at/under the hardware-concurrency threshold, not above it', () => {
    expect(resolveCasinoGpuTier({ ...STANDARD_SIGNALS, hardwareConcurrency: 2 })).toBe('low');
    expect(resolveCasinoGpuTier({ ...STANDARD_SIGNALS, hardwareConcurrency: 1 })).toBe('low');
    expect(resolveCasinoGpuTier({ ...STANDARD_SIGNALS, hardwareConcurrency: 4 })).toBe('standard');
  });

  it('treats unsupported (null) device signals as healthy, not low', () => {
    expect(
      resolveCasinoGpuTier({
        ...STANDARD_SIGNALS,
        deviceMemoryGb: null,
        hardwareConcurrency: null,
      }),
    ).toBe('standard');
  });

  it('isCasinoGpuTierReduced maps low → true, standard → false', () => {
    expect(isCasinoGpuTierReduced('low')).toBe(true);
    expect(isCasinoGpuTierReduced('standard')).toBe(false);
  });
});
