/**
 * Signal Pulse — display-only count-up ≤400ms (§34.15 · PRODUCT_EXPERIENCE_CANON §5).
 * Interpolates Decimal strings only — no JS Number money math · RPC target unchanged.
 */

import { toDecimal } from '@phonara/money';
import { useEffect, useRef, useState } from 'react';

import type { DaW4MotionTier } from '@/domain/da-w4-motion-system-display-contract';
import { resolveCountUpDurationMs } from '@/product/primitives/lib/motion-tier';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';

const DECIMAL_RE = /^-?\d+(\.\d+)?$/;

export interface UseCountUpOptions {
  /** When false, always returns `target` (no animation). Default true. */
  enabled?: boolean;
  /** L2 financial → instant. Default L1. */
  tier?: DaW4MotionTier;
  /** Override duration ms (still capped by resolveCountUpDurationMs). */
  durationMs?: number;
}

function sanitizeTarget(value: string): string {
  if (!DECIMAL_RE.test(value)) return '0';
  return value;
}

/**
 * Animates from previous target → new target over ≤400ms.
 * Reduced-motion / L2 / disabled → snap to target immediately.
 */
export function useCountUp(target: string, options: UseCountUpOptions = {}): string {
  const { enabled = true, tier = 'L1', durationMs } = options;
  const prefersReduced = usePrefersReducedMotion();
  const safeTarget = sanitizeTarget(target);

  const [display, setDisplay] = useState(safeTarget);
  const displayRef = useRef(safeTarget);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const resolvedDuration =
      durationMs != null
        ? Math.min(durationMs, resolveCountUpDurationMs(tier, prefersReduced))
        : resolveCountUpDurationMs(tier, prefersReduced);

    if (!enabled || resolvedDuration <= 0 || displayRef.current === safeTarget) {
      displayRef.current = safeTarget;
      setDisplay(safeTarget);
      return;
    }

    const from = toDecimal(sanitizeTarget(displayRef.current));
    const to = toDecimal(safeTarget);
    const delta = to.sub(from);
    const started = performance.now();

    const tick = (now: number) => {
      const elapsed = now - started;
      const progressBps = Math.min(10_000, Math.round((elapsed / resolvedDuration) * 10_000));
      // easeOutCubic on integer bps — money path stays Decimal
      const t = progressBps / 10_000;
      const easedBps = Math.round((1 - (1 - t) ** 3) * 10_000);
      const current = from.add(delta.mul(easedBps).div(10_000));
      // Preserve target scale when possible (trim trailing zeros via toFixed on target dp)
      const dp = Math.max(fractionDigits(safeTarget), fractionDigits(displayRef.current));
      const next = current.toFixed(dp);
      displayRef.current = next;
      setDisplay(next);

      if (progressBps >= 10_000) {
        displayRef.current = safeTarget;
        setDisplay(safeTarget);
        frameRef.current = null;
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [safeTarget, enabled, tier, prefersReduced, durationMs]);

  return display;
}

function fractionDigits(value: string): number {
  const i = value.indexOf('.');
  return i < 0 ? 0 : value.length - i - 1;
}

/** Grouped integer/decimal string for XP-style displays (no currency). */
export function formatCountUpGrouped(value: string, maxFractionDigits = 0): string {
  const safe = sanitizeTarget(value);
  const d = toDecimal(safe).toDecimalPlaces(maxFractionDigits);
  const fixed = maxFractionDigits > 0 ? d.toFixed(maxFractionDigits) : d.toFixed(0);
  const negative = fixed.startsWith('-');
  const raw = negative ? fixed.slice(1) : fixed;
  const [whole = '0', frac] = raw.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const body = frac != null && maxFractionDigits > 0 ? `${grouped}.${frac}` : grouped;
  return negative ? `-${body}` : body;
}
