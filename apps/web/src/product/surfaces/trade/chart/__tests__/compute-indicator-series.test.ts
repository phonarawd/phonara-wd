import { describe, expect, it } from 'vitest';

import {
  computeBollingerBands20,
  computeEma21,
  computeMa7,
  computeRsi14,
} from '../compute-indicator-series';
import type { ChartCandlePoint } from '../to-chart-data';

function candle(time: number, close: number): ChartCandlePoint {
  return { time, open: close, high: close, low: close, close };
}

describe('compute-indicator-series', () => {
  const closes = [10, 11, 12, 13, 14, 15, 16, 17, 18];
  const candles = closes.map((close, index) => candle(1_700_000_000 + index * 60, close));

  it('computes MA7 from the seventh candle onward', () => {
    const ma7 = computeMa7(candles);
    expect(ma7).toHaveLength(3);
    expect(ma7[0]?.value).toBeCloseTo(13);
    expect(ma7[2]?.value).toBeCloseTo(15);
  });

  it('computes EMA21 after warm-up period', () => {
    const longCloses = Array.from({ length: 25 }, (_, index) => index + 1);
    const longCandles = longCloses.map((close, index) => candle(1_700_000_000 + index * 60, close));
    const ema21 = computeEma21(longCandles);
    expect(ema21.length).toBe(5);
    expect(ema21[0]?.value).toBeCloseTo(11);
    expect(ema21[4]?.value).toBeGreaterThan(ema21[0]!.value);
  });

  it('returns empty arrays when history is insufficient', () => {
    expect(computeMa7(candles.slice(0, 6))).toEqual([]);
    expect(computeEma21(candles.slice(0, 20))).toEqual([]);
    expect(computeBollingerBands20(candles.slice(0, 19))).toEqual([]);
    expect(computeRsi14(candles.slice(0, 14))).toEqual([]);
  });

  it('computes Bollinger Bands with upper/middle/lower bands', () => {
    const longCloses = Array.from({ length: 25 }, (_, index) => 100 + index);
    const longCandles = longCloses.map((close, index) => candle(1_700_000_000 + index * 60, close));
    const bands = computeBollingerBands20(longCandles);
    expect(bands.length).toBe(6);
    expect(bands[0]?.upper).toBeGreaterThan(bands[0]!.middle);
    expect(bands[0]?.lower).toBeLessThan(bands[0]!.middle);
  });

  it('computes RSI between 0 and 100', () => {
    const longCloses = Array.from({ length: 20 }, (_, index) => 100 + (index % 3 === 0 ? -1 : 1));
    const longCandles = longCloses.map((close, index) => candle(1_700_000_000 + index * 60, close));
    const rsi = computeRsi14(longCandles);
    expect(rsi.length).toBeGreaterThan(0);
    for (const point of rsi) {
      expect(point.value).toBeGreaterThanOrEqual(0);
      expect(point.value).toBeLessThanOrEqual(100);
    }
  });
});
