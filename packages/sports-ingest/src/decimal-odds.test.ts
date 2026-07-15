import { describe, expect, it } from 'vitest';
import { oddsUpsertMessage, parseOddsDecimal, vendorPriceToOddsString } from './decimal-odds';

describe('vendorPriceToOddsString', () => {
  it('trims strings and stringifies finite vendor numbers', () => {
    expect(vendorPriceToOddsString(' 2.10 ')).toBe('2.10');
    expect(vendorPriceToOddsString(2.1)).toBe('2.1');
  });

  it('rejects empty / non-finite', () => {
    expect(() => vendorPriceToOddsString('  ')).toThrow(/empty/);
    expect(() => vendorPriceToOddsString(Number.NaN)).toThrow(/finite/);
  });
});

describe('parseOddsDecimal', () => {
  it('parses decimal strings only', () => {
    expect(parseOddsDecimal('2.05')).toBe('2.05');
    expect(parseOddsDecimal(' 1.91 ')).toBe('1.91');
  });

  it('rejects number at runtime (PIR string-only)', () => {
    expect(() => parseOddsDecimal(2.1 as unknown as string)).toThrow(/requires string/);
  });

  it('rejects odds <= 1', () => {
    expect(() => parseOddsDecimal('1')).toThrow(/greater than 1/);
    expect(() => parseOddsDecimal('0.99')).toThrow(/greater than 1/);
  });
});

describe('oddsUpsertMessage', () => {
  it('emits odds_upsert with canonical string odds', () => {
    expect(oddsUpsertMessage('o1', '2.05', '2026-07-11T00:00:00.000Z')).toEqual({
      type: 'odds_upsert',
      outcomeId: 'o1',
      odds: '2.05',
      capturedAt: '2026-07-11T00:00:00.000Z',
    });
  });

  it('accepts vendor number only via vendorPriceToOddsString edge', () => {
    const odds = parseOddsDecimal(vendorPriceToOddsString(2.1));
    const message = oddsUpsertMessage('o1', odds, '2026-07-11T00:00:00.000Z');
    expect(message).toMatchObject({ type: 'odds_upsert', odds: '2.1' });
  });
});
