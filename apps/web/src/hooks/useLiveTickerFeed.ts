import { useEffect, useState } from "react";
import { usePageVisible } from "./usePageVisible";

/**
 * P1.1a — Rotating non-repeating ticker feed.
 *
 * Given a pool of items, returns `visibleCount` items shifted forward every `intervalMs`.
 * `tick` increments each shift — pass as React `key` to retrigger enter animations.
 *
 * SSR safe: first render returns pool[0..visibleCount]; rotation starts on mount.
 * Honors `prefers-reduced-motion: reduce` — feed stays static.
 */
export function useLiveTickerFeed<T>(
  pool: readonly T[],
  visibleCount: number,
  intervalMs = 1800,
) {
  const [cursor, setCursor] = useState(0);
  const [tick, setTick] = useState(0);
  const visible = usePageVisible();

  useEffect(() => {
    if (pool.length === 0) return;
    if (!visible) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const id = window.setInterval(() => {
      setCursor((c) => (c + 1) % pool.length);
      setTick((n) => n + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [pool, intervalMs, visible]);

  if (pool.length === 0) return { items: [] as T[], tick };

  const items: T[] = [];
  const take = Math.min(visibleCount, pool.length);
  for (let i = 0; i < take; i++) {
    const item = pool[(cursor + i) % pool.length];
    if (item !== undefined) items.push(item);
  }
  return { items, tick };
}
