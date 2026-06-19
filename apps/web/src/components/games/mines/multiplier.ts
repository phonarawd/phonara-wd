/**
 * Mines — display-only preview multiplier (1% house edge model).
 *
 * Server-side `minesMultiplier(mineCount, revealCount)` is the source of
 * truth. UI uses this for the BetConfirm summary and Stage stat strip.
 *
 *   picks ≤ 0           → "1.00"
 *   picks > (25 - mines)→ "1.00" (engine-impossible)
 *   otherwise           → Π (25-i)/(safe-i) × 0.99
 */
const GRID = 25;

export function minesPreviewMultiplier(revealCount: number, mineCount: number): string {
  const safe = GRID - mineCount;
  if (revealCount <= 0 || revealCount > safe) return "1.00";
  let m = 1;
  for (let i = 0; i < revealCount; i++) m *= (GRID - i) / (safe - i);
  return (m * 0.99).toFixed(2);
}

/** Engine-aligned alias to ease PHONARA paste. */
export const minesMultiplier = minesPreviewMultiplier;
