import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const spinnerVariants = cva(
  'inline-block animate-spin rounded-full border-solid',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        md: 'h-9 w-9 border-[3px]',
        lg: 'h-12 w-12 border-4',
      },
      tone: {
        primary: 'border-border border-t-primary',
        muted: 'border-border border-t-muted',
        up: 'border-border border-t-up',
        down: 'border-border border-t-down',
      },
    },
    defaultVariants: { size: 'md', tone: 'primary' },
  },
);

export interface SpinnerProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof spinnerVariants> {
  /** Pre-translated accessible label for screen readers. */
  label?: string;
}

/** Loading spinner. Replaces the bespoke `.spinner` class. */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { className, size, tone, label, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-label={label}
      aria-live="polite"
      className={cn(spinnerVariants({ size, tone }), className)}
      {...props}
    />
  );
});

Spinner.displayName = 'Spinner';
