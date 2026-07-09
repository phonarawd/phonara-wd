import { describe, expect, it } from 'vitest';

import {
  filterSpotDeskOpenOrders,
  parseSpotPairSymbol,
  readSpotTradeReceivedAmount,
  resolveSpotAvailableBalance,
  resolveSpotBuyStakeCurrency,
  resolveSpotSellAmountAsset,
  resolveSpotSellReceiveCurrency,
  canSelectSpotPhonBuyStake,
} from '../spot-stake-display-contract';

describe('spot-stake-display-contract §13.1.1', () => {
  it('parses base and quote from spot market symbol', () => {
    expect(parseSpotPairSymbol('PHON_USDT')).toEqual({
      symbol: 'PHON_USDT',
      baseAsset: 'PHON',
      quoteAsset: 'USDT',
    });
    expect(parseSpotPairSymbol('BTC_USDT')).toEqual({
      symbol: 'BTC_USDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
    });
  });

  it('requires USDT buy stake on PHON_USDT', () => {
    expect(resolveSpotBuyStakeCurrency('PHON_USDT')).toBe('USDT');
    expect(resolveSpotBuyStakeCurrency('BTC_USDT')).toBe('USDT');
  });

  it('allows PHON buy stake only on major *_USDT pairs', () => {
    expect(canSelectSpotPhonBuyStake('PHON_USDT')).toBe(false);
    expect(canSelectSpotPhonBuyStake('BTC_USDT')).toBe(true);
  });

  it('uses base qty for sell and quote receive currency', () => {
    expect(resolveSpotSellAmountAsset('PHON_USDT')).toBe('PHON');
    expect(resolveSpotSellAmountAsset('BTC_USDT')).toBe('BTC');
    expect(resolveSpotSellReceiveCurrency('PHON_USDT')).toBe('USDT');
    expect(resolveSpotSellReceiveCurrency('BTC_USDT')).toBe('USDT');
  });

  it('resolves available balance from wallet or spot holdings', () => {
    const wallet = { phonAvail: '100.000000', usdtAvail: '50.000000' };
    expect(resolveSpotAvailableBalance('buy', 'PHON_USDT', wallet, '0')).toEqual({
      amount: '50.000000',
      currency: 'USDT',
    });
    expect(resolveSpotAvailableBalance('sell', 'PHON_USDT', wallet, '0')).toEqual({
      amount: '100.000000',
      currency: 'PHON',
    });
    expect(resolveSpotAvailableBalance('sell', 'BTC_USDT', wallet, '0.250000')).toEqual({
      amount: '0.250000',
      currency: 'BTC',
    });
  });

  it('filters spot desk open orders by spot symbol whitelist only (A1)', () => {
    const spotSymbols = new Set(['PHON_USDT', 'BTC_USDT']);
    const orders = [
      { id: '1', market: 'PHON_USDT' },
      { id: '2', market: 'PHONUSDT-PERP' },
      { id: '3', market: 'BTCUSDT-SIM' },
      { id: '4', market: 'BTC_USDT' },
    ];

    expect(filterSpotDeskOpenOrders(orders, spotSymbols)).toEqual([
      { id: '1', market: 'PHON_USDT' },
      { id: '4', market: 'BTC_USDT' },
    ]);
  });

  it('reads RPC received amounts for phon and major pairs', () => {
    expect(readSpotTradeReceivedAmount('buy', 'PHON_USDT', { phon_received: '12.500000' })).toEqual(
      { amount: '12.500000', currency: 'PHON' },
    );
    expect(readSpotTradeReceivedAmount('buy', 'BTC_USDT', { base_received: '0.010000' })).toEqual({
      amount: '0.010000',
      currency: 'BTC',
    });
    expect(readSpotTradeReceivedAmount('sell', 'PHON_USDT', { usdt_received: '9.500000' })).toEqual(
      { amount: '9.500000', currency: 'USDT' },
    );
    expect(
      readSpotTradeReceivedAmount('sell', 'BTC_USDT', { stake_received: '420.000000' }),
    ).toEqual({ amount: '420.000000', currency: 'USDT' });
  });
});
