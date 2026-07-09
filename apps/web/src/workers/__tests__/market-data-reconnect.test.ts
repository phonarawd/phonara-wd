import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computeReconnectDelayMs,
  createReconnectScheduler,
  parseWsJson,
  DEFAULT_RECONNECT_BASE_DELAY_MS,
  DEFAULT_RECONNECT_MAX_DELAY_MS,
} from '../market-data-reconnect';

describe('computeReconnectDelayMs', () => {
  it('doubles base delay per attempt and caps at max', () => {
    const noJitter = { jitterRatio: 0, random: () => 0 };
    expect(computeReconnectDelayMs(0, noJitter)).toBe(DEFAULT_RECONNECT_BASE_DELAY_MS);
    expect(computeReconnectDelayMs(1, noJitter)).toBe(DEFAULT_RECONNECT_BASE_DELAY_MS * 2);
    expect(computeReconnectDelayMs(10, noJitter)).toBe(DEFAULT_RECONNECT_MAX_DELAY_MS);
  });

  it('adds jitter within the configured ratio', () => {
    const delay = computeReconnectDelayMs(0, {
      jitterRatio: 0.25,
      random: () => 1,
    });
    expect(delay).toBe(Math.floor(DEFAULT_RECONNECT_BASE_DELAY_MS * 1.25));
  });
});

describe('parseWsJson', () => {
  it('returns parsed object for valid JSON', () => {
    expect(parseWsJson<{ u: number }>('{"u":42}')).toEqual({ u: 42 });
  });

  it('returns null for malformed JSON', () => {
    expect(parseWsJson('{not-json')).toBeNull();
  });
});

describe('createReconnectScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules callback with increasing backoff', async () => {
    const callback = vi.fn();
    const scheduler = createReconnectScheduler({ jitterRatio: 0, random: () => 0 });

    scheduler.schedule(callback);
    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(DEFAULT_RECONNECT_BASE_DELAY_MS);
    expect(callback).toHaveBeenCalledTimes(1);

    scheduler.schedule(callback);
    await vi.advanceTimersByTimeAsync(DEFAULT_RECONNECT_BASE_DELAY_MS * 2);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('coalesces duplicate schedule calls until timer fires', async () => {
    const callback = vi.fn();
    const scheduler = createReconnectScheduler({ jitterRatio: 0, random: () => 0 });

    scheduler.schedule(callback);
    scheduler.schedule(callback);

    await vi.advanceTimersByTimeAsync(DEFAULT_RECONNECT_BASE_DELAY_MS);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('reset clears attempt counter', async () => {
    const callback = vi.fn();
    const scheduler = createReconnectScheduler({ jitterRatio: 0, random: () => 0 });

    scheduler.schedule(callback);
    await vi.advanceTimersByTimeAsync(DEFAULT_RECONNECT_BASE_DELAY_MS);
    scheduler.reset();

    scheduler.schedule(callback);
    await vi.advanceTimersByTimeAsync(DEFAULT_RECONNECT_BASE_DELAY_MS);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('cancel prevents further schedules', async () => {
    const callback = vi.fn();
    const scheduler = createReconnectScheduler({ jitterRatio: 0, random: () => 0 });

    scheduler.schedule(callback);
    scheduler.cancel();
    scheduler.schedule(callback);

    await vi.advanceTimersByTimeAsync(DEFAULT_RECONNECT_MAX_DELAY_MS);
    expect(callback).not.toHaveBeenCalled();
  });
});
