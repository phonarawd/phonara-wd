import { useEffect, useRef, useState } from "react";
import { usePageVisible } from "./usePageVisible";

/**
 * P1.5-B — Hot Multiplier rotator.
 *
 * Deterministic seeded sequence that shifts every ~6s with jitter.
 * Pauses entirely when tab hidden or `active === false`. SSR safe.
 */
export type HotMultiplier = {
  value: number;
  user: string;
  ago: string;
};

const USERS = [
  "lunar_42",
  "neo.kim",
  "pixel_owl",
  "drift_v",
  "mochi9",
  "axl_777",
  "qwx",
  "jade.k",
  "iru",
  "kong.0",
];

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function build(seed: number, take: number, offset: number): HotMultiplier[] {
  const rnd = seeded(seed + offset * 31);
  const out: HotMultiplier[] = [];
  for (let i = 0; i < take; i++) {
    const v = 1 + rnd() * rnd() * 48; // skew toward small, occasional big
    const u = USERS[(Math.floor(rnd() * USERS.length) + offset + i) % USERS.length];
    const ago = `${1 + Math.floor(rnd() * 58)}s`;
    out.push({ value: Number(v.toFixed(v >= 10 ? 1 : 2)), user: u ?? USERS[0]!, ago });
  }
  return out.sort((a, b) => b.value - a.value);
}

export function useHotMultipliers(
  seed: number,
  take = 6,
  active = true,
): HotMultiplier[] {
  const [tick, setTick] = useState(0);
  const visible = usePageVisible();
  const enabled = active && visible;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const schedule = () => {
      const delay = 5400 + Math.floor(Math.random() * 1400);
      timerRef.current = setTimeout(() => {
        if (!alive) return;
        setTick((t) => t + 1);
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      alive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled]);

  return build(seed, take, tick);
}
