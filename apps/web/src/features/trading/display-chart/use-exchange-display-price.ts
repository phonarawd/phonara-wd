import { useEffect, useMemo, useRef, useState } from 'react';
import {
  comparePriceDir,
  formatOraclePriceDisplay,
  type PriceDir,
} from '@/features/trading/format-oracle-price-display';
import { useDisplayKline } from './use-display-kline';

/** Live exchange last price for headers — display-only, matches chart feed. */
export function useExchangeDisplayPrice(marketSymbol: string | null) {
  const { lastPrice, candles, connected, historyReady } = useDisplayKline(
    marketSymbol,
    '1m',
    Boolean(marketSymbol),
  );

  const raw = useMemo(() => {
    if (lastPrice && lastPrice !== '0') return lastPrice;
    const tail = candles[candles.length - 1];
    return tail ? String(tail.close) : null;
  }, [candles, lastPrice]);

  const display = useMemo(() => (raw ? formatOraclePriceDisplay(raw, '') : null), [raw]);

  const prevRef = useRef<string | null>(null);
  const [dir, setDir] = useState<PriceDir>('flat');

  useEffect(() => {
    if (!raw) return;
    setDir(comparePriceDir(raw, prevRef.current));
    prevRef.current = raw;
  }, [raw]);

  return {
    exchangePriceDisplay: display,
    exchangePriceRaw: raw,
    exchangePriceDir: dir,
    exchangeConnected: connected,
    exchangeHistoryReady: historyReady,
  };
}
