/**
 * Display-only market feed contract — frozen boundary for trade chart / ticker UI.
 * Never pass these values to settlement, order, or PnL RPCs (ADR-0002 · rule 30/90).
 *
 * Source disclosure (display-only · settlement unaffected):
 * - Spot desk chart + order book + 24h ticker: Binance spot (`api.binance.com` / `stream.binance.com`).
 * - PHON symbols: oracle RPC only — no exchange WS/REST (see `resolveTradeChartFeedStrategy`).
 * - Bybit kline is display fallback when Binance spot is unavailable.
 */
export const DISPLAY_ONLY_FEED = true as const;

/** Spot desk depth + 24h ticker feed — Binance spot (same source family as chart klines). */
export const SPOT_DESK_BOOK_TICKER_FEED_SOURCE = 'binance-spot' as const;

/** Trade chart kline feed primary — Binance spot; Bybit is display fallback only. */
export const TRADE_CHART_KLINE_FEED_PRIMARY = 'binance-spot' as const;

export type DisplayOnlyFeedMeta = {
  readonly displayOnly: typeof DISPLAY_ONLY_FEED;
};

/** Display-only external feed staleness thresholds (ms) — separate from oracle submit gates. */
export { DISPLAY_FEED_STALE_THRESHOLDS_MS } from './display-feed-stale';

/** Oracle RPC candle intervals supported for display fallback (not settlement). */
export const ORACLE_DISPLAY_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

export type OracleDisplayInterval = (typeof ORACLE_DISPLAY_INTERVALS)[number];

export function isOracleDisplayInterval(interval: string): interval is OracleDisplayInterval {
  return (ORACLE_DISPLAY_INTERVALS as readonly string[]).includes(interval);
}

/** Canonical display-only candle (string OHLCV) — chart, oracle RPC, and chart adapters. */
export type TradingChartCandle = {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string | null;
};

/** Numeric kline row from exchange WS/REST before string normalization (display-only). */
export type DisplayKlineCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/** @deprecated Prefer `DisplayKlineCandle` — kept for hook barrel exports. */
export type DisplayCandle = DisplayKlineCandle;

type CandleLike = {
  time: number;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume?: number | string | null;
};

export function toTradingChartCandle(candle: CandleLike): TradingChartCandle {
  return {
    time: candle.time,
    open: String(candle.open),
    high: String(candle.high),
    low: String(candle.low),
    close: String(candle.close),
    volume: candle.volume != null ? String(candle.volume) : null,
  };
}

export function toTradingChartCandles(candles: readonly CandleLike[]): TradingChartCandle[] {
  return candles.map(toTradingChartCandle);
}

/** Display-only 24h ticker wire shape from exchange worker (not settlement). */
export type Ticker24hSnapshot = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
  openInterest: string;
};

function parseWsJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Parse Binance spot kline WS tick — field-guarded (Phase C1 · UNVERIFIED-7). */
export function parseBinanceKlineWsTick(raw: string): DisplayKlineCandle | null {
  const payload = parseWsJson(raw);
  if (!isRecord(payload)) return null;
  const k = payload['k'];
  if (!isRecord(k)) return null;
  const t = readFiniteNumber(k['t']);
  const open = readFiniteNumber(k['o']);
  const high = readFiniteNumber(k['h']);
  const low = readFiniteNumber(k['l']);
  const close = readFiniteNumber(k['c']);
  const volume = readFiniteNumber(k['v']);
  if (
    t === null ||
    open === null ||
    high === null ||
    low === null ||
    close === null ||
    volume === null
  ) {
    return null;
  }
  return {
    time: Math.floor(t / 1000),
    open,
    high,
    low,
    close,
    volume,
  };
}

export type BybitKlineWsParseResult =
  | { kind: 'pong' }
  | { kind: 'tick'; candle: DisplayKlineCandle };

function isBybitPongRecord(payload: Record<string, unknown>): boolean {
  if (payload['op'] === 'pong') return true;
  return payload['ret_msg'] === 'pong';
}

/** Parse Bybit spot kline WS message — pong or field-guarded tick (Phase C1). */
export function parseBybitKlineWsMessage(raw: string): BybitKlineWsParseResult | null {
  const payload = parseWsJson(raw);
  if (!isRecord(payload)) return null;
  if (isBybitPongRecord(payload)) return { kind: 'pong' };
  const topic = payload['topic'];
  if (typeof topic !== 'string' || !topic.startsWith('kline.')) return null;
  const data = payload['data'];
  if (!Array.isArray(data) || data.length === 0) return null;
  const k = data[0];
  if (!isRecord(k)) return null;
  const start = readFiniteNumber(k['start']);
  const open = readFiniteNumber(k['open']);
  const high = readFiniteNumber(k['high']);
  const low = readFiniteNumber(k['low']);
  const close = readFiniteNumber(k['close']);
  const volume = readFiniteNumber(k['volume']);
  if (
    start === null ||
    open === null ||
    high === null ||
    low === null ||
    close === null ||
    volume === null
  ) {
    return null;
  }
  return {
    kind: 'tick',
    candle: {
      time: Math.floor(start / 1000),
      open,
      high,
      low,
      close,
      volume,
    },
  };
}
