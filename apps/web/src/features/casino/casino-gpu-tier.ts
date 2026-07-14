/**
 * Casino canvas/WebGL performance tier (Phase 1A trust layer · shared).
 * `data-gpu-tier` did not exist anywhere in the repo before this file — only a
 * design-intent row in `DESIGN_PRINCIPLES.md` §8 Performance ("Canvas/WebGL tier
 * caps — data-gpu-tier · E2E engine flag"). This is the detection + reduced-effect
 * path that row assumes; Phase 1D wires it into the 4 Pixi games' own scene code.
 */

export type CasinoGpuTier = 'low' | 'standard';

/** DOM attribute mounted on `CasinoGameShell` — descendants read this ancestor for CSS/JS gating. */
export const CASINO_GPU_TIER_ATTRIBUTE = 'data-gpu-tier' as const;

/** `navigator.deviceMemory` (GB) at/under this forces the low tier — Chromium-only signal. */
export const CASINO_GPU_TIER_LOW_MAX_DEVICE_MEMORY_GB = 2;

/** `navigator.hardwareConcurrency` (logical cores) at/under this forces the low tier. */
export const CASINO_GPU_TIER_LOW_MAX_HARDWARE_CONCURRENCY = 2;

export type CasinoGpuTierSignals = {
  /** OS-level `prefers-reduced-motion: reduce` (§7 Accessibility Elevation). */
  prefersReducedMotion: boolean;
  /** `navigator.deviceMemory` — `null` when the browser does not expose it. */
  deviceMemoryGb: number | null;
  /** `navigator.hardwareConcurrency` — `null` when the browser does not expose it. */
  hardwareConcurrency: number | null;
  /** `navigator.connection.saveData` — `false` when unsupported/absent. */
  saveData: boolean;
  /** Same `VITE_PHONARA_E2E_ENGINE=1` flag that already stops the Pixi ticker (§23.4). */
  e2eEngineOff: boolean;
};

/**
 * Deterministic low-tier detection — any single signal is enough to force the
 * reduced-effect path. There is no partial/medium tier: the Motion & performance
 * acceptance criteria only define a "lowest supported data-gpu-tier" floor, so a
 * binary low/standard split is the smallest contract that satisfies it.
 */
export function resolveCasinoGpuTier(signals: CasinoGpuTierSignals): CasinoGpuTier {
  if (signals.prefersReducedMotion) return 'low';
  if (signals.e2eEngineOff) return 'low';
  if (signals.saveData) return 'low';
  if (
    signals.deviceMemoryGb !== null &&
    signals.deviceMemoryGb <= CASINO_GPU_TIER_LOW_MAX_DEVICE_MEMORY_GB
  ) {
    return 'low';
  }
  if (
    signals.hardwareConcurrency !== null &&
    signals.hardwareConcurrency <= CASINO_GPU_TIER_LOW_MAX_HARDWARE_CONCURRENCY
  ) {
    return 'low';
  }
  return 'standard';
}

/** Single boolean any canvas/Pixi consumer can branch on — the "reduced-effect path". */
export function isCasinoGpuTierReduced(tier: CasinoGpuTier): boolean {
  return tier === 'low';
}
