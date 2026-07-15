import { useMemo } from 'react';

import { isPixiE2eEngineOff } from '@/domain/casino-games-batch-c-display-contract';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';

import { resolveCasinoGpuTier, type CasinoGpuTier } from './casino-gpu-tier';

type NavigatorWithPerfHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

function readDeviceMemoryGb(): number | null {
  if (typeof navigator === 'undefined') return null;
  const value = (navigator as NavigatorWithPerfHints).deviceMemory;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readHardwareConcurrency(): number | null {
  if (typeof navigator === 'undefined') return null;
  const value = navigator.hardwareConcurrency;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as NavigatorWithPerfHints).connection?.saveData ?? false;
}

/**
 * Casino trust-layer GPU tier (Phase 1A) — low-end device + E2E + reduced-motion
 * detection feeding `data-gpu-tier` on `CasinoGameShell`. Device signals (memory /
 * cores / save-data) are static for the session lifetime; only OS reduced-motion
 * is reactive, which is already reactive via `usePrefersReducedMotion`.
 */
export function useCasinoGpuTier(): CasinoGpuTier {
  const prefersReducedMotion = usePrefersReducedMotion();

  return useMemo(
    () =>
      resolveCasinoGpuTier({
        prefersReducedMotion,
        deviceMemoryGb: readDeviceMemoryGb(),
        hardwareConcurrency: readHardwareConcurrency(),
        saveData: readSaveData(),
        e2eEngineOff: isPixiE2eEngineOff(),
      }),
    [prefersReducedMotion],
  );
}
