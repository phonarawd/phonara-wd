import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const rocketBetSurfaceVariants = cva(
  'rocket-glass-panel relative overflow-hidden rounded-xl p-4 transition-[border-color,box-shadow,transform] duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)]',
  {
    variants: {
      accent: {
        magenta: 'shadow-[var(--rocket-shadow-magenta)]',
        cyan: 'shadow-[var(--rocket-shadow-cyan)]',
        gold: 'shadow-[var(--rocket-shadow-gold)]',
      },
      interactive: {
        true: 'hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-rocket-cyan)_48%,transparent)]',
        false: '',
      },
    },
    defaultVariants: {
      accent: 'magenta',
      interactive: false,
    },
  },
);

export interface RocketBetSurfaceProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof rocketBetSurfaceVariants> {
  eyebrow: ReactNode;
  title: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
}

export const RocketBetSurface = forwardRef<HTMLDivElement, RocketBetSurfaceProps>(
  function RocketBetSurface({ eyebrow, title, badge, footer, accent, interactive, children, className, ...props }, ref) {
    return (
      <section
        ref={ref}
        className={cn(rocketBetSurfaceVariants({ accent, interactive }), className)}
        {...props}
      >
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[var(--rocket-gradient-flight)]" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">{eyebrow}</div>
            <h2 className="mt-1 truncate text-base font-black text-fg">{title}</h2>
          </div>
          {badge ? (
            <div className="shrink-0 rounded-full border border-[color-mix(in_srgb,var(--color-rocket-cyan)_34%,transparent)] bg-[color-mix(in_srgb,var(--color-rocket-cyan)_10%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-rocket-cyan)]">
              {badge}
            </div>
          ) : null}
        </div>
        <div className="space-y-3">{children}</div>
        {footer ? <div className="mt-3 border-t border-border/60 pt-3">{footer}</div> : null}
      </section>
    );
  },
);

RocketBetSurface.displayName = 'RocketBetSurface';
