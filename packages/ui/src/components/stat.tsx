import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const statValueVariants = cva('font-[var(--font-weight-numeric)] tabular-nums tracking-[var(--tracking-numeric)]', {
  variants: {
    tone: {
      default: 'text-fg',
      up: 'text-up',
      down: 'text-down',
      warning: 'text-warning',
      muted: 'text-muted',
    },
    emphasis: {
      body: 'text-[length:var(--text-body)]',
      title: 'text-[length:var(--text-heading)]',
      hero: 'text-[length:var(--text-title)] leading-[var(--leading-title)]',
    },
  },
  defaultVariants: { tone: 'default', emphasis: 'body' },
});

export interface StatProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof statValueVariants> {
  /** Pre-translated label. */
  label: ReactNode;
  /** Pre-formatted value (use @phonara/money formatters for amounts). */
  value: ReactNode;
  /** `between` = label/value on one row (preview rows); `stack` = label above value (grids). */
  layout?: 'between' | 'stack';
  density?: 'compact' | 'comfortable';
}

/**
 * Label/value pair. Replaces bespoke `.preview-row` and position-grid cells.
 * Amounts must be pre-formatted via @phonara/money (no float here).
 */
export const Stat = forwardRef<HTMLDivElement, StatProps>(function Stat(
  { className, label, value, tone, emphasis, layout = 'between', density = 'comfortable', ...props },
  ref,
) {
  const stack = layout === 'stack';
  return (
    <div
      ref={ref}
      className={cn(
        stack ? 'flex flex-col' : 'flex items-baseline justify-between gap-4',
        density === 'compact' ? 'gap-0.5 text-xs' : 'gap-1 text-sm',
        className,
      )}
      {...props}
    >
      <span className="text-muted">{label}</span>
      <span className={statValueVariants({ tone, emphasis })}>{value}</span>
    </div>
  );
});

Stat.displayName = 'Stat';
