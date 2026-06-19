/**
 * Dice — local engine-parity multiplier helper (Phase 5 v1 RED LOCK v3.1).
 *
 * 1:1 mirror of PHONARA `packages/game-engine/src/games/dice.ts`:
 *   prob = direction === 'over' ? (9999 - floor(t*100)) / 10000
 *                                : floor(t*100) / 10000
 *   mult = Math.floor(99 / prob) / 100     // ← engine 정본
 *
 * Used by:
 *  - BetConfirm summary "예상 N×" (UI-only)
 *  - PHONARA adapter may derive multiplier from RPC settle or payout/stake
 *
 * PHONARA `BetResponse` has NO `multiplier` field. Paste-time the
 * adapter either injects `bet.multiplier` from the RPC settle or derives
 * it as `payout / stake`. This file must NEVER `import { diceMultiplier }
 * from '@phonara/game-engine'` — keep the formula local to Lovable.
 */
export function diceWinProbability(
  target: number,
  direction: "over" | "under",
): number {
  const c = Math.floor(target * 100);
  return direction === "over" ? (9999 - c) / 10000 : c / 10000;
}

export function diceMultiplier(
  target: number,
  direction: "over" | "under",
): number {
  const prob = diceWinProbability(target, direction);
  if (prob <= 0) return 0;
  return Math.floor(99 / prob) / 100;
}
