/**
 * HiLo — UI-only expected multiplier for BetConfirm summary.
 *
 * **Not** sourced from `bet.result`. The engine truth lives in
 * `result.rounds[].multiplier` after settlement; this helper estimates
 * the multiplier you would land on if every queued guess hits, for the
 * confirm dialog headline only.
 *
 * Preview model (1% house edge, 1.1× per non-skip guess):
 *   m = 0.99 · 1.1^(guesses without skip)
 */
export function expectedMultiplierFromGuesses(
  guesses: ("higher" | "lower" | "skip")[],
): string {
  const n = guesses.filter((g) => g !== "skip").length;
  if (n <= 0) return "1.00";
  const m = 0.99 * Math.pow(1.1, n);
  return m.toFixed(2);
}
