import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const multiplierDisplayVariants = cva(
  [
    'relative overflow-hidden rounded-2xl border text-center tabular-nums shadow-[var(--surface-highlight)]',
    'transition-[border-color,background-color,transform,box-shadow]',
    'duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)]',
  ].join(' '),
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface-2/75 text-fg',
        up: 'border-up/40 bg-up/15 text-up shadow-[var(--elevation-1)]',
        down: 'border-down/40 bg-down/15 text-down shadow-[var(--elevation-1)]',
        primary: 'border-primary/40 bg-primary/15 text-primary shadow-[var(--primary-glow)]',
      },
      density: {
        compact: 'px-3 py-2',
        comfortable: 'px-4 py-3',
      },
      emphasis: {
        default: '',
        hero: 'min-h-28',
      },
    },
    defaultVariants: { tone: 'neutral', density: 'comfortable', emphasis: 'default' },
  },
);

export interface MultiplierDisplayProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiplierDisplayVariants> {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
}

export const MultiplierDisplay = forwardRef<HTMLDivElement, MultiplierDisplayProps>(
  function MultiplierDisplay({ label, value, description, tone, density, emphasis, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn(multiplierDisplayVariants({ tone, density, emphasis }), className)} {...props}>
        <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-current/35 to-transparent opacity-70" />
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className={cn('mt-1 font-black leading-none', emphasis === 'hero' ? 'text-3xl' : 'text-2xl')}>{value}</p>
        {description ? <p className="mt-2 text-xs leading-5 text-muted">{description}</p> : null}
      </div>
    );
  },
);

MultiplierDisplay.displayName = 'MultiplierDisplay';
