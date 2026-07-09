import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  advanceKlineProviderOnFailure,
  computeReconnectDelayMs,
  createInitialKlineProviderState,
  createReconnectScheduler,
  DEFAULT_RECONNECT_BASE_DELAY_MS,
  KLINE_BINANCE_RETURN_AFTER_MS,
  noteKlineWsConnected,
  resetKlineProviderToBinance,
  resolveKlineConnectProvider,
  shouldReturnKlineToBinance,
} from '../display-kline-reconnect';

describe('kline provider state', () => {
  it('starts on Binance primary', () => {
    expect(createInitialKlineProviderState()).toEqual({
      provider: 'binance',
      connectedAtMs: null,
    });
  });

  it('falls back Binance → Bybit on failure only once', () => {
    const initial = createInitialKlineProviderState();
    const afterBinanceFail = advanceKlineProviderOnFailure(initial);
    expect(afterBinanceFail.provider).toBe('bybit');

    const afterBybitFail = advanceKlineProviderOnFailure(afterBinanceFail);
    expect(afterBybitFail.provider).toBe('bybit');
  });

  it('returns to Binance after stable Bybit session', () => {
    const t0 = 1_000_000;
    const onBybit = {
      provider: 'bybit' as const,
      connectedAtMs: t0,
    };
    expect(shouldReturnKlineToBinance(onBybit, t0 + KLINE_BINANCE_RETURN_AFTER_MS - 1)).toBe(false);
    expect(shouldReturnKlineToBinance(onBybit, t0 + KLINE_BINANCE_RETURN_AFTER_MS)).toBe(true);
  });

  it('resolveKlineConnectProvider prefers primary on resubscribe', () => {
    const onBybit = {
      provider: 'bybit' as const,
      connectedAtMs: 100,
    };
    const resolved = resolveKlineConnectProvider({
      state: onBybit,
      preferPrimaryRetry: true,
    });
    expect(resolved.provider).toBe('binance');
    expect(resolved.state).toEqual(resetKlineProviderToBinance());
  });

  it('resolveKlineConnectProvider returns to Binance after stable Bybit', () => {
    const t0 = 5_000;
    const onBybit = noteKlineWsConnected(
      advanceKlineProviderOnFailure(createInitialKlineProviderState()),
      t0,
    );
    const resolved = resolveKlineConnectProvider({
      state: onBybit,
      nowMs: t0 + KLINE_BINANCE_RETURN_AFTER_MS,
    });
    expect(resolved.provider).toBe('binance');
    expect(resolved.state.provider).toBe('binance');
  });

  it('keeps Bybit when not yet stable and no primary retry', () => {
    const t0 = 9_000;
    const onBybit = noteKlineWsConnected(
      advanceKlineProviderOnFailure(createInitialKlineProviderState()),
      t0,
    );
    const resolved = resolveKlineConnectProvider({
      state: onBybit,
      nowMs: t0 + 60_000,
    });
    expect(resolved.provider).toBe('bybit');
    expect(resolved.state).toEqual(onBybit);
  });
});

describe('kline reconnect scheduler (shared backoff)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses exponential backoff with jitter cap', () => {
    const noJitter = { jitterRatio: 0, random: () => 0 };
    expect(computeReconnectDelayMs(0, noJitter)).toBe(DEFAULT_RECONNECT_BASE_DELAY_MS);
    expect(computeReconnectDelayMs(2, noJitter)).toBe(DEFAULT_RECONNECT_BASE_DELAY_MS * 4);
  });

  it('schedules reconnect with increasing delay', async () => {
    const callback = vi.fn();
    const scheduler = createReconnectScheduler({ jitterRatio: 0, random: () => 0 });

    scheduler.schedule(callback);
    await vi.advanceTimersByTimeAsync(DEFAULT_RECONNECT_BASE_DELAY_MS);
    expect(callback).toHaveBeenCalledTimes(1);

    scheduler.schedule(callback);
    await vi.advanceTimersByTimeAsync(DEFAULT_RECONNECT_BASE_DELAY_MS * 2);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('reset clears backoff after successful connect', async () => {
    const callback = vi.fn();
    const scheduler = createReconnectScheduler({ jitterRatio: 0, random: () => 0 });

    scheduler.schedule(callback);
    await vi.advanceTimersByTimeAsync(DEFAULT_RECONNECT_BASE_DELAY_MS);
    scheduler.reset();

    scheduler.schedule(callback);
    await vi.advanceTimersByTimeAsync(DEFAULT_RECONNECT_BASE_DELAY_MS);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
