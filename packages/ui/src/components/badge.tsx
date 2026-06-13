import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap tabular-nums shadow-[var(--surface-highlight)]',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface-2/70 text-muted',
        primary: 'border-primary/40 bg-primary/15 text-primary',
        accent: 'border-accent/40 bg-accent/15 text-accent',
        up: 'border-up/40 bg-up/15 text-up',
        down: 'border-down/40 bg-down/15 text-down',
        warning: 'border-warning/40 bg-warning/15 text-warning',
        trust: 'border-[var(--color-trust)]/40 bg-[var(--color-trust)]/15 text-[var(--color-trust)]',
        risk: 'border-[var(--color-risk)]/40 bg-[var(--color-risk)]/15 text-[var(--color-risk)]',
        info: 'border-[var(--color-info)]/40 bg-[var(--color-info)]/15 text-[var(--color-info)]',
      },
      size: {
        sm: 'px-2 py-0.5 text-[0.7rem]',
        md: 'px-2.5 py-1 text-xs',
      },
      density: {
        compact: 'min-h-6',
        comfortable: 'min-h-7',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md', density: 'comfortable' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/** Small status pill. Replaces bespoke status badges (e.g. liquidated/closed). */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone, size, density, ...props },
  ref,
) {
  return <span ref={ref} className={cn(badgeVariants({ tone, size, density }), className)} {...props} />;
});

Badge.displayName = 'Badge';
