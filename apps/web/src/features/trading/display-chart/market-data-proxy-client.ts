import { env } from '@/lib/env';

/**
 * Display-only exchange REST client for the `market-data-proxy` Edge
 * Function. Browsers calling api.binance.com/api.bybit.com directly are
 * blocked by CORS or regional network policy for some visitors, which
 * leaves `/trade` chart + order book empty (ZA-12) — this routes the same
 * REST calls (klines history, depth snapshot, 24h ticker) through Supabase
 * so they always resolve through an allowed origin.
 *
 * WebSocket streams are NOT routed here — CORS does not gate the WS
 * handshake, only these REST endpoints. See `market-data.worker.ts` /
 * `use-display-kline.ts` for the WS connections, which stay direct.
 *
 * Response bodies are passed through unmodified by the Edge Function, so
 * callers keep parsing the exact upstream shape (Binance/Bybit JSON) —
 * only the URL/headers change.
 */

export type MarketDataProxyProvider = 'binance' | 'bybit';
export type MarketDataProxyOp = 'klines' | 'depth' | 'ticker24h';

/** Same interval vocabulary as `DisplayKlineInterval` — the proxy maps per-provider server-side. */
export type MarketDataProxyKlineInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

function proxyUrl(params: {
  provider: MarketDataProxyProvider;
  op: MarketDataProxyOp;
  symbol: string;
  interval?: MarketDataProxyKlineInterval;
}): string {
  const search = new URLSearchParams({
    provider: params.provider,
    op: params.op,
    symbol: params.symbol.toUpperCase(),
  });
  if (params.interval) {
    search.set('interval', params.interval);
  }
  return `${env.VITE_SUPABASE_URL}/functions/v1/market-data-proxy?${search.toString()}`;
}

/**
 * Fetch a display-only exchange REST payload through the Supabase proxy.
 * Returns the raw `Response` — callers keep their existing
 * `!res.ok` / `res.json()` handling unchanged.
 */
export function fetchMarketDataProxy(params: {
  provider: MarketDataProxyProvider;
  op: MarketDataProxyOp;
  symbol: string;
  interval?: MarketDataProxyKlineInterval;
}): Promise<Response> {
  return fetch(proxyUrl(params), {
    headers: {
      accept: 'application/json',
      apikey: env.VITE_SUPABASE_ANON_KEY,
      authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
    },
  });
}
