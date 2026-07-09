import { describe, expect, it } from 'vitest';

import type { TradingChartCandle } from '@/features/trading/display-chart/display-feed-contract';

import {
  toChartCandleData,
  toChartPriceLineValue,
  toChartVolumeData,
  resolveChartOverlayPrice,
} from '../to-chart-data';

describe('to-chart-data', () => {
  const candles: TradingChartCandle[] = [
    {
      time: 1_700_000_000,
      open: '100.5',
      high: '101.25',
      low: '99.75',
      close: '100.9',
      volume: '12.34',
    },
    {
      time: 1_700_000_060,
      open: '100.9',
      high: '102',
      low: '100.1',
      close: '101.4',
      volume: '8',
    },
  ];

  it('converts string OHLC to chart-only numbers', () => {
    expect(toChartCandleData(candles)).toEqual([
      { time: 1_700_000_000, open: 100.5, high: 101.25, low: 99.75, close: 100.9 },
      { time: 1_700_000_060, open: 100.9, high: 102, low: 100.1, close: 101.4 },
    ]);
  });

  it('maps volume bars with up/down colors', () => {
    const volume = toChartVolumeData(candles, '#0f0', '#f00');
    expect(volume[0]?.value).toBeCloseTo(12.34);
    expect(volume[1]?.color).toBe('#0f0');
  });

  it('parses RPC price strings for chart price lines only', () => {
    expect(toChartPriceLineValue('65000.12')).toBeCloseTo(65000.12);
    expect(toChartPriceLineValue('65,000.12')).toBeCloseTo(65000.12);
    expect(toChartPriceLineValue('0')).toBeNull();
    expect(toChartPriceLineValue('—')).toBeNull();
  });

  it('hides overlay prices outside candle range so candles stay readable', () => {
    expect(resolveChartOverlayPrice('68000', candles)).toBeNull();
    expect(resolveChartOverlayPrice('101', candles)).toBe('101');
  });
});
