import { useDisplayKline } from '@/features/trading/display-chart/use-display-kline';
import { useMarketTicker } from '@/features/trading/market-store/use-market-ticker';
import { useOrderBook } from '@/features/trading/market-store/use-order-book';

export type DisplayFeedStaleState = {
  bookStale: boolean;
  tickerStale: boolean;
  klineStale: boolean;
  anyStale: boolean;
};

const EMPTY_STALE: DisplayFeedStaleState = {
  bookStale: false,
  tickerStale: false,
  klineStale: false,
  anyStale: false,
};

/** Display-only external feed staleness — separate from oracle submit gates. */
export function useDisplayFeedStale(symbol: string | null | undefined): DisplayFeedStaleState {
  const sym = symbol?.toUpperCase() ?? '';
  const book = useOrderBook(sym || null);
  const ticker = useMarketTicker(sym || null);
  const kline = useDisplayKline(sym || null, '1m', Boolean(sym));

  if (!sym) return EMPTY_STALE;

  const bookStale = book.feedStale;
  const tickerStale = ticker.feedStale;
  const klineStale = kline.feedStale;

  return {
    bookStale,
    tickerStale,
    klineStale,
    anyStale: bookStale || tickerStale || klineStale,
  };
}
