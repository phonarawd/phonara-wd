import { describe, expect, it } from 'vitest';

import { mapMarketTickerDisplay } from '@/features/trading/market-store/use-market-ticker-display';
import type { Ticker24hView } from '@/features/trading/market-store/ticker-store';

const LIVE_TICKER: Ticker24hView = {
  symbol: 'BTCUSDT-SIM',
  lastPrice: '65000',
  priceChangePercent: '1.25',
  volume: '1200',
  quoteVolume: '78000000',
  highPrice: '66000',
  lowPrice: '64000',
  openInterest: '950000',
};

describe('use-market-ticker-display mapMarketTickerDisplay', () => {
  it('maps live exchange feed to display strings for futures', () => {
    const display = mapMarketTickerDisplay(LIVE_TICKER, 'BTCUSDT-SIM');

    expect(display.hasFeed).toBe(true);
    expect(display.change24.text).toBe('+1.25%');
    expect(display.high24).toBe('66,000.0');
    expect(display.low24).toBe('64,000.0');
    expect(display.vol24).toBe('78.00M');
    expect(display.openInterest).toBe('950.0K');
  });

  it('returns empty stats when platform symbol has no exchange mapping', () => {
    const display = mapMarketTickerDisplay(LIVE_TICKER, 'PHONUSDT-PERP');

    expect(display.hasFeed).toBe(false);
    expect(display.change24.text).toBe('—');
    expect(display.high24).toBe('—');
    expect(display.openInterest).toBe('—');
  });

  it('returns empty stats when feed last price is zero', () => {
    const display = mapMarketTickerDisplay({ ...LIVE_TICKER, lastPrice: '0' }, 'BTCUSDT-SIM');

    expect(display.hasFeed).toBe(false);
    expect(display.vol24).toBe('—');
  });
});
