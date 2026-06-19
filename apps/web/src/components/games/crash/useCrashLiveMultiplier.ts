/**
 * Crash · live multiplier replay (P2.0 LOCK v1.1).
 *
 * Replay only — drives the display number for the resolved bet's
 * `crashMultiplier`. Writes via `writeDisplayM(ref)` only; never
 * calls `setState` per frame.
 *
 * INVARIANTS:
 *  - No cashout decision derived from server crash mult. Engine-only.
 *  - Replay clock is local — does not pretend to be a live round clock.
 */
import { useEffect } from "react";
import { useGameLoop } from "../shared/hooks/useGameLoop";
import { useCrashRound } from "./CrashRoundContext";

/** Growth exponent matching the original Crash visual curve. */
const K = 0.85;

export function useCrashLiveMultiplier(input: {
  revealedCrashMult: number | null;
  auto: number;
  active: boolean;
}) {
  const round = useCrashRound();

  useEffect(() => {
    const revealedCrashMult = Number(input.revealedCrashMult ?? 0);
    if (!Number.isFinite(revealedCrashMult) || revealedCrashMult <= 0) return;
    round.resetRound({ revealedCrashMult, auto: Math.max(1.01, input.auto) });
  }, [input.revealedCrashMult, input.auto, round]);

  useGameLoop({
    active: input.active,
    update: () => {
      const s = round.state.current;
      if (s.phase !== "running") return;
      const t = (performance.now() - s.startedAt) / 1000;
      const m = Math.exp(K * t);
      if (m >= s.revealedCrashMult) {
        s.phase = "crashed";
        round.writeDisplayM(s.revealedCrashMult);
      } else {
        round.writeDisplayM(m);
      }
    },
  });
}

/** Pure helper for tests — replay m(t) curve. */
export function replayMultAt(tSeconds: number): number {
  return Math.exp(K * tSeconds);
}
