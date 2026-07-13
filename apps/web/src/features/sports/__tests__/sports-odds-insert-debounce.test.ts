import { describe, expect, it, vi } from 'vitest';
import {
  createSportsOddsInsertDebouncer,
  SPORTS_ODDS_INSERT_DEBOUNCE_MS,
} from '../sports-odds-insert-debounce';

describe('sports-odds-insert-debounce', () => {
  it('exports debounce floor of 500ms', () => {
    expect(SPORTS_ODDS_INSERT_DEBOUNCE_MS).toBe(500);
  });

  it('rejects debounceMs below the 500ms floor', () => {
    expect(() =>
      createSportsOddsInsertDebouncer({
        debounceMs: 100,
        flush: () => undefined,
      }),
    ).toThrow(/≥ 500/);
  });

  it('coalesces rapid inserts for the same outcomeId to the latest odds', () => {
    const flush = vi.fn();
    const scheduled: Array<{ fn: () => void; ms: number }> = [];
    const debouncer = createSportsOddsInsertDebouncer({
      flush,
      schedule: (fn, ms) => {
        scheduled.push({ fn, ms });
        return { clear: () => undefined };
      },
    });

    debouncer.enqueue({
      outcomeId: 'o1',
      odds: '1.90',
      capturedAt: '2026-07-11T00:00:00.000Z',
    });
    debouncer.enqueue({
      outcomeId: 'o1',
      odds: '2.05',
      capturedAt: '2026-07-11T00:00:00.400Z',
    });

    expect(flush).not.toHaveBeenCalled();
    expect(debouncer.pendingCount()).toBe(1);
    expect(scheduled).toHaveLength(2);
    expect(scheduled.every((row) => row.ms === SPORTS_ODDS_INSERT_DEBOUNCE_MS)).toBe(true);

    scheduled.at(-1)?.fn();
    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledWith([
      {
        outcomeId: 'o1',
        odds: '2.05',
        capturedAt: '2026-07-11T00:00:00.400Z',
      },
    ]);
    expect(debouncer.pendingCount()).toBe(0);
  });

  it('batches distinct outcomeIds into one flush after the quiet window', () => {
    const flush = vi.fn();
    let lastFn: (() => void) | null = null;
    const debouncer = createSportsOddsInsertDebouncer({
      flush,
      schedule: (fn) => {
        lastFn = fn;
        return { clear: () => undefined };
      },
    });

    debouncer.enqueue({
      outcomeId: 'o-home',
      odds: '2.10',
      capturedAt: '2026-07-11T00:00:01.000Z',
    });
    debouncer.enqueue({
      outcomeId: 'o-away',
      odds: '3.40',
      capturedAt: '2026-07-11T00:00:01.100Z',
    });

    expect(debouncer.pendingCount()).toBe(2);
    lastFn?.();
    expect(flush).toHaveBeenCalledWith([
      {
        outcomeId: 'o-home',
        odds: '2.10',
        capturedAt: '2026-07-11T00:00:01.000Z',
      },
      {
        outcomeId: 'o-away',
        odds: '3.40',
        capturedAt: '2026-07-11T00:00:01.100Z',
      },
    ]);
  });

  it('dispose clears pending work without flushing', () => {
    const flush = vi.fn();
    const debouncer = createSportsOddsInsertDebouncer({
      flush,
      schedule: () => ({ clear: () => undefined }),
    });
    debouncer.enqueue({
      outcomeId: 'o1',
      odds: '1.50',
      capturedAt: '2026-07-11T00:00:00.000Z',
    });
    debouncer.dispose();
    expect(flush).not.toHaveBeenCalled();
    expect(debouncer.pendingCount()).toBe(0);
    debouncer.enqueue({
      outcomeId: 'o2',
      odds: '1.60',
      capturedAt: '2026-07-11T00:00:01.000Z',
    });
    expect(debouncer.pendingCount()).toBe(0);
  });
});
