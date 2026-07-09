import { describe, expect, it } from 'vitest';

import {
  isBalancePercentPresetActive,
  resolveSpotTicketEstimates,
} from '@/features/trading/order-ticket/order-ticket-display';

describe('order-ticket-display', () => {
  it('resolves PHON_USDT spot buy net receive and fee from engine preview', () => {
    const estimates = resolveSpotTicketEstimates({
      side: 'buy',
      symbol: 'PHON_USDT',
      price: '0.01',
      amount: '10',
      feeRate: '0.001',
    });
    expect(estimates).not.toBeNull();
    expect(estimates?.receiveCurrency).toBe('PHON');
    expect(estimates?.feeCurrency).toBe('PHON');
    expect(Number(estimates?.estFee)).toBeGreaterThan(0);
    expect(Number(estimates?.netReceive)).toBeGreaterThan(0);
  });

  it('resolves PHON_USDT spot sell net receive and fee from engine preview', () => {
    const estimates = resolveSpotTicketEstimates({
      side: 'sell',
      symbol: 'PHON_USDT',
      price: '0.01',
      amount: '1000',
      feeRate: '0.001',
    });
    expect(estimates).not.toBeNull();
    expect(estimates?.receiveCurrency).toBe('USDT');
    expect(estimates?.feeCurrency).toBe('USDT');
    expect(Number(estimates?.estFee)).toBeGreaterThan(0);
    expect(Number(estimates?.netReceive)).toBeGreaterThan(0);
  });

  it('resolves major BTC_USDT buy with base asset receive currency (P2-1)', () => {
    const estimates = resolveSpotTicketEstimates({
      side: 'buy',
      symbol: 'BTC_USDT',
      price: '68000',
      amount: '680',
      feeRate: '0.001',
      buyStakeCurrency: 'USDT',
    });
    expect(estimates).not.toBeNull();
    expect(estimates?.receiveCurrency).toBe('BTC');
    expect(estimates?.feeCurrency).toBe('BTC');
  });

  it('resolves major buy with PHON stake via phonUsdtPrice (P2-1)', () => {
    const estimates = resolveSpotTicketEstimates({
      side: 'buy',
      symbol: 'ETH_USDT',
      price: '3500',
      amount: '1000',
      feeRate: '0.001',
      buyStakeCurrency: 'PHON',
      phonUsdtPrice: '0.01',
    });
    expect(estimates).not.toBeNull();
    expect(estimates?.receiveCurrency).toBe('ETH');
    expect(Number(estimates?.netReceive)).toBeGreaterThan(0);
  });

  it('returns null when price or amount is invalid', () => {
    expect(
      resolveSpotTicketEstimates({
        side: 'buy',
        symbol: 'PHON_USDT',
        price: '0',
        amount: '10',
        feeRate: '0.001',
      }),
    ).toBeNull();
    expect(
      resolveSpotTicketEstimates({
        side: 'buy',
        symbol: 'PHON_USDT',
        price: '0.01',
        amount: '',
        feeRate: '0.001',
      }),
    ).toBeNull();
  });

  it('highlights balance percent chip when amount matches preset slice', () => {
    expect(isBalancePercentPresetActive('100.000000', '25.000000', 25)).toBe(true);
    expect(isBalancePercentPresetActive('100.000000', '50.000000', 50)).toBe(true);
    expect(isBalancePercentPresetActive('100.000000', '30.000000', 25)).toBe(false);
  });
});
