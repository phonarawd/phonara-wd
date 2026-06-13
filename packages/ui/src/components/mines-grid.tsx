import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Icon } from './icon';

export interface MinesGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  selectedLabel: ReactNode;
  selectedCells: Array<number | string>;
  resultLabel?: ReactNode;
  result?: ReactNode;
  settled?: boolean;
}

export const MinesGrid = forwardRef<HTMLDivElement, MinesGridProps>(function MinesGrid(
  { title, selectedLabel, selectedCells, resultLabel, result, settled = false, className, ...props },
  ref,
) {
  const selected = new Set(selectedCells.map(String));

  return (
    <div
      ref={ref}
      className={cn('relative min-h-72 overflow-hidden rounded-2xl border border-border bg-surface-inset p-4 shadow-[var(--surface-inset-shadow)]', className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-fg">{title}</h3>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {selectedLabel}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {Array.from({ length: 25 }, (_, index) => {
          const active = selected.has(String(index));
          return (
            <span
              key={index}
              className={cn(
                'flex aspect-square items-center justify-center rounded-xl border text-xs font-semibold tabular-nums shadow-[var(--surface-highlight)]',
                active
                  ? 'border-primary/45 bg-primary/15 text-primary shadow-[var(--primary-glow)]'
                  : 'border-border bg-surface-2/70 text-muted',
              )}
            >
              {active ? <Icon name="check" size="xs" /> : index}
            </span>
          );
        })}
      </div>
      {resultLabel && result ? (
        <div className={cn('mt-4 rounded-xl border px-3 py-2 text-sm', settled ? 'border-up/35 bg-up/10 text-up' : 'border-border bg-surface-2 text-muted')}>
          <span className="text-muted">{resultLabel}</span>
          <span className="ml-2 font-semibold tabular-nums text-fg">{result}</span>
        </div>
      ) : null}
    </div>
  );
});

MinesGrid.displayName = 'MinesGrid';
