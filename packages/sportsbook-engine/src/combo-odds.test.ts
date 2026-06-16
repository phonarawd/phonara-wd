import { describe, expect, it } from 'vitest';
import { productComboOdds, SportsbookComboError } from './combo-odds';

describe('productComboOdds', () => {
  it('multiplies two decimal odds strings', () => {
    expect(productComboOdds(['2.00', '1.50'])).toBe('3');
  });

  it('rejects more than 8 legs', () => {
    const legs = Array.from({ length: 9 }, () => '1.10');
    expect(() => productComboOdds(legs)).toThrow(SportsbookComboError);
  });

  it('rejects odds at or below 1', () => {
    expect(() => productComboOdds(['1.00'])).toThrow(SportsbookComboError);
  });
});
