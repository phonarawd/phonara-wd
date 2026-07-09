import { describe, it, expect } from 'vitest';
import { computeFundingPayment, TradingError } from './index';

describe('computeFundingPayment', () => {
  it('long pays funding (negative, USDT 6dp truncated)', () => {
    // notional 1000 × rate 0.0001 = 0.1 → long pays −0.100000
    expect(
      computeFundingPayment({
        notional: '1000.000000',
        rate: '0.0001',
        side: 'long',
        marginCurrency: 'USDT',
      }),
    ).toBe('-0.100000');
  });

  it('short receives funding (positive)', () => {
    expect(
      computeFundingPayment({
        notional: '1000.000000',
        rate: '0.0001',
        side: 'short',
        marginCurrency: 'USDT',
      }),
    ).toBe('0.100000');
  });

  it('truncates payment to margin currency precision (no round-up dust)', () => {
    // 864.197523 × 0.000123456 = 0.106690088… → truncated to −0.106690
    expect(
      computeFundingPayment({
        notional: '864.197523',
        rate: '0.000123456',
        side: 'long',
        marginCurrency: 'USDT',
      }),
    ).toBe('-0.106690');
  });

  it('supports PHON margin currency quantization', () => {
    expect(
      computeFundingPayment({
        notional: '25000.000000',
        rate: '0.0002',
        side: 'short',
        marginCurrency: 'PHON',
      }),
    ).toBe('5.000000');
  });

  it('zero rate yields zero payment for both sides', () => {
    expect(
      computeFundingPayment({
        notional: '500.000000',
        rate: '0',
        side: 'long',
        marginCurrency: 'USDT',
      }),
    ).toBe('0.000000');
    expect(
      computeFundingPayment({
        notional: '500.000000',
        rate: '0',
        side: 'short',
        marginCurrency: 'USDT',
      }),
    ).toBe('0.000000');
  });

  it('rejects invalid notional or rate strings', () => {
    expect(() =>
      computeFundingPayment({
        notional: 'abc',
        rate: '0.0001',
        side: 'long',
        marginCurrency: 'USDT',
      }),
    ).toThrow(TradingError);
  });
});
