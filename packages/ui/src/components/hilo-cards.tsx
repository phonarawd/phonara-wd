import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Icon } from './icon';

export interface HiLoCardsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  guessLabel: ReactNode;
  guess: ReactNode;
  resultLabel?: ReactNode;
  result?: ReactNode;
  settled?: boolean;
}

export const HiLoCards = forwardRef<HTMLDivElement, HiLoCardsProps>(function HiLoCards(
  { title, guessLabel, guess, resultLabel, result, settled = false, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('relative min-h-72 overflow-hidden rounded-2xl border border-border bg-surface-inset p-4 shadow-[var(--surface-inset-shadow)]', className)}
      {...props}
    >
      <h3 className="font-semibold text-fg">{title}</h3>
      <div className="mt-8 flex items-center justify-center gap-4">
        <div className="flex h-36 w-24 rotate-[-4deg] items-center justify-center rounded-2xl border border-border bg-surface-2 shadow-[var(--elevation-1)]">
          <Icon name="casino" size="lg" className="text-muted" />
        </div>
        <div className="flex h-36 w-24 rotate-[4deg] items-center justify-center rounded-2xl border border-primary/35 bg-primary/10 shadow-[var(--primary-glow)]">
          <Icon name="chevronRight" size="lg" className="text-primary" />
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-border bg-surface-2/70 px-3 py-2 text-center">
        <p className="text-xs text-muted">{guessLabel}</p>
        <p className="mt-1 font-black text-primary">{guess}</p>
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

HiLoCards.displayName = 'HiLoCards';
