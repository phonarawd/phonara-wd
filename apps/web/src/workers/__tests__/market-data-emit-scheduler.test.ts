import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRafBatcher, MARKET_DATA_EMIT_INTERVAL_MS } from '../market-data-emit-scheduler';

describe('createRafBatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('coalesces bursts within the emit interval', () => {
    const onFlush = vi.fn();
    const batcher = createRafBatcher(onFlush, MARKET_DATA_EMIT_INTERVAL_MS);

    batcher.schedule();
    batcher.schedule();
    batcher.schedule();

    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it('uses setTimeout when requestAnimationFrame is unavailable (worker context)', () => {
    vi.spyOn(globalThis, 'requestAnimationFrame').mockRestore();
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockRestore();
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: undefined,
    });

    const onFlush = vi.fn();
    const batcher = createRafBatcher(onFlush, MARKET_DATA_EMIT_INTERVAL_MS);

    batcher.schedule();
    vi.runAllTimers();

    expect(onFlush).toHaveBeenCalledTimes(1);
  });
});
