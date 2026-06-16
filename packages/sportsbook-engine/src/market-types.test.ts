import { describe, expect, it } from 'vitest';
import { parseTotalsLine, SPORTS_MARKET_TYPES } from './market-types';

describe('parseTotalsLine', () => {
  it('uses explicit market line', () => {
    expect(parseTotalsLine('totals', '3.5')).toBe('3.5');
  });

  it('maps legacy totals_2_5', () => {
    expect(parseTotalsLine('totals_2_5')).toBe('2.5');
  });

  it('parses totals_3_5 slug', () => {
    expect(parseTotalsLine('totals_3_5')).toBe('3.5');
  });
});

describe('SPORTS_MARKET_TYPES', () => {
  it('includes world-class market keys', () => {
    expect(SPORTS_MARKET_TYPES).toContain('asian_handicap');
    expect(SPORTS_MARKET_TYPES).toContain('btts');
    expect(SPORTS_MARKET_TYPES).toContain('prop_yes_no');
  });
});
