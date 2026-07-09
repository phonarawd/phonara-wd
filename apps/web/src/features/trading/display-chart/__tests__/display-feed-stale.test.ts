import { describe, expect, it } from 'vitest';

import {
  DISPLAY_FEED_STALE_THRESHOLDS_MS,
  isDisplayFeedStale,
  resolveDisplayFeedStale,
} from '../display-feed-stale';

describe('display-feed-stale', () => {
  it('returns false when last receive time is unset', () => {
    expect(isDisplayFeedStale(null, DISPLAY_FEED_STALE_THRESHOLDS_MS.book)).toBe(false);
    expect(isDisplayFeedStale(undefined, DISPLAY_FEED_STALE_THRESHOLDS_MS.ticker)).toBe(false);
  });

  it('returns false when age is below threshold', () => {
    const now = 100_000;
    expect(isDisplayFeedStale(now - 9_999, DISPLAY_FEED_STALE_THRESHOLDS_MS.book, now)).toBe(false);
  });

  it('returns true when age meets threshold', () => {
    const now = 100_000;
    expect(isDisplayFeedStale(now - 10_000, DISPLAY_FEED_STALE_THRESHOLDS_MS.book, now)).toBe(true);
    expect(resolveDisplayFeedStale(now - 30_000, 'ticker', now)).toBe(true);
    expect(resolveDisplayFeedStale(now - 59_999, 'kline', now)).toBe(false);
    expect(resolveDisplayFeedStale(now - 60_000, 'kline', now)).toBe(true);
  });
});
