import type { MessageKey } from '@phonara/i18n';
import { memo } from 'react';

import { useMarketTickerDisplay } from '@/features/trading/market-store/use-market-ticker-display';
import { cn } from '@/product/primitives/lib/cn';

import { TradeMarketTickerStats } from './trade-market-ticker-stats';

export type TradeMarketTickerStatsWireProps = {
  selectedSymbol: string;
  mode: 'spot' | 'futures';
  t: (key: MessageKey) => string;
  className?: string;
};

/** Owns ticker store subscription — isolated from header price tick rerenders. */
export const TradeMarketTickerStatsWire = memo(function TradeMarketTickerStatsWire({
  selectedSymbol,
  mode,
  t,
  className,
}: TradeMarketTickerStatsWireProps) {
  const tickerDisplay = useMarketTickerDisplay(selectedSymbol || null);
  return (
    <TradeMarketTickerStats display={tickerDisplay} mode={mode} t={t} className={cn(className)} />
  );
});
