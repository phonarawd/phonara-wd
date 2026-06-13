import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export const progressVariants = cva(
  'relative overflow-hidden rounded-full border border-border bg-surface-inset shadow-[var(--surface-inset-shadow)]',
  {
    variants: {
      size: {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
      },
      tone: {
        primary: '[--progress-fill:var(--color-primary)]',
        up: '[--progress-fill:var(--color-up)]',
        down: '[--progress-fill:var(--color-down)]',
        warning: '[--progress-fill:var(--color-warning)]',
        danger: '[--progress-fill:var(--color-danger)]',
      },
    },
    defaultVariants: {
      size: 'md',
      tone: 'primary',
    },
  },
);

export interface ProgressProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof progressVariants> {
  value: number;
  label?: string;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, label, size, tone, className, ...props },
  ref,
) {
  const pct = clampPercent(value);

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn(progressVariants({ size, tone }), className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-[var(--progress-fill)] shadow-[var(--primary-glow)] transition-[width] duration-[var(--motion-duration-reveal)] ease-[var(--motion-ease-spring)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
});

Progress.displayName = 'Progress';
