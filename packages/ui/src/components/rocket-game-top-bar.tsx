import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface RocketGameTopBarProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
  balanceLabel: ReactNode;
  balance: ReactNode;
  currency?: ReactNode;
  actions?: ReactNode;
}

export const RocketGameTopBar = forwardRef<HTMLElement, RocketGameTopBarProps>(
  function RocketGameTopBar({ title, subtitle, balanceLabel, balance, currency, actions, className, ...props }, ref) {
    return (
      <header
        ref={ref}
        className={cn(
          'rocket-glass-panel relative z-20 flex min-h-16 items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 md:px-6',
          className,
        )}
        {...props}
      >
        <div className="flex min-w-0 items-center gap-3">
          <RocketMark />
          <div className="min-w-0 leading-none">
            <div className="rocket-text-gradient truncate text-lg font-black tracking-widest">{title}</div>
            {subtitle ? (
              <div className="mt-1 hidden truncate text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-rocket-cyan)] md:block">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <div className="flex h-10 min-w-0 items-center gap-2 rounded-full border border-border/70 bg-surface-2/70 px-3 shadow-inner md:px-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{balanceLabel}</span>
            <span className="rocket-text-glow-gold truncate font-bold tabular-nums text-[var(--color-rocket-gold)]">
              {balance}
            </span>
            {currency ? <span className="hidden text-[10px] font-mono text-muted sm:inline">{currency}</span> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      </header>
    );
  },
);

RocketGameTopBar.displayName = 'RocketGameTopBar';

function RocketMark() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 32 32"
      className="shrink-0 drop-shadow-[0_0_8px_var(--color-rocket-magenta)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rocketTopBarMark" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-rocket-magenta)" />
          <stop offset="100%" stopColor="var(--color-rocket-cyan)" />
        </linearGradient>
      </defs>
      <path d="M16 2 28 28 16 22 4 28Z" fill="url(#rocketTopBarMark)" />
    </svg>
  );
}
