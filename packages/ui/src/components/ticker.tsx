import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import {
  AnimatedNumber,
  compareDecimalLike,
  type DecimalLike,
  type NumberDirection,
} from './animated-number';

export const tickerVariants = cva(
  'inline-flex min-w-0 items-center gap-2 rounded-full border tabular-nums transition-[border-color,background-color,box-shadow] duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)]',
  {
    variants: {
      density: {
        compact: 'min-h-[var(--density-compact-control)] px-3 text-[length:var(--text-label)]',
        comfortable: 'min-h-[var(--density-comfortable-control)] px-4 text-[length:var(--text-body)]',
      },
      direction: {
        up: 'border-up/35 bg-up/10 shadow-[0_0_20px_color-mix(in_srgb,var(--color-up)_16%,transparent)]',
        down: 'border-down/35 bg-down/10 shadow-[0_0_20px_color-mix(in_srgb,var(--color-down)_16%,transparent)]',
        flat: 'border-border bg-surface/80',
      },
    },
    defaultVariants: {
      density: 'compact',
      direction: 'flat',
    },
  },
);

export interface TickerProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof tickerVariants> {
  value: DecimalLike;
  previousValue?: DecimalLike;
  label?: ReactNode;
  suffix?: ReactNode;
  format?: (value: string) => string;
  direction?: NumberDirection;
}

export const Ticker = forwardRef<HTMLSpanElement, TickerProps>(function Ticker(
  {
    value,
    previousValue,
    label,
    suffix,
    format,
    direction: directionOverride,
    density,
    className,
    ...props
  },
  ref,
) {
  const direction =
    directionOverride ?? (previousValue ? compareDecimalLike(value, previousValue) : 'flat');

  return (
    <span
      ref={ref}
      className={cn(tickerVariants({ density, direction }), className)}
      data-direction={direction}
      {...props}
    >
      {label ? <span className="truncate text-muted">{label}</span> : null}
      <AnimatedNumber
        value={value}
        format={format}
        tone={direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'neutral'}
        emphasis="label"
        className="min-w-0"
      />
      {suffix ? <span className="text-muted">{suffix}</span> : null}
    </span>
  );
});

Ticker.displayName = 'Ticker';
