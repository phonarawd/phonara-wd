import type { ReactNode } from 'react';

import { TRADE_DESK_PAGE_SHELL_CLASS } from '@/domain/trade-ultra-layout-display-contract';
import { cn } from '@/product/primitives/lib/cn';

import '@/product/surfaces/trade/trade-desk-layout.css';

export type TradeDeskPageShellProps = {
  testId: string;
  children: ReactNode;
  className?: string;
};

/** Shared `/trade` desk shell — @container · `--ds-content-max` cap · ultra 2560+ grid owner. */
export function TradeDeskPageShell({ testId, children, className }: TradeDeskPageShellProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        TRADE_DESK_PAGE_SHELL_CLASS,
        'flex flex-col gap-4 py-4 lg:gap-5 lg:py-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
