import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { orderBookStore } from '../order-book-store';
import { tickerStore } from '../ticker-store';

describe('orderBookStore feed stale', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-08T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks book stale after threshold without new snapshots', () => {
    const listener = vi.fn();
    const unsubscribe = orderBookStore.subscribe('BTC_USDT', listener);

    orderBookStore.setSnapshot({
      symbol: 'BTC_USDT',
      bids: [['1', '1']],
      asks: [['2', '1']],
      lastUpdateId: 1,
      receivedAtMs: Date.now(),
    });
    expect(orderBookStore.getSnapshot('BTC_USDT').feedStale).toBe(false);

    vi.advanceTimersByTime(10_000);
    orderBookStore.tickFeedStale();
    expect(orderBookStore.getSnapshot('BTC_USDT').feedStale).toBe(true);
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });
});

describe('tickerStore feed stale', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-08T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks ticker stale after 30s threshold', () => {
    tickerStore.setSnapshot({
      symbol: 'ETH_USDT',
      lastPrice: '3200',
      priceChangePercent: '1',
      volume: '1',
      quoteVolume: '1',
      highPrice: '3300',
      lowPrice: '3100',
      openInterest: '0',
      receivedAtMs: Date.now(),
    });
    expect(tickerStore.getSnapshot('ETH_USDT').feedStale).toBe(false);

    vi.advanceTimersByTime(30_000);
    tickerStore.tickFeedStale();
    expect(tickerStore.getSnapshot('ETH_USDT').feedStale).toBe(true);
  });
});
