/**
 * Trade desk RpcError → i18n key map (Phase 2B P2-9 · P2-11).
 * Wraps stable backend codes; never surfaces raw Postgres messages.
 */

import type { MessageKey } from '@phonara/i18n';

import { RpcError } from '@/lib/rpc';
import { translateError } from '@/lib/translate-error';

/** Trade-relevant stable codes surfaced on desk submit/cancel paths. */
export const TRADE_RPC_STABLE_CODES = [
  'stale_price',
  'no_price',
  'insufficient_available',
  'insufficient_balance',
  'market_halted',
  'system_halted',
  'feature_disabled',
  'invalid_amount',
  'invalid_price',
  'invalid_margin',
  'invalid_margin_currency',
  'invalid_leverage',
  'leverage_too_high',
  'position_limit',
  'market_oi_cap',
  'duplicate_request',
  'unauthenticated',
  'cross_margin_not_available',
  // Phase E advanced orders
  'order_not_found',
  'order_not_cancellable',
  'order_not_fillable',
  'order_already_filled',
  'post_only_would_cross',
  'invalid_time_in_force',
  'tif_limit_only',
  'limit_price_required',
  'stop_price_required',
  'invalid_order_type',
  'invalid_display_quantity',
  'invalid_trailing_callback_rate',
  'invalid_activation_price',
  'limit_not_crossed',
  'stop_not_triggered',
  'client_request_id_required',
  'market_not_found',
] as const;

export type TradeRpcStableCode = (typeof TRADE_RPC_STABLE_CODES)[number];

/**
 * Maps an unknown thrown value to a translatable MessageKey for trade desk feedback.
 * Prefers {@link RpcError.i18nKey} when the error originated from `callRpc`.
 */
export function mapTradeRpcErrorKey(
  err: unknown,
  fallback: MessageKey = 'error.UNKNOWN',
): MessageKey {
  if (err instanceof RpcError) {
    const mapped = translateError(err);
    if (mapped !== 'error.UNKNOWN') {
      return mapped;
    }
    const fromCode = `error.${err.code}` as MessageKey;
    if (fromCode !== 'error.UNKNOWN') {
      return fromCode;
    }
  }
  return translateError(err, fallback);
}

/** Maps a stable backend code string (SQL RAISE / engine) to i18n. */
export function mapTradeRpcStableCode(code: string): MessageKey {
  return translateError(new Error(code));
}
