import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface LimboMeterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  targetLabel: ReactNode;
  target: ReactNode;
  resultLabel?: ReactNode;
  result?: ReactNode;
  settled?: boolean;
}

export const LimboMeter = forwardRef<HTMLDivElement, LimboMeterProps>(function LimboMeter(
  { title, targetLabel, target, resultLabel, result, settled = false, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('relative min-h-72 overflow-hidden rounded-2xl border border-border bg-surface-inset p-4 shadow-[var(--surface-inset-shadow)]', className)}
      {...props}
    >
      <h3 className="font-semibold text-fg">{title}</h3>
      <div className="mt-8 flex items-center justify-center">
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-[var(--primary-glow)]">
          <div className="absolute inset-3 rounded-full border border-border bg-surface" />
          <div className="relative text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{targetLabel}</p>
            <p className="mt-2 text-4xl font-black tabular-nums text-primary">{target}</p>
          </div>
        </div>
      </div>
      {resultLabel && result ? (
        <div className={cn('mt-6 rounded-xl border px-3 py-2 text-sm', settled ? 'border-up/35 bg-up/10 text-up' : 'border-border bg-surface-2 text-muted')}>
          <span className="text-muted">{resultLabel}</span>
          <span className="ml-2 font-semibold tabular-nums text-fg">{result}</span>
        </div>
      ) : null}
    </div>
  );
});

LimboMeter.displayName = 'LimboMeter';
