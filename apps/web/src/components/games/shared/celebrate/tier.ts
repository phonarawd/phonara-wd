export type CelebrationTier = "none" | "small" | "nice" | "big" | "huge" | "mega" | "ultra";

/**
 * Map realized multiplier → 6-tier celebration (plus "none").
 * Contract: never trigger off raw payout; multiplier is authoritative.
 */
export function celebrationTier(multiplier: number): CelebrationTier {
  if (!Number.isFinite(multiplier) || multiplier < 1) return "none";
  if (multiplier < 2) return "small";
  if (multiplier < 5) return "nice";
  if (multiplier < 10) return "big";
  if (multiplier < 50) return "huge";
  if (multiplier < 250) return "mega";
  return "ultra";
}
