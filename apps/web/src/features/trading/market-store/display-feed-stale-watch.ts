import { DISPLAY_FEED_STALE_TICK_MS } from '@/features/trading/display-chart/display-feed-stale';

import { orderBookStore } from './order-book-store';
import { tickerStore } from './ticker-store';

let watchRefCount = 0;
let watchTimer: ReturnType<typeof setInterval> | null = null;

function tickDisplayFeedStale(nowMs = Date.now()): void {
  orderBookStore.tickFeedStale(nowMs);
  tickerStore.tickFeedStale(nowMs);
}

function startDisplayFeedStaleWatch(): void {
  if (watchTimer != null) return;
  watchTimer = setInterval(() => tickDisplayFeedStale(), DISPLAY_FEED_STALE_TICK_MS);
}

function stopDisplayFeedStaleWatch(): void {
  if (watchTimer == null) return;
  clearInterval(watchTimer);
  watchTimer = null;
}

/** One interval refreshes display-only stale flags for worker-backed stores. */
export function retainDisplayFeedStaleWatch(): () => void {
  watchRefCount += 1;
  startDisplayFeedStaleWatch();
  return () => {
    watchRefCount = Math.max(0, watchRefCount - 1);
    if (watchRefCount === 0) stopDisplayFeedStaleWatch();
  };
}
