import { describe, expect, it } from 'vitest';

import {
  buildDepthChartModel,
  computeBookSpread,
  mapBookLevels,
  prepareGroupedBook,
  resolveBookGroupingSteps,
  sliceVisibleBook,
} from '@/features/trading/order-book-display';

describe('order-book-display grouping', () => {
  it('derives grouping steps from price precision', () => {
    expect(resolveBookGroupingSteps(4)).toEqual(['0.0001', '0.001', '0.01', '0.1', '1']);
    expect(resolveBookGroupingSteps(2)).toEqual(['0.01', '0.1', '1', '10', '100']);
  });

  it('aggregates levels when grouping step increases', () => {
    const asks = mapBookLevels([
      { price: '0.1201', size: '10' },
      { price: '0.1202', size: '20' },
    ]);
    const bids = mapBookLevels([
      { price: '0.1198', size: '15' },
      { price: '0.1197', size: '25' },
    ]);

    const fine = prepareGroupedBook(asks, bids, '0.0001');
    const coarse = prepareGroupedBook(asks, bids, '0.001');

    expect(fine.asks.length).toBeGreaterThanOrEqual(coarse.asks.length);
    expect(fine.bids.length).toBeGreaterThanOrEqual(coarse.bids.length);
  });
});

describe('order-book-display spread', () => {
  it('computes spread and percent from best ask and bid', () => {
    const asks = mapBookLevels([
      { price: '0.1202', size: '10' },
      { price: '0.1205', size: '20' },
    ]);
    const bids = mapBookLevels([
      { price: '0.1200', size: '15' },
      { price: '0.1198', size: '25' },
    ]);
    const grouped = prepareGroupedBook(asks, bids, '0.0001');

    expect(computeBookSpread(grouped.asks, grouped.bids)).toEqual({
      spreadDisplay: '0.0002',
      spreadPercentDisplay: '0.17%',
    });
  });

  it('returns null when book side is empty', () => {
    expect(computeBookSpread([], mapBookLevels([{ price: '1', size: '1' }]))).toBeNull();
  });
});

describe('order-book-display visibility', () => {
  it('limits visible rows to twelve per side', () => {
    const levels = Array.from({ length: 20 }, (_, index) => ({
      price: `${(0.12 + index * 0.0001).toFixed(4)}`,
      size: '1',
    }));
    const asks = mapBookLevels(levels);
    const bids = mapBookLevels(levels.map((level) => ({ price: level.price, size: level.size })));
    const grouped = prepareGroupedBook(asks, bids, '0.0001');
    const { visibleAsks, visibleBids } = sliceVisibleBook(grouped.asks, grouped.bids);

    expect(visibleAsks).toHaveLength(12);
    expect(visibleBids).toHaveLength(12);
  });
});

describe('order-book-display depth chart', () => {
  it('builds mirrored bid and ask paths from cumulative depth', () => {
    const asks = mapBookLevels([
      { price: '0.1202', size: '10' },
      { price: '0.1205', size: '20' },
    ]);
    const bids = mapBookLevels([
      { price: '0.1200', size: '15' },
      { price: '0.1198', size: '25' },
    ]);
    const grouped = prepareGroupedBook(asks, bids, '0.0001');
    const model = buildDepthChartModel(grouped.asks, grouped.bids);

    expect(model).not.toBeNull();
    expect(model!.bidPoints.length).toBeGreaterThan(0);
    expect(model!.askPoints.length).toBeGreaterThan(0);
    expect(model!.bidPath).toMatch(/^M 50 /);
    expect(model!.askPath).toMatch(/^M 50 /);
    expect(model!.bidPath.endsWith('Z')).toBe(true);
    expect(model!.askPath.endsWith('Z')).toBe(true);
  });

  it('returns null when a book side is empty', () => {
    expect(buildDepthChartModel([], mapBookLevels([{ price: '1', size: '1' }]))).toBeNull();
  });
});
