import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface RocketActivityItem {
  id: string;
  title: ReactNode;
  subtitle: ReactNode;
  value: ReactNode;
  valueDetail?: ReactNode;
  status?: 'won' | 'lost' | 'neutral';
  highlighted?: boolean;
}

export interface RocketActivityFeedProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  liveLabel: ReactNode;
  emptyLabel: ReactNode;
  items: RocketActivityItem[];
}

export const RocketActivityFeed = forwardRef<HTMLDivElement, RocketActivityFeedProps>(
  function RocketActivityFeed({ title, liveLabel, emptyLabel, items, className, ...props }, ref) {
    return (
      <aside
        ref={ref}
        className={cn('rocket-glass-panel flex h-full min-h-72 flex-col overflow-hidden rounded-xl', className)}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-muted">{title}</div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-rocket-green)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-rocket-green)] animate-pulse" />
            {liveLabel}
          </div>
        </div>
        <div className="rocket-no-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">{emptyLabel}</div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'rocket-tick-up flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs',
                  item.status === 'lost'
                    ? 'border-[color-mix(in_srgb,var(--color-rocket-danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-rocket-danger)_8%,transparent)]'
                    : item.status === 'won'
                      ? 'border-[color-mix(in_srgb,var(--color-rocket-green)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-rocket-green)_8%,transparent)]'
                      : 'border-border/50 bg-surface-2/40',
                  item.highlighted && 'ring-1 ring-[color-mix(in_srgb,var(--color-rocket-cyan)_58%,transparent)]',
                )}
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      item.highlighted
                        ? 'bg-[var(--rocket-gradient-flight)] text-[var(--color-rocket-bg)]'
                        : 'bg-surface-2 text-muted',
                    )}
                  >
                    {String(item.title).slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className={cn('truncate font-semibold', item.highlighted && 'text-[var(--color-rocket-cyan)]')}>
                      {item.title}
                    </div>
                    <div className="truncate font-mono text-[10px] text-muted">{item.subtitle}</div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={cn(
                      'font-bold tabular-nums',
                      item.status === 'lost'
                        ? 'text-[var(--color-rocket-danger)]'
                        : item.status === 'won'
                          ? 'text-[var(--color-rocket-green)]'
                          : 'text-fg',
                    )}
                  >
                    {item.value}
                  </div>
                  {item.valueDetail ? (
                    <div className="font-mono text-[10px] text-[var(--color-rocket-gold)]">{item.valueDetail}</div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    );
  },
);

RocketActivityFeed.displayName = 'RocketActivityFeed';
