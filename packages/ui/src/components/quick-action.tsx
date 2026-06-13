import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Icon, type IconName } from './icon';

export const quickActionVariants = cva(
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-[transform,background,border-color] duration-[var(--motion-duration-2)] ease-[var(--motion-ease-standard)] active:scale-[var(--motion-press-scale)] focus-visible:outline-none focus-visible:shadow-[0_0_0_var(--focus-ring-offset)_var(--color-bg),0_0_0_calc(var(--focus-ring-offset)+var(--focus-ring-width))_var(--focus-ring-color)]',
  {
    variants: {
      variant: {
        primary: 'border-primary/30 bg-primary/12 text-primary hover:bg-primary/18',
        neutral: 'border-border bg-surface-2 text-fg hover:border-border-strong',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

export interface QuickActionProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof quickActionVariants> {
  icon?: IconName;
  label: ReactNode;
  hint?: ReactNode;
}

export const QuickAction = forwardRef<HTMLButtonElement, QuickActionProps>(function QuickAction(
  { icon, label, hint, variant, className, disabled, title, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      title={title}
      className={cn(quickActionVariants({ variant }), disabled && 'opacity-45', className)}
      {...props}
    >
      {icon ? <Icon name={icon} size="sm" aria-hidden="true" /> : null}
      <span className="flex flex-col items-start gap-0.5 text-left">
        <span>{label}</span>
        {hint ? <span className="text-xs font-normal text-muted">{hint}</span> : null}
      </span>
    </button>
  );
});

QuickAction.displayName = 'QuickAction';
