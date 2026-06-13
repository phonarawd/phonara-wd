import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface CrashCurveProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  targetLabel: ReactNode;
  target: ReactNode;
  resultLabel?: ReactNode;
  result?: ReactNode;
  settled?: boolean;
}

export const CrashCurve = forwardRef<HTMLDivElement, CrashCurveProps>(function CrashCurve(
  { title, targetLabel, target, resultLabel, result, settled = false, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('relative min-h-72 overflow-hidden rounded-2xl border border-border bg-surface-inset p-4 shadow-[var(--surface-inset-shadow)]', className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-fg">{title}</h3>
          <p className="mt-1 text-xs text-muted">{targetLabel}</p>
        </div>
        <span className="rounded-xl border border-primary/35 bg-primary/10 px-3 py-1 text-lg font-black tabular-nums text-primary shadow-[var(--primary-glow)]">
          {target}
        </span>
      </div>
      <svg className="mt-5 h-36 w-full overflow-visible" viewBox="0 0 320 150" role="presentation" aria-hidden="true">
        <defs>
          <linearGradient id="crash-curve-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.36" />
          </linearGradient>
        </defs>
        <path d="M8 134 C 82 126, 142 108, 192 70 S 274 14, 312 12" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" />
        <path d="M8 138 C 82 128, 142 110, 192 72 S 274 16, 312 14 L312 142 L8 142 Z" fill="url(#crash-curve-fill)" />
        <path d="M8 142 H312" stroke="var(--color-border-strong)" strokeWidth="1" />
      </svg>
      {resultLabel && result ? (
        <div className={cn('mt-4 rounded-xl border px-3 py-2 text-sm', settled ? 'border-up/35 bg-up/10 text-up' : 'border-border bg-surface-2 text-muted')}>
          <span className="text-muted">{resultLabel}</span>
          <span className="ml-2 font-semibold tabular-nums text-fg">{result}</span>
        </div>
      ) : null}
    </div>
  );
});

CrashCurve.displayName = 'CrashCurve';
