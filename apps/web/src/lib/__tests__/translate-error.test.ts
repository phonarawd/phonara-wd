import { describe, expect, it } from 'vitest';

import { ERROR_KEY_MAP, translateError } from '../translate-error';
import {
  TRADE_RPC_STABLE_CODES,
  mapTradeRpcStableCode,
} from '@/features/trading/trade-rpc-error-display';

describe('translate-error · PQA F1 error mapping', () => {
  it('maps Phase E advanced order codes', () => {
    expect(translateError(new Error('order_not_found'))).toBe('error.ORDER_NOT_FOUND');
    expect(translateError(new Error('post_only_would_cross'))).toBe('error.POST_ONLY_WOULD_CROSS');
    expect(translateError(new Error('invalid_time_in_force'))).toBe('error.INVALID_TIME_IN_FORCE');
    expect(translateError(new Error('order_not_cancellable'))).toBe('error.ORDER_NOT_CANCELLABLE');
    expect(translateError(new Error('order_not_fillable'))).toBe('error.ORDER_NOT_FILLABLE');
    expect(translateError(new Error('order_already_filled'))).toBe('error.ORDER_ALREADY_FILLED');
    expect(translateError(new Error('tif_limit_only'))).toBe('error.TIF_LIMIT_ONLY');
    expect(translateError(new Error('limit_price_required'))).toBe('error.LIMIT_PRICE_REQUIRED');
    expect(translateError(new Error('stop_price_required'))).toBe('error.STOP_PRICE_REQUIRED');
    expect(translateError(new Error('invalid_order_type'))).toBe('error.INVALID_ORDER_TYPE');
    expect(translateError(new Error('invalid_display_quantity'))).toBe(
      'error.INVALID_DISPLAY_QUANTITY',
    );
    expect(translateError(new Error('invalid_trailing_callback_rate'))).toBe(
      'error.INVALID_TRAILING_CALLBACK_RATE',
    );
    expect(translateError(new Error('invalid_activation_price'))).toBe(
      'error.INVALID_ACTIVATION_PRICE',
    );
    expect(translateError(new Error('limit_not_crossed'))).toBe('error.LIMIT_NOT_CROSSED');
    expect(translateError(new Error('stop_not_triggered'))).toBe('error.STOP_NOT_TRIGGERED');
    expect(translateError(new Error('client_request_id_required'))).toBe(
      'error.CLIENT_REQUEST_ID_REQUIRED',
    );
  });

  it('maps sports, withdrawal, and geo codes', () => {
    expect(translateError(new Error('market_hedge_blocked'))).toBe('error.MARKET_HEDGE_BLOCKED');
    expect(translateError(new Error('sports_user_banned'))).toBe('error.SPORTS_USER_BANNED');
    expect(translateError(new Error('withdrawal_address_not_whitelisted'))).toBe(
      'error.WITHDRAWAL_ADDRESS_NOT_WHITELISTED',
    );
    expect(translateError(new Error('geo_blocked'))).toBe('error.GEO_BLOCKED');
  });

  it('maps affiliate_self_forbidden before generic forbidden', () => {
    expect(translateError(new Error('affiliate_self_forbidden'))).toBe(
      'error.AFFILIATE_SELF_FORBIDDEN',
    );
    expect(translateError(new Error('forbidden'))).toBe('error.FORBIDDEN');
  });

  it('maps market_not_found once to MARKET_NOT_FOUND (no duplicate needle)', () => {
    const needles = ERROR_KEY_MAP.filter(([needle]) => needle === 'market_not_found');
    expect(needles).toHaveLength(1);
    expect(translateError(new Error('market_not_found'))).toBe('error.MARKET_NOT_FOUND');
  });

  it('syncs trade-rpc-error-display registry with Phase E stable codes', () => {
    for (const code of [
      'order_not_found',
      'post_only_would_cross',
      'invalid_time_in_force',
      'market_not_found',
    ] as const) {
      expect(TRADE_RPC_STABLE_CODES).toContain(code);
      expect(mapTradeRpcStableCode(code)).not.toBe('error.UNKNOWN');
    }
  });

  it('returns error.UNKNOWN for unrecognized payloads', () => {
    expect(translateError({ message: 'relation secret_table does not exist' })).toBe(
      'error.UNKNOWN',
    );
  });
});
