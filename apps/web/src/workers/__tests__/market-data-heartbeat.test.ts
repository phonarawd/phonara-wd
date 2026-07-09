import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createWsHeartbeatWatch,
  isBybitPongPayload,
  isWsInactivityExceeded,
  DEFAULT_WS_PING_INTERVAL_MS,
  DEFAULT_WS_PONG_TIMEOUT_MS,
} from '../market-data-heartbeat';

describe('isWsInactivityExceeded', () => {
  it('returns false when last activity is within threshold', () => {
    expect(isWsInactivityExceeded(1_000, 30_000, 60_000)).toBe(false);
  });

  it('returns true when idle duration meets threshold', () => {
    expect(isWsInactivityExceeded(1_000, 61_500, 60_000)).toBe(true);
  });

  it('returns false when last activity is unset', () => {
    expect(isWsInactivityExceeded(null, 999_999, 60_000)).toBe(false);
  });
});

describe('isBybitPongPayload', () => {
  it('detects op pong and ret_msg pong', () => {
    expect(isBybitPongPayload({ op: 'pong' })).toBe(true);
    expect(isBybitPongPayload({ ret_msg: 'pong' })).toBe(true);
    expect(isBybitPongPayload({ op: 'subscribe' })).toBe(false);
  });
});

describe('createWsHeartbeatWatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onStale when inactivity threshold is exceeded', async () => {
    let nowMs = 0;
    const onStale = vi.fn();
    const watch = createWsHeartbeatWatch({
      mode: 'inactivity-only',
      inactivityTimeoutMs: 10_000,
      activityCheckIntervalMs: 1_000,
      now: () => nowMs,
      onStale,
    });

    watch.touch();
    for (let step = 0; step < 12; step += 1) {
      nowMs += 1_000;
      await vi.advanceTimersByTimeAsync(1_000);
    }
    expect(onStale).toHaveBeenCalledTimes(1);
    watch.dispose();
  });

  it('sends Bybit ping on interval and reconnects on pong timeout', () => {
    const sendPing = vi.fn();
    const onStale = vi.fn();
    const watch = createWsHeartbeatWatch({
      mode: 'bybit-ping',
      pingIntervalMs: DEFAULT_WS_PING_INTERVAL_MS,
      pongTimeoutMs: DEFAULT_WS_PONG_TIMEOUT_MS,
      sendPing,
      onStale,
    });

    vi.advanceTimersByTime(DEFAULT_WS_PING_INTERVAL_MS);
    expect(sendPing).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(DEFAULT_WS_PONG_TIMEOUT_MS);
    expect(onStale).toHaveBeenCalledTimes(1);
    watch.dispose();
  });

  it('clears pong timeout when notePong is called', () => {
    const sendPing = vi.fn();
    const onStale = vi.fn();
    const watch = createWsHeartbeatWatch({
      mode: 'bybit-ping',
      pingIntervalMs: DEFAULT_WS_PING_INTERVAL_MS,
      pongTimeoutMs: DEFAULT_WS_PONG_TIMEOUT_MS,
      sendPing,
      onStale,
    });

    vi.advanceTimersByTime(DEFAULT_WS_PING_INTERVAL_MS);
    watch.notePong();
    vi.advanceTimersByTime(DEFAULT_WS_PONG_TIMEOUT_MS);
    expect(onStale).not.toHaveBeenCalled();
    watch.dispose();
  });
});
