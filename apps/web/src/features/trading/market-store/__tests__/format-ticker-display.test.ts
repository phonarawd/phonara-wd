import { describe, expect, it } from 'vitest';

import {
  formatChange24Display,
  formatOpenInterestDisplay,
  formatTickerPriceDisplay,
  formatVolume24Display,
} from '@/features/trading/market-store/format-ticker-display';

describe('format-ticker-display', () => {
  it('formats positive and negative 24h change', () => {
    expect(formatChange24Display('2.345').text).toBe('+2.35%');
    expect(formatChange24Display('2.345').tone).toBe('up');
    expect(formatChange24Display('-1.2').text).toBe('-1.20%');
    expect(formatChange24Display('-1.2').tone).toBe('down');
    expect(formatChange24Display('0').text).toBe('—');
    expect(formatChange24Display('0').tone).toBe('neutral');
  });

  it('formats volume and open interest with K/M/B suffixes', () => {
    expect(formatVolume24Display('0')).toBe('—');
    expect(formatVolume24Display('1500')).toBe('1.5K');
    expect(formatVolume24Display('2500000')).toBe('2.50M');
    expect(formatOpenInterestDisplay('1200000000')).toBe('1.20B');
  });

  it('formats ticker prices with grouping', () => {
    expect(formatTickerPriceDisplay('0')).toBe('—');
    expect(formatTickerPriceDisplay('65000.12')).toBe('65,000.1');
  });
});
