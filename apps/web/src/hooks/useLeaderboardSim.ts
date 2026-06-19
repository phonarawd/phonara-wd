import { useEffect, useRef, useState } from "react";
import type { LeaderboardEntry } from "@/data/casino-tournaments";
import { usePageVisible } from "./usePageVisible";

/**
 * P1.2 — Leaderboard rank-movement simulator.
 *
 * SSR safe: returns the seed array on first render (with `delta: 0`).
 * After mount, every 2200~3400ms:
 *   - bumps a random row's `wagered` by ±0.4~1.8%
 *   - re-sorts by wagered desc
 *   - emits `delta` = previousRank - newRank for the moved row
 * Honors `prefers-reduced-motion: reduce` — feed stays static.
 */
export type SimEntry = LeaderboardEntry & {
  /** Rank change since previous tick: + means moved up, - means moved down. */
  delta: number;
  /** Monotonic tick id — pass as React key to retrigger enter animations. */
  tick: number;
};

const MIN_TICK_MS = 2200;
const MAX_TICK_MS = 3400;

export function useLeaderboardSim(seed: readonly LeaderboardEntry[]): SimEntry[] {
  const [entries, setEntries] = useState<SimEntry[]>(() =>
    seed.map((e) => ({ ...e, delta: 0, tick: 0 })),
  );
  const tickRef = useRef(0);
  const visible = usePageVisible();

  useEffect(() => {
    if (seed.length === 0) return;
    if (!visible) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let cancelled = false;
    let timerId: number | null = null;

    const schedule = () => {
      if (cancelled) return;
      const wait =
        MIN_TICK_MS + Math.random() * (MAX_TICK_MS - MIN_TICK_MS);
      timerId = window.setTimeout(() => {
        setEntries((prev) => {
          if (prev.length === 0) return prev;
          tickRef.current += 1;
          const tick = tickRef.current;
          const idx = Math.floor(Math.random() * prev.length);
          const pct = 0.004 + Math.random() * 0.014;
          const direction = Math.random() < 0.7 ? 1 : -1;
          const row = prev[idx];
          if (!row) return prev;
          const movedUser = row.user;
          const bumped = prev.map((row, i) =>
            i === idx
              ? {
                  ...row,
                  wagered: Math.max(
                    0,
                    Math.round(row.wagered * (1 + direction * pct)),
                  ),
                }
              : row,
          );
          // re-sort desc by wagered
          const sorted = [...bumped].sort((a, b) => b.wagered - a.wagered);
          return sorted.map((row, i) => {
            const previousRank = row.rank;
            const newRank = i + 1;
            const isMoved = row.user === movedUser;
            return {
              ...row,
              rank: newRank,
              delta: isMoved ? previousRank - newRank : 0,
              tick: isMoved ? tick : row.tick,
            };
          });
        });
        schedule();
      }, wait);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [seed, visible]);

  return entries;
}
