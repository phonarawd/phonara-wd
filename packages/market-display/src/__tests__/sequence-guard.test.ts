import { describe, expect, it } from 'vitest';
import type { BookSnapshot } from '../order-book-types';
import { applyBookDelta, createSequenceGuard } from '../sequence-guard';

const snapshot: BookSnapshot = {
  symbol: 'BTCUSDT',
  bids: [['100', '1']],
  asks: [['101', '1']],
  lastUpdateId: 100,
};

describe('sequence-guard', () => {
  it('accepts contiguous delta', () => {
    const state = createSequenceGuard(snapshot);
    const next = applyBookDelta(state, {
      symbol: 'BTCUSDT',
      U: 101,
      u: 101,
      bids: [],
      asks: [],
    });
    expect(next.lastUpdateId).toBe(101);
    expect(next.needsReseed).toBe(false);
  });

  it('flags gap for reseed', () => {
    const state = createSequenceGuard(snapshot);
    const next = applyBookDelta(state, {
      symbol: 'BTCUSDT',
      U: 103,
      u: 103,
      bids: [],
      asks: [],
    });
    expect(next.needsReseed).toBe(true);
  });

  it('ignores stale delta', () => {
    const state = createSequenceGuard(snapshot);
    const next = applyBookDelta(state, {
      symbol: 'BTCUSDT',
      U: 99,
      u: 99,
      bids: [],
      asks: [],
    });
    expect(next.lastUpdateId).toBe(100);
    expect(next.needsReseed).toBe(false);
  });
});
