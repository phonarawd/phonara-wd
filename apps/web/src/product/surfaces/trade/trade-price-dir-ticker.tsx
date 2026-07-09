import { memo, useEffect, useRef, useState } from 'react';

import { comparePriceDir, type PriceDir } from '@/features/trading/format-oracle-price-display';
import { useTradeFiatHint } from '@/features/trading/use-trade-fiat-hint';
import { cn } from '@/product/primitives/lib/cn';

import { TradePriceWithFiatHint } from './trade-price-with-fiat-hint';

export type TradePriceDirTickerProps = {
  label: string;
  priceDisplay: string;
  /** Raw price for direction flash — display-only tick compare. */
  lastPriceRaw?: string | null;
  /** Raw oracle last price (USDT) for FiatHint — display-only secondary. */
  lastPriceAmount?: string;
  /** When true, fiat hints show `—` per Trade oracle stale rule. */
  priceOracleStale?: boolean;
  testId?: string;
};

/** Isolated priceDir state — tick updates re-render this leaf only, not the full header. */
export function usePriceDirFromRaw(rawPrice: string | null | undefined): PriceDir {
  const prevRef = useRef<string | null>(null);
  const [priceDir, setPriceDir] = useState<PriceDir>('flat');

  useEffect(() => {
    if (!rawPrice || rawPrice === '0') {
      setPriceDir('flat');
      return;
    }
    setPriceDir(comparePriceDir(rawPrice, prevRef.current));
    prevRef.current = rawPrice;
  }, [rawPrice]);

  return priceDir;
}

function lastPriceDirClassName(priceDir: PriceDir): string {
  return cn(
    'm-0 text-2xl font-semibold tabular-nums',
    priceDir === 'up' && 'text-market-up',
    priceDir === 'down' && 'text-market-down',
    priceDir === 'flat' && 'text-foreground',
  );
}

/** Header last price with tick direction coloring — memoized to limit header rerenders. */
export const TradePriceDirTicker = memo(function TradePriceDirTicker({
  label,
  priceDisplay,
  lastPriceRaw,
  lastPriceAmount,
  priceOracleStale = false,
  testId,
}: TradePriceDirTickerProps) {
  const priceDir = usePriceDirFromRaw(lastPriceRaw);
  const { hintFor } = useTradeFiatHint();
  const staleOpts = { oracleStale: priceOracleStale } as const;
  const lastPriceHint =
    lastPriceAmount && lastPriceAmount !== '0' ? hintFor(lastPriceAmount, 'USDT', staleOpts) : null;

  return (
    <div>
      <p className="text-foreground-muted m-0 text-xs">{label}</p>
      {lastPriceHint && !lastPriceHint.disabled ? (
        <TradePriceWithFiatHint
          primaryDisplay={priceDisplay}
          fiatHint={lastPriceHint}
          testId={testId}
          primaryClassName={lastPriceDirClassName(priceDir)}
        />
      ) : (
        <p data-testid={testId} className={lastPriceDirClassName(priceDir)}>
          {priceDisplay}
        </p>
      )}
    </div>
  );
});
