/**
 * market-data-proxy — public, display-only passthrough for exchange REST
 * market data (Binance/Bybit klines · Binance depth · Binance 24h ticker).
 *
 * Why this exists: browsers calling api.binance.com/api.bybit.com directly
 * are blocked by CORS or regional network policy for some visitors, which
 * leaves the /trade chart and order book empty (ZA-12). This function
 * fetches the same upstream REST endpoint server-side and returns the raw
 * JSON body unmodified, so client parsing code stays unchanged.
 *
 * Boundary: display-only. No DB/RPC access, no service-role key, never used
 * for settlement/oracle pricing — that remains `price-feed` (writes via
 * `rpc_submit_oracle_source_price`) and `rpc_get_candles`. WebSocket streams
 * (kline/depth/ticker) are NOT proxied here — CORS does not apply to the WS
 * handshake, only to the REST calls this function replaces.
 */
import { CORS_HEADERS, handleCorsPreflight } from '../_shared/cors.ts';
import { createEdgeContext } from '../_shared/edge-observability.ts';

type Provider = 'binance' | 'bybit';
type Op = 'klines' | 'depth' | 'ticker24h';
type KlineInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

const REQUEST_TIMEOUT_MS = 4_000;
const SYMBOL_PATTERN = /^[A-Z0-9]{3,20}$/;
const KLINE_INTERVALS = new Set<string>(['1m', '5m', '15m', '1h', '4h', '1d', '1w']);

const KLINES_LIMIT = 120;
const DEPTH_LIMIT = 1000;

// Short-TTL cache — rate-limit protection + faster repeat renders, never a
// correctness dependency. Deno Edge instances recycle frequently, so this
// in-process Map is best-effort only (not guaranteed shared across
// invocations/instances). A cache miss just costs one extra upstream
// round-trip; it never changes the response contract (fail-open).
const CACHE_TTL_MS: Record<Op, number> = {
  klines: 8_000,
  depth: 1_500,
  ticker24h: 1_500,
};

type CacheEntry = { body: string; contentType: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function bybitInterval(interval: KlineInterval): string {
  const map: Record<KlineInterval, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W',
  };
  return map[interval];
}

function isProvider(value: string | null): value is Provider {
  return value === 'binance' || value === 'bybit';
}

function isOp(value: string | null): value is Op {
  return value === 'klines' || value === 'depth' || value === 'ticker24h';
}

function isInterval(value: string | null): value is KlineInterval {
  return value != null && KLINE_INTERVALS.has(value);
}

function buildUpstreamUrl(params: {
  provider: Provider;
  op: Op;
  symbol: string;
  interval: KlineInterval | null;
}): string {
  const { provider, op, symbol, interval } = params;

  if (op === 'klines') {
    if (!interval) throw new Error('missing_interval');
    if (provider === 'binance') {
      return `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${KLINES_LIMIT}`;
    }
    return `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${bybitInterval(interval)}&limit=${KLINES_LIMIT}`;
  }

  // depth/ticker24h are Binance-only in the current client wiring (spot desk
  // depth + 24h ticker come from Binance — see display-feed-contract.ts).
  if (provider !== 'binance') {
    throw new Error('unsupported_provider_op');
  }
  if (op === 'depth') {
    return `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${DEPTH_LIMIT}`;
  }
  return `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
}

async function fetchUpstream(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function passthroughHeaders(contentType: string, cacheTtlMs: number, requestId: string) {
  return {
    'content-type': contentType,
    'cache-control': `public, max-age=${Math.max(1, Math.ceil(cacheTtlMs / 1000))}`,
    'x-request-id': requestId,
    ...CORS_HEADERS,
  };
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const ctx = createEdgeContext('market-data-proxy', req);

  if (req.method !== 'GET') {
    return ctx.jsonErr('method_not_allowed', 405);
  }

  const url = new URL(req.url);
  const providerParam = url.searchParams.get('provider');
  const opParam = url.searchParams.get('op');
  const symbolParam = (url.searchParams.get('symbol') ?? '').trim().toUpperCase();
  const intervalParam = url.searchParams.get('interval');

  if (!isProvider(providerParam) || !isOp(opParam) || !SYMBOL_PATTERN.test(symbolParam)) {
    return ctx.jsonErr('invalid_request', 400);
  }
  if (opParam === 'klines' && !isInterval(intervalParam)) {
    return ctx.jsonErr('invalid_request', 400);
  }

  const cacheKey = `${providerParam}:${opParam}:${symbolParam}:${intervalParam ?? ''}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return new Response(cached.body, {
      status: 200,
      headers: passthroughHeaders(cached.contentType, cached.expiresAt - now, ctx.requestId),
    });
  }

  let upstreamUrl: string;
  try {
    upstreamUrl = buildUpstreamUrl({
      provider: providerParam,
      op: opParam,
      symbol: symbolParam,
      interval: opParam === 'klines' ? (intervalParam as KlineInterval) : null,
    });
  } catch (error) {
    ctx.logError('ops.market_data_proxy.invalid_request', 'invalid_request', {
      provider: providerParam,
      op: opParam,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return ctx.jsonErr('invalid_request', 400);
  }

  try {
    const upstream = await fetchUpstream(upstreamUrl);
    if (!upstream.ok) {
      ctx.logError('ops.market_data_proxy.upstream_error', `http_${upstream.status}`, {
        provider: providerParam,
        op: opParam,
      });
      return ctx.jsonErr('upstream_unavailable', 502);
    }

    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    const ttlMs = CACHE_TTL_MS[opParam];
    cache.set(cacheKey, { body, contentType, expiresAt: now + ttlMs });

    ctx.log('ops.market_data_proxy.served', { provider: providerParam, op: opParam });
    return new Response(body, {
      status: 200,
      headers: passthroughHeaders(contentType, ttlMs, ctx.requestId),
    });
  } catch (error) {
    ctx.logError(
      'ops.market_data_proxy.failed',
      error instanceof Error && error.name === 'AbortError' ? 'upstream_timeout' : 'unknown_error',
      { provider: providerParam, op: opParam },
    );
    return ctx.jsonErr('upstream_timeout', 504);
  }
});
