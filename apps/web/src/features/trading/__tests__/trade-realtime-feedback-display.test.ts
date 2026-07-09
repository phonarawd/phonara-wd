import { describe, expect, it, beforeEach } from 'vitest';

import {
  diffTradeOrderFillEvents,
  diffTradePositionEvents,
  registerUserInitiatedPositionClose,
  resetUserInitiatedPositionCloses,
  tradeLiquidationNotificationId,
} from '../trade-realtime-feedback-display';

describe('trade-realtime-feedback-display · Phase 2B P2-12', () => {
  beforeEach(() => {
    resetUserInitiatedPositionCloses();
  });

  it('emits partial then filled events when filled_quantity increases', () => {
    const previous = [{ id: 'ord-1', filled_quantity: '0', quantity: '10' }];
    const partial = [{ id: 'ord-1', filled_quantity: '4', quantity: '10' }];
    const filled = [{ id: 'ord-1', filled_quantity: '10', quantity: '10' }];

    expect(diffTradeOrderFillEvents('spot', previous, partial)).toEqual([
      { eventId: 'spot.limit.partial', orderId: 'ord-1', desk: 'spot' },
    ]);
    expect(diffTradeOrderFillEvents('spot', partial, filled)).toEqual([
      { eventId: 'spot.limit.filled', orderId: 'ord-1', desk: 'spot' },
    ]);
  });

  it('emits fill when order disappears after partial progress', () => {
    const previous = [{ id: 'ord-2', filled_quantity: '3', quantity: '10' }];
    expect(diffTradeOrderFillEvents('futures', previous, [])).toEqual([
      { eventId: 'spot.limit.partial', orderId: 'ord-2', desk: 'futures' },
    ]);
  });

  it('skips cancel-only removals with zero fill progress', () => {
    const previous = [{ id: 'ord-3', filled_quantity: '0', quantity: '10' }];
    expect(diffTradeOrderFillEvents('spot', previous, [])).toEqual([]);
  });

  it('detects liquidation and SL/TP async closes', () => {
    const previous = [
      {
        id: 'pos-1',
        status: 'open',
        market: 'BTC_USDT',
        stop_loss: '90000',
        take_profit: null,
      },
      {
        id: 'pos-2',
        status: 'open',
        market: 'ETH_USDT',
        stop_loss: null,
        take_profit: '5000',
      },
    ];
    const next = [
      { ...previous[0], status: 'liquidated' },
      { ...previous[1], status: 'closed' },
    ];

    expect(diffTradePositionEvents(previous, next)).toEqual([
      { eventId: 'futures.liquidated', positionId: 'pos-1', market: 'BTC_USDT' },
      { eventId: 'futures.sltp.triggered', positionId: 'pos-2' },
    ]);
  });

  it('suppresses SL/TP toast after user-initiated close', () => {
    registerUserInitiatedPositionClose('pos-3');
    const previous = [
      {
        id: 'pos-3',
        status: 'open',
        market: 'BTC_USDT',
        stop_loss: '90000',
        take_profit: null,
      },
    ];
    const next = [{ ...previous[0], status: 'closed' }];
    expect(diffTradePositionEvents(previous, next)).toEqual([]);
  });

  it('builds stable liquidation inbox ids', () => {
    expect(tradeLiquidationNotificationId('pos-9')).toBe('trade:liquidated:pos-9');
  });
});
