import { Decimal } from '@phonara/money';
import { describe, expect, it } from 'vitest';
import { quantize6, quantize6String } from './quantize';

describe('quantize6', () => {
  it('accepts Decimal and string', () => {
    expect(quantize6(new Decimal('1.23456789')).toFixed(6)).toBe('1.234567');
    expect(quantize6('2.9999999').toFixed(6)).toBe('2.999999');
    expect(quantize6String('1.5')).toBe('1.500000');
  });

  it('rejects number at runtime (PIR float boundary)', () => {
    expect(() => quantize6(1.91 as unknown as string)).toThrow(/forbids number/);
    expect(() => quantize6String(2.1 as unknown as string)).toThrow(/forbids number/);
  });
});
