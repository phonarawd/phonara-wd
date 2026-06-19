import { useEffect, useState } from "react";
import { usePageVisible } from "./usePageVisible";

/**
 * P1.2 — Tournament countdown hook.
 *
 * SSR safe: returns `seedMs` on first render so server HTML matches client first paint.
 * After mount, decrements by elapsed wall-clock every 1s.
 * Honors `prefers-reduced-motion: reduce` — value stays frozen at seed.
 */
export type CountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True when remaining <= 10 minutes — UI flips to urgent palette. */
  urgent: boolean;
};

function partsOf(ms: number): CountdownParts {
  const total = Math.max(0, ms);
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / 1000 / 60 / 60) % 24);
  const days = Math.floor(total / 1000 / 60 / 60 / 24);
  return {
    totalMs: total,
    days,
    hours,
    minutes,
    seconds,
    urgent: total <= 10 * 60 * 1000,
  };
}

export function useTournamentCountdown(seedMs: number): CountdownParts {
  const [remaining, setRemaining] = useState<number>(seedMs);
  const visible = usePageVisible();

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    if (!visible) return;

    const startedAt = Date.now();
    const baseline = remaining;
    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setRemaining(Math.max(0, baseline - elapsed));
    }, 1000);
    return () => window.clearInterval(id);
     
  }, [seedMs, visible]);

  return partsOf(remaining);
}
