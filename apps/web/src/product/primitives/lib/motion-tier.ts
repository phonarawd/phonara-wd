/**
 * Digital Aurora motion tier helpers (§34.15–34.16).
 * L0 ambient · L1 surface · L2 financial (instant only).
 */

import {
  DA_W4_COUNT_UP_MAX_MS,
  type DaW4MotionTier,
} from '@/domain/da-w4-motion-system-display-contract';
import { MOTION_MS } from '@/product/tokens/motion';

export type { DaW4MotionTier };

/** True when Signal Pulse count-up may run (L0/L1 · not reduced-motion · not L2). */
export function allowsCountUpMotion(tier: DaW4MotionTier, prefersReducedMotion: boolean): boolean {
  if (prefersReducedMotion) return false;
  if (tier === 'L2') return false;
  return true;
}

/**
 * Count-up duration in ms — 0 when L2 / reduced-motion; otherwise ≤400ms SOT.
 * Time budget only — money interpolation stays Decimal in `useCountUp`.
 */
export function resolveCountUpDurationMs(
  tier: DaW4MotionTier,
  prefersReducedMotion: boolean,
): number {
  if (!allowsCountUpMotion(tier, prefersReducedMotion)) return 0;
  return Math.min(MOTION_MS.countUp, DA_W4_COUNT_UP_MAX_MS);
}
