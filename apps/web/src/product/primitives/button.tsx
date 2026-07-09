import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/product/primitives/lib/cn';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-(--ds-radius-md) font-semibold select-none',
    'transition-[transform,background-color,border-color,opacity] duration-(--ds-motion-press)',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ds-focus)',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
        secondary: 'bg-surface-raised text-foreground hover:bg-surface-hover',
        outline: 'border border-line text-foreground hover:bg-surface-hover',
        ghost: 'text-foreground-muted hover:bg-surface-hover',
        destructive: 'bg-danger text-danger-foreground hover:bg-danger-hover',
        bet: 'bg-bet text-bet-foreground hover:bg-bet-hover text-lg font-bold',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4',
        lg: 'h-12 px-5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
