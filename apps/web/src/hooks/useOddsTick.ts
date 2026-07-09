// S1/F26 — live odds tick · string-only math · mock SOT
// no Number() · no parseFloat · no float arithmetic.
// hard guard: live === false → tick 0.
import { useEffect, useRef, useState } from 'react';
import { addDecimalStrings } from '@/lib/display-odds-multiply';

export interface OddsTick {
  odds: string;
  dir: 'up' | 'down' | null;
}

function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useOddsTick(outcomeId: string, baseOdds: string, live: boolean): OddsTick {
  const [odds, setOdds] = useState<string>(baseOdds);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);
  const seedRef = useRef<number>(hashSeed(outcomeId));
  const clearRef = useRef<(() => void) | null>(null);

  // Reset if base odds change externally.
  useEffect(() => {
    setOdds(baseOdds);
    setDir(null);
  }, [baseOdds]);

  useEffect(() => {
    // Hard guard — non-live fixtures get no ticks.
    if (!live) return;
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let timer: number | undefined;

    const schedule = () => {
      // 8~15s interval, deterministic per outcome seed.
      const seed = seedRef.current;
      const span = 7000;
      const wait = 8000 + (seed % span);
      timer = window.setTimeout(() => {
        if (cancelled) return;
        if (document.visibilityState === 'hidden') {
          schedule();
          return;
        }
        // pick step + direction from seed
        const s = seedRef.current;
        const upBit = (s & 1) === 1;
        const bigStep = (s & 2) === 2;
        const step = bigStep ? '0.05' : '0.01';
        const nextDir: 'up' | 'down' = upBit ? 'up' : 'down';
        setOdds((prev) => {
          const next =
            nextDir === 'up' ? addDecimalStrings(prev, step) : addDecimalStrings(prev, `-${step}`);
          // floor guard at 1.01 — display only
          if (next.startsWith('-') || next === '0.00' || next === '1.00') {
            return addDecimalStrings(prev, step);
          }
          return next;
        });
        setDir(nextDir);
        // advance seed
        seedRef.current = (seedRef.current * 1103515245 + 12345) >>> 0;
        // clear flash after 600ms
        window.setTimeout(() => {
          if (!cancelled) setDir(null);
        }, 600);
        schedule();
      }, wait);
    };

    schedule();
    const cleanup = () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
    clearRef.current = cleanup;
    return cleanup;
  }, [live, outcomeId]);

  return { odds, dir };
}
