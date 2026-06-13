import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface PlinkoBoardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  rowsLabel: ReactNode;
  rows: ReactNode;
  riskLabel: ReactNode;
  risk: ReactNode;
  rowCount?: number;
  resultLabel?: ReactNode;
  result?: ReactNode;
  settled?: boolean;
}

export const PlinkoBoard = forwardRef<HTMLDivElement, PlinkoBoardProps>(function PlinkoBoard(
  { title, rowsLabel, rows, riskLabel, risk, rowCount = 12, resultLabel, result, settled = false, className, ...props },
  ref,
) {
  const visibleRows = Math.min(12, Math.max(6, rowCount));

  return (
    <div
      ref={ref}
      className={cn('relative min-h-72 overflow-hidden rounded-2xl border border-border bg-surface-inset p-4 shadow-[var(--surface-inset-shadow)]', className)}
      {...props}
    >
      <h3 className="font-semibold text-fg">{title}</h3>
      <div className="mt-4 grid gap-1.5 rounded-2xl border border-border bg-surface/70 p-4">
        {Array.from({ length: visibleRows }, (_, row) => (
          <div key={row} className="flex justify-center gap-2">
            {Array.from({ length: row + 3 }, (_, pin) => (
              <span key={pin} className="h-2 w-2 rounded-full bg-primary/65 shadow-[var(--primary-glow)]" />
            ))}
          </div>
        ))}
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={index}
              className={cn(
                'h-7 rounded-lg border border-border bg-surface-2/80',
                index === 3 ? 'border-primary/45 bg-primary/15 shadow-[var(--primary-glow)]' : '',
              )}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-border bg-surface-2/70 px-3 py-2">
          <p className="text-xs text-muted">{rowsLabel}</p>
          <p className="mt-1 font-black tabular-nums text-fg">{rows}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2/70 px-3 py-2">
          <p className="text-xs text-muted">{riskLabel}</p>
          <p className="mt-1 font-black text-primary">{risk}</p>
        </div>
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

PlinkoBoard.displayName = 'PlinkoBoard';
