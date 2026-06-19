import { useEffect, useRef, useState } from "react";
import { usePageVisible } from "./usePageVisible";

/**
 * P1.1a — Live random-walk counter.
 *
 * SSR safe: returns `seed` on first render so server HTML matches client first paint.
 * After mount, walks ±0.8~3% every 1200-2500ms.
 * Honors `prefers-reduced-motion: reduce` — returns seed forever.
 *
 * Mock display-only. No engine/data dependency.
 */
export type UseLiveCountOptions = {
  /** Minimum step as fraction of current value. Default 0.008. */
  minPct?: number;
  /** Maximum step as fraction of current value. Default 0.03. */
  maxPct?: number;
  /** Minimum tick interval ms. Default 1200. */
  minIntervalMs?: number;
  /** Maximum tick interval ms. Default 2500. */
  maxIntervalMs?: number;
  /** Optional drift bias [-1..1] — positive trends up, negative trends down. Default 0.15 (slight upward). */
  drift?: number;
};

export function useLiveCount(seed: number, opts: UseLiveCountOptions & { active?: boolean } = {}) {
  const {
    minPct = 0.008,
    maxPct = 0.03,
    minIntervalMs = 1200,
    maxIntervalMs = 2500,
    drift = 0.15,
    active = true,
  } = opts;
  const visible = usePageVisible();
  const [value, setValue] = useState<number>(seed);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    if (!visible || !active) return;

    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const wait =
        minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs);
      timerRef.current = window.setTimeout(() => {
        setValue((curr) => {
          const pct = minPct + Math.random() * (maxPct - minPct);
          const direction = Math.random() < (1 + drift) / 2 ? 1 : -1;
          const delta = Math.max(1, Math.round(curr * pct));
          const next = curr + direction * delta;
          return Math.max(0, next);
        });
        schedule();
      }, wait);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [minPct, maxPct, minIntervalMs, maxIntervalMs, drift, visible, active]);

  return value;
}
