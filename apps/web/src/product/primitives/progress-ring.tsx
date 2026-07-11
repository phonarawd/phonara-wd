import { useEffect, useState } from 'react';

import { cn } from '@/product/primitives/lib/cn';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';

export interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: 'default' | 'accent' | 'success';
  /**
   * §34.26 VIP XP fill — animate from 0 → value on mount (L1).
   * Reduced-motion → snap to value.
   */
  fillOnMount?: boolean;
  className?: string;
  'aria-label': string;
}

const TONE_STROKE: Record<NonNullable<ProgressRingProps['tone']>, string> = {
  default: 'stroke-line',
  accent: 'stroke-accent',
  success: 'stroke-success',
};

/** SVG progress ring — tier/mission reuse (§25.2 · stroke-dashoffset transition). */
export function ProgressRing({
  value,
  size = 48,
  strokeWidth = 3,
  tone = 'default',
  fillOnMount = false,
  className,
  'aria-label': ariaLabel,
}: ProgressRingProps) {
  const prefersReduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(!fillOnMount || prefersReduced);

  useEffect(() => {
    if (!fillOnMount || prefersReduced) {
      setMounted(true);
      return;
    }
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, [fillOnMount, prefersReduced]);

  const clamped = Math.min(100, Math.max(0, value));
  const displayValue = mounted ? clamped : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayValue / 100) * circumference;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0 -rotate-90', className)}
      role="img"
      aria-label={ariaLabel}
      data-fill-on-mount={fillOnMount ? 'true' : undefined}
      data-fill-ready={mounted ? 'true' : 'false'}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        className="stroke-surface-raised"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        className={cn(
          TONE_STROKE[tone],
          'transition-[stroke-dashoffset] duration-(--ds-motion-surface)',
        )}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
