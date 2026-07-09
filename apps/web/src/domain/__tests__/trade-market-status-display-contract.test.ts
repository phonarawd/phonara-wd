import { describe, expect, it } from 'vitest';

import {
  assertTradeMarketStatusDisplayContractSync,
  P9_TRADE_ORACLE_CIRCUIT_BANNER_TODO,
  resolveTradeMarketStatusBanner,
  TRADE_MARKET_STATUS_BANNER_COMPONENT,
  TRADE_MARKET_STATUS_BANNER_MOUNT,
} from '../trade-market-status-display-contract';

const healthyBase = {
  systemHalted: false,
  spotBlocked: false,
  futuresBlocked: false,
  marketSymbol: 'PHON_USDT',
  marketHalted: false,
  symbolStale: false,
  symbolFrozen: false,
  realtimeDisconnected: false,
} as const;

describe('trade-market-status-display-contract §25.12.9.1-E #20', () => {
  it('registers P9 todo id and single banner owner', () => {
    expect(P9_TRADE_ORACLE_CIRCUIT_BANNER_TODO).toBe('p9-trade-oracle-circuit-banner');
    expect(TRADE_MARKET_STATUS_BANNER_COMPONENT).toContain('trade-market-status-banner');
    expect(TRADE_MARKET_STATUS_BANNER_MOUNT).toContain('spot-desk-page');
    expect(TRADE_MARKET_STATUS_BANNER_MOUNT).toContain('futures-desk-page');
  });

  it('prioritizes kill-switch over circuit and stale', () => {
    expect(
      resolveTradeMarketStatusBanner({
        desk: 'spot',
        ...healthyBase,
        spotBlocked: true,
        marketHalted: true,
        symbolStale: true,
        realtimeDisconnected: true,
      })?.kind,
    ).toBe('kill');
  });

  it('prioritizes circuit halt over disconnect and stale for active symbol', () => {
    expect(
      resolveTradeMarketStatusBanner({
        desk: 'futures',
        ...healthyBase,
        marketSymbol: 'BTCUSDT-SIM',
        marketHalted: true,
        symbolStale: true,
        realtimeDisconnected: true,
      }),
    ).toEqual({
      kind: 'circuit',
      titleKey: 'trade.dataStatus.circuit',
      descriptionKey: 'trade.dataStatus.circuitDescription',
    });
  });

  it('shows realtime disconnect banner when channel is lost but timestamp is fresh', () => {
    expect(
      resolveTradeMarketStatusBanner({
        desk: 'spot',
        ...healthyBase,
        symbolStale: false,
        realtimeDisconnected: true,
      }),
    ).toEqual({
      kind: 'realtimeDisconnected',
      titleKey: 'trade.dataStatus.realtimeDisconnected',
      descriptionKey: 'trade.dataStatus.realtimeDisconnectedDescription',
    });
  });

  it('prioritizes realtime disconnect over stale', () => {
    expect(
      resolveTradeMarketStatusBanner({
        desk: 'spot',
        ...healthyBase,
        symbolStale: true,
        realtimeDisconnected: true,
      })?.kind,
    ).toBe('realtimeDisconnected');
  });

  it('shows stale banner when feed is delayed only', () => {
    expect(
      resolveTradeMarketStatusBanner({
        desk: 'spot',
        ...healthyBase,
        symbolStale: true,
      })?.kind,
    ).toBe('stale');
  });

  it('shows freeze banner when mark is unchanged but oracle is fresh (P4-A)', () => {
    expect(
      resolveTradeMarketStatusBanner({
        desk: 'spot',
        ...healthyBase,
        symbolFrozen: true,
      })?.kind,
    ).toBe('freeze');
  });

  it('returns null when market is healthy', () => {
    expect(
      resolveTradeMarketStatusBanner({
        desk: 'futures',
        ...healthyBase,
        marketSymbol: 'BTCUSDT-SIM',
      }),
    ).toBeNull();
  });

  it('passes contract sync guard', () => {
    expect(() => assertTradeMarketStatusDisplayContractSync()).not.toThrow();
  });
});
