import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type RocketHistoryTone = 'low' | 'neutral' | 'good' | 'great' | 'hero';

export interface RocketHistoryItem {
  id: string;
  label: ReactNode;
  meta?: ReactNode;
  tone?: RocketHistoryTone;
}

export interface RocketHistoryStripProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  emptyLabel: ReactNode;
  items: RocketHistoryItem[];
}

const toneClasses: Record<RocketHistoryTone, string> = {
  low: 'border-[color-mix(in_srgb,var(--color-rocket-danger)_34%,transparent)] bg-[color-mix(in_srgb,var(--color-rocket-danger)_10%,transparent)] text-[var(--color-rocket-danger)]',
  neutral: 'border-border bg-surface-2/80 text-muted',
  good: 'border-[color-mix(in_srgb,var(--color-rocket-green)_34%,transparent)] bg-[color-mix(in_srgb,var(--color-rocket-green)_10%,transparent)] text-[var(--color-rocket-green)]',
  great: 'border-[color-mix(in_srgb,var(--color-rocket-violet)_36%,transparent)] bg-[color-mix(in_srgb,var(--color-rocket-violet)_12%,transparent)] text-[var(--color-rocket-violet)]',
  hero: 'border-[color-mix(in_srgb,var(--color-rocket-gold)_42%,transparent)] bg-[color-mix(in_srgb,var(--color-rocket-gold)_12%,transparent)] text-[var(--color-rocket-gold)]',
};

export const RocketHistoryStrip = forwardRef<HTMLDivElement, RocketHistoryStripProps>(
  function RocketHistoryStrip({ title, emptyLabel, items, className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('rocket-glass-panel flex items-center gap-2 overflow-hidden rounded-xl px-3 py-2', className)}
        {...props}
      >
        <div className="shrink-0 border-r border-border/60 pr-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
          {title}
        </div>
        <div className="rocket-no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {items.length === 0 ? (
            <div className="py-1.5 text-xs text-muted">{emptyLabel}</div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'rocket-tick-up shrink-0 rounded-md border px-2.5 py-1 text-xs font-bold tabular-nums',
                  toneClasses[item.tone ?? 'neutral'],
                )}
                style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                title={typeof item.meta === 'string' ? item.meta : undefined}
              >
                {item.label}
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
);

RocketHistoryStrip.displayName = 'RocketHistoryStrip';
