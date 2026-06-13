import { forwardRef, useId, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Spinner } from './spinner';

export const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl font-semibold select-none',
    'transition-[transform,opacity,background-color,box-shadow,border-color,filter]',
    'duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)]',
    'outline-none',
    'focus-visible:shadow-[0_0_0_var(--focus-ring-offset)_var(--color-bg),0_0_0_calc(var(--focus-ring-offset)+var(--focus-ring-width))_var(--focus-ring-color)]',
    'disabled:opacity-45 disabled:pointer-events-none',
    'aria-busy:opacity-80',
    'active:scale-[var(--motion-press-scale)]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-trust text-[var(--color-trust-ink)] shadow-[var(--elevation-1),var(--primary-glow)] hover:brightness-105 active:brightness-95 before:absolute before:inset-0 before:-translate-x-[130%] before:bg-[linear-gradient(110deg,transparent,oklch(1_0_0_/_0.22),transparent)] before:transition-transform before:duration-[var(--motion-duration-settlement)] before:ease-[var(--motion-ease-spring)] hover:before:translate-x-[130%]',
        secondary:
          'border border-border bg-surface-2 text-fg shadow-[var(--surface-highlight)] hover:border-border-strong hover:bg-surface-elevated',
        outline:
          'border border-border bg-transparent text-fg hover:border-border-strong hover:bg-surface/70',
        ghost: 'bg-transparent text-muted hover:bg-surface/60 hover:text-fg',
        danger: 'bg-[var(--color-danger)] text-[var(--color-danger-fg)] shadow-[var(--elevation-1)] hover:brightness-110',
        success: 'bg-up text-[var(--color-up-fg)] shadow-[var(--elevation-1)] hover:brightness-105',
        link: 'bg-transparent text-trust underline-offset-4 hover:underline h-auto px-0 min-h-0',
      },
      size: {
        sm: 'h-10 min-h-10 px-3 text-sm min-w-10',
        md: 'h-11 min-h-11 px-5 text-sm min-w-11',
        lg: 'h-12 min-h-12 px-6 text-base min-w-12',
        icon: 'h-10 w-10 min-h-10 min-w-10',
      },
      density: {
        compact: '',
        comfortable: '',
      },
      full: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      density: 'comfortable',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingLabel?: string;
  /** Shown as title + aria-describedby when disabled (domain gate reason). */
  disabledReason?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    variant,
    size,
    density,
    full,
    type,
    loading = false,
    loadingLabel,
    disabledReason,
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    title,
    ...props
  },
  ref,
) {
  const autoReasonId = useId();
  const isDisabled = disabled || loading;
  const reasonId = disabledReason && isDisabled ? autoReasonId : undefined;

  return (
    <button
      {...props}
      ref={ref}
      type={type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-label={loading && loadingLabel ? loadingLabel : ariaLabel}
      aria-describedby={reasonId ?? ariaDescribedBy}
      title={isDisabled && disabledReason ? disabledReason : title}
      className={cn(buttonVariants({ variant, size, density, full }), className)}
    >
      {loading ? <Spinner size="sm" label={loadingLabel} className="absolute" /> : null}
      {disabledReason && isDisabled ? (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      ) : null}
      <span className={cn('relative inline-flex items-center justify-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>
    </button>
  );
});

Button.displayName = 'Button';
