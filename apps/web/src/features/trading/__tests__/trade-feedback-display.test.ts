import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MessageKey } from '@phonara/i18n';

const productToastShow = vi.hoisted(() => vi.fn());
const productToastShowText = vi.hoisted(() => vi.fn());

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: {
    show: productToastShow,
    showText: productToastShowText,
    dismiss: vi.fn(),
  },
}));

import {
  showTradeFeedback,
  showTradeRpcErrorFeedback,
  tradeFeedbackDedupId,
} from '../trade-feedback-display';
import { mapTradeRpcErrorKey, mapTradeRpcStableCode } from '../trade-rpc-error-display';
import { RpcError } from '@/lib/rpc';

describe('trade-feedback-display · Phase 2B P2-9~10', () => {
  beforeEach(() => {
    productToastShow.mockReset();
    productToastShowText.mockReset();
  });

  it('routes success events through productToast strict show', () => {
    showTradeFeedback({ eventId: 'futures.market.open' });
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'trade.openDone',
      values: undefined,
      action: expect.objectContaining({ labelKey: 'trade.subnav.positions' }),
    });
  });

  it('routes spot market buy with RPC display values', () => {
    showTradeFeedback({
      eventId: 'spot.market.buy',
      values: { amount: '10', base: 'PHON' },
    });
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'trade.spot.buyDoneBase',
      values: { amount: '10', base: 'PHON' },
    });
  });

  it('dedups cancel success by order id', () => {
    const dedupId = tradeFeedbackDedupId('spot.order.canceled', 'ord-1');
    showTradeFeedback({ eventId: 'spot.order.canceled', dedupId });
    expect(productToastShow).toHaveBeenCalledWith(
      expect.objectContaining({ id: dedupId, zone: 'strict', key: 'trade.orderCanceled' }),
    );
    expect(productToastShowText).not.toHaveBeenCalled();
  });

  it('shows rpc errors as strict error tone with stable key', () => {
    showTradeRpcErrorFeedback('error.NO_PRICE' as MessageKey);
    expect(productToastShowText).toHaveBeenCalledWith(
      expect.objectContaining({
        zone: 'strict',
        tone: 'error',
        id: tradeFeedbackDedupId('trade.rpc.error', 'error.NO_PRICE'),
      }),
    );
  });

  it('maps RpcError and stable SQL codes via trade-rpc-error-display', () => {
    expect(mapTradeRpcErrorKey(new RpcError('INSUFFICIENT_BALANCE', 'INSUFFICIENT_BALANCE'))).toBe(
      'error.INSUFFICIENT_BALANCE',
    );
    expect(mapTradeRpcStableCode('stale_price')).toBe('error.NO_PRICE');
    expect(mapTradeRpcStableCode('order_not_found')).toBe('error.ORDER_NOT_FOUND');
    expect(mapTradeRpcStableCode('post_only_would_cross')).toBe('error.POST_ONLY_WOULD_CROSS');
  });

  it('S0 — raw PostgREST payload maps to error.UNKNOWN toast key (no SQL/stack leak)', () => {
    const rawPayload = {
      message: 'relation foo does not exist',
      details: 'internal uuid stack trace',
      hint: 'operator only',
      code: '42P01',
    };
    const errorKey = mapTradeRpcErrorKey(rawPayload);
    expect(errorKey).toBe('error.UNKNOWN');
    showTradeRpcErrorFeedback(errorKey);
    expect(productToastShowText).toHaveBeenCalledWith(
      expect.objectContaining({
        zone: 'strict',
        tone: 'error',
        title: expect.not.stringContaining('relation foo'),
      }),
    );
    const title = productToastShowText.mock.calls[0]?.[0]?.title as string;
    expect(title).not.toContain('internal uuid');
    expect(title).not.toContain('42P01');
  });

  it('supports i18nKeyOverride for partial close variants', () => {
    showTradeFeedback({
      eventId: 'futures.position.closed',
      i18nKeyOverride: 'trade.partialCloseDone',
    });
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'trade.partialCloseDone',
      values: undefined,
    });
  });

  it('wires registry CTA for realtime fill events', () => {
    showTradeFeedback({
      eventId: 'spot.limit.filled',
      dedupId: tradeFeedbackDedupId('spot.limit.filled', 'ord-9'),
    });
    expect(productToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'trade.order.filled',
        action: expect.objectContaining({ labelKey: 'trade.subnav.orders' }),
      }),
    );
  });
});
