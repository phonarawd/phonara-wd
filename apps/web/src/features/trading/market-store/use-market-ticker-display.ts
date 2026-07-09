import { useMemo } from 'react';
import { toDecimal } from '@phonara/money';

import { resolveExchangePair } from '@/features/trading/display-chart/resolve-exchange-symbol';

import {
  formatChange24Display,
  formatOpenInterestDisplay,
  formatTickerPriceDisplay,
  formatVolume24Display,
} from './format-ticker-display';
import type { Ticker24hView } from './ticker-store';
import { useMarketTicker } from './use-market-ticker';

export type MarketTickerMode = 'spot' | 'futures';

export type MarketTickerDisplay = {
  hasFeed: boolean;
  change24: { text: string; tone: 'up' | 'down' | 'neutral' };
  high24: string;
  low24: string;
  vol24: string;
  openInterest: string;
};

function hasLiveTickerFeed(ticker: Ticker24hView, symbol: string): boolean {
  if (!symbol) return false;
  if (!resolveExchangePair(symbol)) return false;
  try {
    return !toDecimal(ticker.lastPrice).isZero();
  } catch {
    return false;
  }
}

function emptyStat(): MarketTickerDisplay {
  return {
    hasFeed: false,
    change24: { text: '—', tone: 'neutral' },
    high24: '—',
    low24: '—',
    vol24: '—',
    openInterest: '—',
  };
}

/** Display-only 24h ticker strings from exchange feed (not settlement). */
export function mapMarketTickerDisplay(ticker: Ticker24hView, symbol: string): MarketTickerDisplay {
  if (!hasLiveTickerFeed(ticker, symbol)) return emptyStat();

  return {
    hasFeed: true,
    change24: formatChange24Display(ticker.priceChangePercent),
    high24: formatTickerPriceDisplay(ticker.highPrice),
    low24: formatTickerPriceDisplay(ticker.lowPrice),
    vol24: formatVolume24Display(ticker.quoteVolume),
    openInterest: formatOpenInterestDisplay(ticker.openInterest),
  };
}

export function useMarketTickerDisplay(symbol: string | null | undefined): MarketTickerDisplay {
  const ticker = useMarketTicker(symbol);
  const sym = symbol?.toUpperCase() ?? '';

  return useMemo(() => mapMarketTickerDisplay(ticker, sym), [ticker, sym]);
}
