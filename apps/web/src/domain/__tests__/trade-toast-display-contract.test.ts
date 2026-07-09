import { describe, expect, it } from 'vitest';

import {
  assertTradeToastRegistrySync,
  findTradeToastRegistryRow,
  listTradeToastRowsByPhase,
  TRADE_TOAST_EVENT_REGISTRY,
} from '../trade-toast-display-contract';

describe('trade-toast-display-contract · Phase 2B P2-11', () => {
  it('registers all spot · futures · staking sync events', () => {
    expect(TRADE_TOAST_EVENT_REGISTRY.length).toBeGreaterThanOrEqual(20);
    expect(findTradeToastRegistryRow('spot.market.buy')?.implemented).toBe('yes');
    expect(findTradeToastRegistryRow('futures.market.open')?.implemented).toBe('yes');
    expect(findTradeToastRegistryRow('staking.staked')?.implemented).toBe('yes');
  });

  it('defers T2 rows with ownerTodo', () => {
    const deferred = TRADE_TOAST_EVENT_REGISTRY.filter((row) => row.implemented === 'deferred');
    expect(deferred.length).toBeGreaterThanOrEqual(1);
    for (const row of deferred) {
      expect(row.ownerTodo).toBeTruthy();
    }
    expect(findTradeToastRegistryRow('spot.limit.filled')?.implemented).toBe('yes');
    expect(findTradeToastRegistryRow('futures.liquidated')?.implemented).toBe('yes');
  });

  it('maps P2-12 realtime rows to strict toast keys', () => {
    expect(findTradeToastRegistryRow('spot.limit.partial')?.i18nKey).toBe(
      'trade.order.partialFill',
    );
    expect(findTradeToastRegistryRow('futures.sltp.triggered')?.cta).toBe('positions');
  });

  it('maps P2-10 audit rows to strict toast keys', () => {
    const p210 = listTradeToastRowsByPhase('P2-10');
    expect(p210.some((row) => row.eventId === 'spot.order.canceled')).toBe(true);
    expect(p210.some((row) => row.eventId === 'futures.margin.adjusted')).toBe(true);
    expect(findTradeToastRegistryRow('spot.market.sell')?.i18nKey).toBe('trade.spot.sellDoneQuote');
  });

  it('passes registry sync guard', () => {
    expect(() => assertTradeToastRegistrySync()).not.toThrow();
  });
});
