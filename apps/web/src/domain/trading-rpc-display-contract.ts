/**
 * Trade desk client RPC — typed `callRpc` parsers (Phase C1 · M-6).
 * Display/settlement boundary: UI reads parsed RPC payloads only; never recomputes money.
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` · `docs/SSOT/ENGINE_BOUNDARY.md`
 */

import type { Json } from '@phonara/shared-types';

import type { TradingChartCandle } from '@/features/trading/display-chart/display-feed-contract';
import {
  FUTURES_CANCEL_ORDER_RPC,
  FUTURES_SET_MARGIN_MODE_RPC,
} from './trade-order-states-display-contract';
import { FUTURES_SET_POSITION_MODE_RPC } from './margin-position-mode-display-contract';
import type { RpcName } from '@/lib/rpc';

export {
  FUTURES_ADJUST_ISOLATED_MARGIN_RPC,
  FUTURES_CANCEL_ORDER_RPC,
  FUTURES_CLOSE_POSITION_RPC,
  FUTURES_LIMIT_ORDER_RPC,
  FUTURES_MARKET_OPEN_RPC,
  FUTURES_PARTIAL_CLOSE_RPC,
  FUTURES_SET_MARGIN_MODE_RPC,
  FUTURES_STOP_ORDER_RPC,
  FUTURES_UPDATE_SLTP_RPC,
  FUTURES_SET_TRAILING_STOP_RPC,
  FUTURES_CLEAR_TRAILING_STOP_RPC,
  SPOT_MARKET_BUY_RPC,
  SPOT_MARKET_SELL_RPC,
} from './trade-order-states-display-contract';

export { FUTURES_SET_POSITION_MODE_RPC } from './margin-position-mode-display-contract';

/** §3.1 audit inventory — client-invoked trade RPCs (display + money submit). */
export const TRADING_CLIENT_RPC_NAMES = [
  'rpc_get_candles',
  'rpc_get_synthetic_book',
  'rpc_cancel_spot_order',
  FUTURES_SET_MARGIN_MODE_RPC,
  FUTURES_SET_POSITION_MODE_RPC,
  'rpc_get_position_mode',
  FUTURES_CANCEL_ORDER_RPC,
  'rpc_open_futures_position',
  'rpc_place_limit_order',
  'rpc_place_stop_order',
  'rpc_partial_close_futures',
  'rpc_adjust_isolated_margin',
  'rpc_update_futures_position_sltp',
  'rpc_set_trailing_stop',
  'rpc_clear_trailing_stop',
  'rpc_close_futures_position',
  'rpc_record_consent',
  'rpc_spot_market_buy',
  'rpc_spot_market_sell',
  'rpc_place_spot_limit_order',
  'rpc_place_spot_stop_order',
  'rpc_stake_phon',
  'rpc_stake',
  'rpc_unstake_phon',
  'rpc_claim_staking_reward',
] as const satisfies readonly RpcName[];

export type TradingClientRpcName = (typeof TRADING_CLIENT_RPC_NAMES)[number];

export const TRADING_GET_CANDLES_RPC = 'rpc_get_candles' as const satisfies RpcName;
export const TRADING_GET_SYNTHETIC_BOOK_RPC = 'rpc_get_synthetic_book' as const satisfies RpcName;
export const TRADING_CANCEL_SPOT_ORDER_RPC = 'rpc_cancel_spot_order' as const satisfies RpcName;
export const TRADING_RECORD_CONSENT_RPC = 'rpc_record_consent' as const satisfies RpcName;
export const TRADING_PLACE_SPOT_LIMIT_ORDER_RPC =
  'rpc_place_spot_limit_order' as const satisfies RpcName;
export const TRADING_PLACE_SPOT_STOP_ORDER_RPC =
  'rpc_place_spot_stop_order' as const satisfies RpcName;
export const TRADING_STAKE_PHON_RPC = 'rpc_stake_phon' as const satisfies RpcName;
export const TRADING_STAKE_RPC = 'rpc_stake' as const satisfies RpcName;
export const TRADING_UNSTAKE_PHON_RPC = 'rpc_unstake_phon' as const satisfies RpcName;
export const TRADING_CLAIM_STAKING_REWARD_RPC =
  'rpc_claim_staking_reward' as const satisfies RpcName;

/** Oracle `rpc_get_candles` rows — same canonical shape as display chart candles. */
export type TradingCandle = TradingChartCandle;

export interface SyntheticBookLevel {
  price: string;
  size: string;
}

export interface SyntheticBook {
  symbol: string;
  mid: string;
  asks: SyntheticBookLevel[];
  bids: SyntheticBookLevel[];
  disclosure: string;
}

/** Parsed JSON object returned by trade submit/cancel/margin/staking RPCs. */
export type TradingRpcPayload = Readonly<Record<string, Json | undefined>>;

export type MarginModeRpcResult = {
  user_id: string;
  margin_mode: 'isolated' | 'cross';
};

export type PositionModeRpcResult = {
  user_id: string;
  position_mode: 'one_way' | 'hedge';
};

export type OrderCancelRpcResult = {
  order_id: string;
  status: string;
};

function isJsonObject(value: Json | null | undefined): value is Record<string, Json | undefined> {
  return (
    value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)
  );
}

function readStringField(record: Record<string, Json | undefined>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function readNumberField(record: Record<string, Json | undefined>, key: string): number | null {
  const value = record[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseSyntheticBookLevel(entry: Json): SyntheticBookLevel | null {
  if (!isJsonObject(entry)) return null;
  const price = readStringField(entry, 'price');
  const size = readStringField(entry, 'size');
  if (!price || !size) return null;
  return { price, size };
}

export function parseTradingRpcPayload(payload: Json | null | undefined): TradingRpcPayload | null {
  if (!isJsonObject(payload)) return null;
  return payload;
}

export function parseTradingCandles(payload: Json | null | undefined): TradingCandle[] {
  if (!Array.isArray(payload)) return [];
  const candles: TradingCandle[] = [];
  for (const entry of payload) {
    if (!isJsonObject(entry)) continue;
    const time = readNumberField(entry, 'time');
    const open = readStringField(entry, 'open');
    const high = readStringField(entry, 'high');
    const low = readStringField(entry, 'low');
    const close = readStringField(entry, 'close');
    if (time === null || !open || !high || !low || !close) continue;
    const volumeRaw = entry['volume'];
    const volume =
      volumeRaw === null || volumeRaw === undefined
        ? null
        : typeof volumeRaw === 'string'
          ? volumeRaw
          : null;
    candles.push({ time, open, high, low, close, volume });
  }
  return candles;
}

export function parseSyntheticBook(payload: Json | null | undefined): SyntheticBook | null {
  const record = parseTradingRpcPayload(payload);
  if (!record) return null;
  const symbol = readStringField(record, 'symbol');
  const mid = readStringField(record, 'mid');
  const disclosure = readStringField(record, 'disclosure');
  if (!symbol || !mid || !disclosure) return null;
  const asksRaw = record['asks'];
  const bidsRaw = record['bids'];
  const asks = Array.isArray(asksRaw)
    ? asksRaw.flatMap((level) => {
        const parsed = parseSyntheticBookLevel(level);
        return parsed ? [parsed] : [];
      })
    : [];
  const bids = Array.isArray(bidsRaw)
    ? bidsRaw.flatMap((level) => {
        const parsed = parseSyntheticBookLevel(level);
        return parsed ? [parsed] : [];
      })
    : [];
  return { symbol, mid, asks, bids, disclosure };
}

export function parseMarginModeRpcResult(
  payload: Json | null | undefined,
): MarginModeRpcResult | null {
  const record = parseTradingRpcPayload(payload);
  if (!record) return null;
  const userId = readStringField(record, 'user_id');
  const marginMode = readStringField(record, 'margin_mode');
  if (!userId || (marginMode !== 'isolated' && marginMode !== 'cross')) return null;
  return { user_id: userId, margin_mode: marginMode };
}

export function parsePositionModeRpcResult(
  payload: Json | null | undefined,
): PositionModeRpcResult | null {
  const record = parseTradingRpcPayload(payload);
  if (!record) return null;
  const userId = readStringField(record, 'user_id');
  const positionMode = readStringField(record, 'position_mode');
  if (!userId || (positionMode !== 'one_way' && positionMode !== 'hedge')) return null;
  return { user_id: userId, position_mode: positionMode };
}

export function parseOrderCancelRpcResult(
  payload: Json | null | undefined,
): OrderCancelRpcResult | null {
  const record = parseTradingRpcPayload(payload);
  if (!record) return null;
  const orderId = readStringField(record, 'order_id');
  const status = readStringField(record, 'status');
  if (!orderId || !status) return null;
  return { order_id: orderId, status };
}

export function resolveTradingRpcMarket(payload: TradingRpcPayload | null | undefined): string {
  if (!payload) return '';
  return readStringField(payload, 'market') ?? readStringField(payload, 'symbol') ?? '';
}

/** House-priced fill book returned from trade RPCs (distinct from reference display). */
export type RealFillBook = SyntheticBook & { bookKind: 'realFill' };

/** Build a realFill book snapshot from an RPC fill/open result (house-priced · not CLOB). */
export function realFillBookFromRpcResult(
  symbol: string,
  result: TradingRpcPayload | null | undefined,
): RealFillBook | null {
  if (!result) return null;
  const fillPrice = readStringField(result, 'fill_price') ?? readStringField(result, 'entry_price');
  const qty = readStringField(result, 'quantity') ?? readStringField(result, 'filled_quantity');
  if (!fillPrice || !qty) return null;
  return {
    symbol,
    mid: fillPrice,
    asks: [],
    bids: [{ price: fillPrice, size: qty }],
    disclosure: 'house_fill',
    bookKind: 'realFill',
  };
}
