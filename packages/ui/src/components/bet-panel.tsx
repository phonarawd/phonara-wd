import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Icon, type IconName } from './icon';

export const betPanelVariants = cva(
  [
    'relative overflow-hidden rounded-2xl border backdrop-blur-[var(--glass-blur)]',
    'transition-[border-color,box-shadow,background-color,transform]',
    'duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)]',
  ].join(' '),
  {
    variants: {
      tone: {
        default: 'border-border bg-surface/90 shadow-[var(--elevation-1)]',
        casino: 'border-primary/25 bg-surface/90 shadow-[var(--elevation-1),var(--ambient-mint-glow)]',
        risk: 'border-warning/35 bg-warning/10 shadow-[var(--elevation-1)]',
      },
      density: {
        compact: 'p-[var(--density-compact-panel-padding)]',
        comfortable: 'p-[var(--density-comfortable-panel-padding)]',
      },
      interactive: {
        true: 'hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-elevated hover:shadow-[var(--elevation-2)]',
        false: '',
      },
    },
    defaultVariants: {
      tone: 'default',
      density: 'comfortable',
      interactive: false,
    },
  },
);

export interface BetPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof betPanelVariants> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: IconName;
}

export const BetPanel = forwardRef<HTMLDivElement, BetPanelProps>(function BetPanel(
  { title, description, actions, children, icon = 'casino', tone, density, interactive, className, ...props },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn(betPanelVariants({ tone, density, interactive }), className)}
      {...props}
    >
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-[var(--surface-highlight)]">
            <Icon name={icon} size="sm" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-fg">{title}</h2>
            {description && <p className="mt-1 text-sm leading-6 text-muted">{description}</p>}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
});

BetPanel.displayName = 'BetPanel';
