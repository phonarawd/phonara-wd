import { describe, expect, it } from 'vitest';
import {
  computeSpotLimitBuyPreview,
  computeSpotLimitSellPreview,
  isSpotLimitCrossed,
  isSpotStopEntryTriggered,
} from './spot';

describe('spot limit/stop preview (TS ↔ SQL T1 parity)', () => {
  it('limit buy preview matches stake / price minus fee on output', () => {
    const result = computeSpotLimitBuyPreview({
      price: '0.100000',
      feeRate: '0.001',
      usdtSpent: '100.000000',
    });
    expect(result.usdtSpent).toBe('100.000000');
    expect(result.netPhon).toBe('999.000000');
    expect(result.feePhon).toBe('1.000000');
  });

  it('limit sell preview matches base * price minus fee on output', () => {
    const result = computeSpotLimitSellPreview({
      price: '0.100000',
      feeRate: '0.001',
      phonSold: '1000.000000',
    });
    expect(result.netUsdt).toBe('99.900000');
    expect(result.feeUsdt).toBe('0.100000');
  });

  it('isSpotLimitCrossed mirrors SQL buy/sell branches', () => {
    expect(isSpotLimitCrossed('buy', '0.09', '0.10')).toBe(true);
    expect(isSpotLimitCrossed('buy', '0.11', '0.10')).toBe(false);
    expect(isSpotLimitCrossed('sell', '0.11', '0.10')).toBe(true);
    expect(isSpotLimitCrossed('sell', '0.09', '0.10')).toBe(false);
  });

  it('isSpotStopEntryTriggered mirrors SQL buy/sell branches', () => {
    expect(isSpotStopEntryTriggered('buy', '0.11', '0.10')).toBe(true);
    expect(isSpotStopEntryTriggered('buy', '0.09', '0.10')).toBe(false);
    expect(isSpotStopEntryTriggered('sell', '0.09', '0.10')).toBe(true);
    expect(isSpotStopEntryTriggered('sell', '0.11', '0.10')).toBe(false);
  });
});
