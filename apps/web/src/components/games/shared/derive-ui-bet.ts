/**
 * PHONARA × Lovable — UI bet view derivers.
 *
 * The PHONARA `BetResponse` carries server-authoritative `status`,
 * `payout`, and a game-specific `result` payload. It does NOT carry a
 * UI-facing `multiplier` field — the adapter must derive it per game.
 *
 * These helpers are the SINGLE source for UI-side multiplier / win
 * derivation. Per-game branches that previously inlined
 * `result.cashedOut` / `result.cashoutMultiplier` are forbidden in
 * `useAutoBetQueue` and game Stages — call these helpers instead.
 */
import type { GameCode, UiBetView } from "./types";

type AnyResult = Record<string, unknown>;

/**
 * Derive the UI-facing multiplier string for a settled bet.
 *
 * Crash:
 *   - cashedOut === true && cashoutMultiplier > 0 → "X.XX"
 *   - otherwise undefined (loss / not-cashed-out — no multiplier shown)
 *
 * Other games: prefer `bet.multiplier` if already set, otherwise
 * fall back to `payout / stake` is left to callers (we never see stake here).
 */
export function deriveUiMultiplier(
  bet: Partial<UiBetView> | null | undefined,
  game?: GameCode,
): string | undefined {
  if (!bet) return undefined;
  const r = (bet.result ?? {}) as AnyResult;

  if (game === "crash") {
    const cashedOut = r['cashedOut'] === true;
    const m = Number(r['cashoutMultiplier'] ?? 0);
    if (cashedOut && Number.isFinite(m) && m >= 1.01) {
      return m.toFixed(2);
    }
    return undefined;
  }

  if (typeof bet.multiplier === "string" && bet.multiplier) return bet.multiplier;
  return undefined;
}

/**
 * Returns boolean | null for win/loss derivation.
 *  - true  = won  (UI should show celebration / strip green)
 *  - false = lost (UI should show neutral / strip dim)
 *  - null  = not yet settled / unknown
 *
 * Source-of-truth order:
 *   1. PHONARA `status` ('won' / 'lost') if present
 *   2. derived multiplier ≥ 1.01
 *   3. numeric `bet.multiplier` ≥ 1.01 fallback
 */
export function deriveUiWin(
  bet: Partial<UiBetView> | null | undefined,
  game?: GameCode,
): boolean | null {
  if (!bet) return null;
  if (bet.status === "won") return true;
  if (bet.status === "lost") return false;

  const derived = deriveUiMultiplier(bet, game);
  if (derived !== undefined) {
    const n = Number(derived);
    if (Number.isFinite(n)) return n >= 1.01;
  }

  const m = Number(bet.multiplier ?? "0");
  if (!Number.isFinite(m)) return null;
  return m >= 1.01;
}

/**
 * Build a `UiBetView` from a mock crash simulation result.
 *
 * Status is ALWAYS `'won' | 'lost'` — never `'settled'`. PHONARA
 * BetResponse uses the 6-literal union; `'settled'` is a Lovable
 * lifecycle enum value that has no place in the wire shape.
 *
 * Used ONLY by Lovable preview fixtures (removed in PHONARA paste).
 * PHONARA paste replaces this hook entirely.
 */
export function uiBetViewFromCrashSim(
  result: {
    crashMultiplier: number;
    cashedOut: boolean;
    cashoutMultiplier: number;
  },
  payout: string,
): UiBetView {
  const base: UiBetView = {
    status: "lost",
    payout,
    result,
  };
  const m = deriveUiMultiplier(base, "crash");
  const win = deriveUiWin(base, "crash");
  if (win === true && m !== undefined) {
    base.status = "won";
    base.multiplier = m;
  }
  return base;
}
