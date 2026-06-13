import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface DiceTrackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  targetLabel: ReactNode;
  target: ReactNode;
  directionLabel: ReactNode;
  direction: ReactNode;
  resultLabel?: ReactNode;
  result?: ReactNode;
  settled?: boolean;
}

export const DiceTrack = forwardRef<HTMLDivElement, DiceTrackProps>(function DiceTrack(
  { title, targetLabel, target, directionLabel, direction, resultLabel, result, settled = false, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('relative min-h-72 overflow-hidden rounded-2xl border border-border bg-surface-inset p-4 shadow-[var(--surface-inset-shadow)]', className)}
      {...props}
    >
      <h3 className="font-semibold text-fg">{title}</h3>
      <div className="mt-8 rounded-2xl border border-border bg-surface/80 p-4">
        <div className="relative h-4 rounded-full border border-border bg-gradient-to-r from-down/35 via-warning/25 to-up/35 shadow-[var(--surface-inset-shadow)]">
          <span className="absolute left-1/2 top-1/2 h-9 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[var(--primary-glow)]" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border bg-surface-2/70 px-3 py-2">
            <p className="text-xs text-muted">{targetLabel}</p>
            <p className="mt-1 font-black tabular-nums text-fg">{target}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2/70 px-3 py-2">
            <p className="text-xs text-muted">{directionLabel}</p>
            <p className="mt-1 font-black text-primary">{direction}</p>
          </div>
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

DiceTrack.displayName = 'DiceTrack';
