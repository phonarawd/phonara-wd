/**
 * Display-only external feed staleness — oracle submit gates are separate
 * (`trade-market-status-display-contract.ts`).
 */
export const DISPLAY_FEED_STALE_THRESHOLDS_MS = {
  book: 10_000,
  ticker: 30_000,
  kline: 60_000,
} as const;

export type DisplayFeedKind = keyof typeof DISPLAY_FEED_STALE_THRESHOLDS_MS;

/** Stale when last receive age meets or exceeds threshold; unset receive time is not stale. */
export function isDisplayFeedStale(
  lastReceivedAtMs: number | null | undefined,
  thresholdMs: number,
  nowMs = Date.now(),
): boolean {
  if (lastReceivedAtMs == null || !Number.isFinite(lastReceivedAtMs)) return false;
  return nowMs - lastReceivedAtMs >= thresholdMs;
}

export function resolveDisplayFeedStale(
  lastReceivedAtMs: number | null | undefined,
  kind: DisplayFeedKind,
  nowMs = Date.now(),
): boolean {
  return isDisplayFeedStale(lastReceivedAtMs, DISPLAY_FEED_STALE_THRESHOLDS_MS[kind], nowMs);
}

/** Interval for main-thread stale flag refresh (display-only · no settlement). */
export const DISPLAY_FEED_STALE_TICK_MS = 1_000;
