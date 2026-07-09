import { describe, it, expect } from 'vitest';
import { computeSpotBuy, computeSpotSell, computeMajorSpotBuy, TradingError } from './index';

describe('computeSpotBuy', () => {
  it('spends USDT, receives PHON minus fee', () => {
    const r = computeSpotBuy({ price: '0.01', usdtSpent: '10', feeRate: '0.001' });
    // gross = 10 / 0.01 = 1000; fee = 1; net = 999
    expect(r.grossPhon).toBe('1000.000000');
    expect(r.feePhon).toBe('1.000000');
    expect(r.netPhon).toBe('999.000000');
  });

  it('uses default fee when empty', () => {
    const r = computeSpotBuy({ price: '0.01', usdtSpent: '10', feeRate: '' });
    expect(r.feePhon).toBe('1.000000');
  });

  it('rejects zero price', () => {
    expect(() => computeSpotBuy({ price: '0', usdtSpent: '10', feeRate: '0.001' })).toThrow(
      TradingError,
    );
  });

  it('rejects fee rate >= 1', () => {
    expect(() => computeSpotBuy({ price: '0.01', usdtSpent: '10', feeRate: '1' })).toThrow(
      TradingError,
    );
  });
});

describe('computeSpotSell', () => {
  it('spends PHON, receives USDT minus fee', () => {
    const r = computeSpotSell({ price: '0.01', phonSold: '1000', feeRate: '0.001' });
    // gross = 1000 × 0.01 = 10; fee = 0.01; net = 9.99
    expect(r.grossUsdt).toBe('10.000000');
    expect(r.feeUsdt).toBe('0.010000');
    expect(r.netUsdt).toBe('9.990000');
  });

  it('round-trips approximately (buy then sell at same price loses only fees)', () => {
    const buy = computeSpotBuy({ price: '0.01', usdtSpent: '100', feeRate: '0.001' });
    const sell = computeSpotSell({ price: '0.01', phonSold: buy.netPhon, feeRate: '0.001' });
    // started with 100 USDT, after two 0.1% fees should be < 100
    expect(Number(sell.netUsdt)).toBeLessThan(100);
    expect(Number(sell.netUsdt)).toBeGreaterThan(99);
  });
});

describe('computeMajorSpotBuy', () => {
  it('USDT stake: spends USDT, receives base qty minus fee (all 6dp)', () => {
    const r = computeMajorSpotBuy({
      price: '68000.123456',
      stakeCurrency: 'USDT',
      stakeAmount: '680.001234',
      feeRate: '0.001',
    });
    // grossBase = 680.001234 / 68000.123456 → truncated 0.009999
    expect(r.stakeSpent).toBe('680.001234');
    expect(r.price).toBe('68000.123456');
    expect(r.grossBase).toBe('0.009999');
    expect(r.feeBase).toBe('0.000009');
    expect(r.netBase).toBe('0.009989');
  });

  it('PHON stake converts via phonUsdtPrice before base qty calc', () => {
    const r = computeMajorSpotBuy({
      price: '3500.654321',
      stakeCurrency: 'PHON',
      stakeAmount: '1000.000000',
      phonUsdtPrice: '0.01',
      feeRate: '0.001',
    });
    // usdtSpent = 1000 × 0.01 = 10; grossBase = 10 / 3500.654321
    expect(r.stakeSpent).toBe('1000.000000');
    expect(r.grossBase).toBe('0.002856');
    expect(r.feeBase).toBe('0.000002');
    expect(r.netBase).toBe('0.002853');
  });

  it('rejects zero stake amount', () => {
    expect(() =>
      computeMajorSpotBuy({
        price: '100.000000',
        stakeCurrency: 'USDT',
        stakeAmount: '0',
        feeRate: '0.001',
      }),
    ).toThrow(TradingError);
  });
});
