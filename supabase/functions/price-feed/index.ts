import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  createEdgeContext,
  mapSupabaseError,
  recordEdgeOpsEvent,
  recordProviderHealth,
  assessCircuitBreaker,
  recordCircuitBreakerOutcome,
  classifyEdgeOpsOutcome,
  toStableErrorCode,
  type CircuitBreakerGate,
} from '../_shared/edge-observability.ts';

type Provider = 'binance' | 'bybit' | 'okx';

interface MarketSource {
  internal_symbol: string;
  provider: string;
  provider_symbol: string;
}

interface FeedResult {
  internalSymbol: string;
  provider: string;
  providerSymbol: string;
  ok: boolean;
  reason?: string;
  rpcResult?: unknown;
}

const PRICE_PATTERN = /^\d+(\.\d+)?$/;
const ZERO_PATTERN = /^0+(\.0+)?$/;
const REQUEST_TIMEOUT_MS = 4_000;

// Provider resilience budget. The feed runs once per minute over every enabled
// market source; many sources share a single upstream provider, so an outage
// must not turn into an unbounded fan-out of failing requests.
const MAX_CONCURRENCY = 4;
const MAX_RETRIES = 2; // total attempts per fetch = 1 + MAX_RETRIES
const RETRY_BASE_MS = 200;

const jsonHeaders = { 'content-type': 'application/json' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`missing_env:${name}`);
  }
  return value;
}

function decodeBase64UrlJson(segment: string): Record<string, unknown> | null {
  try {
    const base64 = segment.replaceAll('-', '+').replaceAll('_', '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function sha256(text: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest);
}

// Constant-time comparison over fixed-length SHA-256 digests: no early return and
// no length-dependent branch, so it leaks neither token contents nor length.
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

async function tokenMatchesSecret(token: string, secret: string): Promise<boolean> {
  const [tokenHash, secretHash] = await Promise.all([sha256(token), sha256(secret)]);
  return constantTimeEqual(tokenHash, secretHash);
}

// Authorization is layered. The platform gateway enforces verify_jwt=true, so by
// the time a request reaches this code its bearer is already a signature-verified
// project JWT. On top of that we require proof of the actual service-role secret:
// the scheduler invokes with the service-role key, so a constant-time match is the
// strongest check. We fall back to the signature-verified service_role claim so a
// rotated-but-valid service token still works while signed end-user tokens cannot.
async function authorize(request: Request): Promise<string | Response> {
  const authorization = request.headers.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  }

  const token = match[1].trim();

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (serviceKey && (await tokenMatchesSecret(token, serviceKey))) {
    return token;
  }

  const [, payload] = token.split('.');
  const claims = payload ? decodeBase64UrlJson(payload) : null;
  if (claims?.['role'] === 'service_role') {
    return token;
  }

  return jsonResponse({ ok: false, error: 'service_role_required' }, 403);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Bounded retry with exponential backoff. Caps total upstream work per source so a
// flapping provider cannot stretch a single invocation past the cron interval.
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  baseDelayMs: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('retry_exhausted');
}

// Fixed-size worker pool: at most `limit` upstream fetches are in flight at once,
// regardless of how many market sources are enabled. The worker resolves with a
// FeedResult for every item (never rejects), so the pool always settles cleanly.
async function runPool<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function runner(): Promise<void> {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runner());
  await Promise.all(runners);
  return results;
}

function normalizePrice(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const value = raw.trim();
  if (!PRICE_PATTERN.test(value) || ZERO_PATTERN.test(value)) {
    return null;
  }

  return value;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`http_${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function objectAt(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return (value as Record<string, unknown>)[key];
}

function arrayFirst(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : undefined;
}

async function fetchBinancePrice(providerSymbol: string): Promise<string> {
  const symbol = encodeURIComponent(providerSymbol);
  const payload = await fetchJson(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
  const price = normalizePrice(objectAt(payload, 'price'));

  if (!price) {
    throw new Error('invalid_binance_price');
  }

  return price;
}

async function fetchBybitPrice(providerSymbol: string): Promise<string> {
  const symbol = encodeURIComponent(providerSymbol);
  const payload = await fetchJson(
    `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`,
  );
  const result = objectAt(payload, 'result');
  const firstTicker = arrayFirst(objectAt(result, 'list'));
  const price = normalizePrice(objectAt(firstTicker, 'lastPrice'));

  if (!price) {
    throw new Error('invalid_bybit_price');
  }

  return price;
}

async function fetchOkxPrice(providerSymbol: string): Promise<string> {
  const instId = encodeURIComponent(providerSymbol);
  const payload = await fetchJson(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`);
  const firstTicker = arrayFirst(objectAt(payload, 'data'));
  const price = normalizePrice(objectAt(firstTicker, 'last'));

  if (!price) {
    throw new Error('invalid_okx_price');
  }

  return price;
}

const fetchers: Record<Provider, (providerSymbol: string) => Promise<string>> = {
  binance: fetchBinancePrice,
  bybit: fetchBybitPrice,
  okx: fetchOkxPrice,
};

function isProvider(value: string): value is Provider {
  return value === 'binance' || value === 'bybit' || value === 'okx';
}

interface BreakerState {
  gate: CircuitBreakerGate;
}

Deno.serve(async (request) => {
  const ctx = createEdgeContext('price-feed', request);

  try {
    const serviceBearer = await authorize(request);
    if (typeof serviceBearer !== 'string') {
      return serviceBearer;
    }

    const supabase = createClient(env('SUPABASE_URL'), serviceBearer, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: sources, error: sourceError } = await supabase
      .from('market_sources')
      .select('internal_symbol, provider, provider_symbol')
      .eq('enabled', true);

    if (sourceError) {
      ctx.logError('ops.price_feed.source_query_failed', mapSupabaseError(sourceError));
      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.price_feed.failed',
        status: 'error',
        errorCode: mapSupabaseError(sourceError),
      });
      return ctx.jsonErr('source_query_failed', 500, { internal: sourceError });
    }

    // Per-provider DB circuit breaker gate (memoized per invocation).
    const breakers = new Map<Provider, BreakerState>();
    const breakerFor = async (provider: Provider): Promise<CircuitBreakerGate> => {
      const existing = breakers.get(provider);
      if (existing) return existing.gate;
      const gate = await assessCircuitBreaker(supabase, provider, 'price_feed', '');
      breakers.set(provider, { gate });
      return gate;
    };

    const processSource = async (source: MarketSource): Promise<FeedResult> => {
      const provider = source.provider.toLowerCase();

      if (!isProvider(provider)) {
        return {
          internalSymbol: source.internal_symbol,
          provider: source.provider,
          providerSymbol: source.provider_symbol,
          ok: false,
          reason: 'unknown_provider',
        };
      }

      const gate = await breakerFor(provider);
      if (!gate.allowed) {
        return {
          internalSymbol: source.internal_symbol,
          provider,
          providerSymbol: source.provider_symbol,
          ok: false,
          reason: 'circuit_open',
        };
      }

      let price: string;
      try {
        price = await withRetry(
          () => fetchers[provider](source.provider_symbol),
          MAX_RETRIES,
          RETRY_BASE_MS,
        );
        await recordCircuitBreakerOutcome(supabase, ctx, {
          provider,
          domain: 'price_feed',
          success: true,
        });
        const cached = breakers.get(provider);
        if (cached) cached.gate = { allowed: true, state: 'closed' };
      } catch (error) {
        const reason = toStableErrorCode(error, 'unknown_error');
        await recordCircuitBreakerOutcome(supabase, ctx, {
          provider,
          domain: 'price_feed',
          success: false,
          errorCode: reason,
        });
        const refreshed = await assessCircuitBreaker(supabase, provider, 'price_feed', '');
        const cached = breakers.get(provider);
        if (cached) cached.gate = refreshed;
        return {
          internalSymbol: source.internal_symbol,
          provider,
          providerSymbol: source.provider_symbol,
          ok: false,
          reason,
        };
      }

      // RPC failures are submission-side, not provider health, so they do not
      // trip the breaker. Kept isolated so one source can never reject the pool.
      try {
        const { data, error } = await supabase.rpc('rpc_submit_oracle_source_price', {
          p_symbol: source.internal_symbol,
          p_price: price,
          p_source_name: provider,
        });

        if (error) {
          return {
            internalSymbol: source.internal_symbol,
            provider,
            providerSymbol: source.provider_symbol,
            ok: false,
            reason: mapSupabaseError(error),
          };
        }

        return {
          internalSymbol: source.internal_symbol,
          provider,
          providerSymbol: source.provider_symbol,
          ok: true,
          rpcResult: data,
        };
      } catch (error) {
        return {
          internalSymbol: source.internal_symbol,
          provider,
          providerSymbol: source.provider_symbol,
          ok: false,
          reason: toStableErrorCode(error, 'unknown_error'),
        };
      }
    };

    const results = await runPool(sources ?? [], MAX_CONCURRENCY, processSource);

    // H-04: separate applied / rejected / circuit-open / rpc-failed — never ok on partial.
    let applied = 0;
    let rejected = 0;
    let circuitOpen = 0;
    let rpcFailed = 0;
    let insufficientSources = 0;

    for (const result of results) {
      if (result.reason === 'circuit_open') {
        circuitOpen += 1;
        continue;
      }
      if (!result.ok) {
        if (
          result.reason === 'rpc_failed' ||
          result.reason === 'duplicate' ||
          (result.reason?.includes('rpc') ?? false)
        ) {
          rpcFailed += 1;
        } else {
          rejected += 1;
        }
        continue;
      }
      if (result.rpcResult && typeof result.rpcResult === 'object') {
        const rpcResult = result.rpcResult as Record<string, unknown>;
        if (rpcResult['reason'] === 'insufficient_sources') {
          insufficientSources += 1;
          rejected += 1;
          continue;
        }
        if (
          rpcResult['circuit_breaker_triggered'] === true ||
          rpcResult['market_halted'] === true
        ) {
          // Source stored / feed attempted but settlement rejected by circuit — count as rejected.
          rejected += 1;
          continue;
        }
      }
      applied += 1;
    }

    const outcome = classifyEdgeOpsOutcome({
      applied,
      rejected,
      circuitOpen,
      rpcFailed,
      total: results.length,
    });

    const providerStats = new Map<string, { ok: number; fail: number; circuit: boolean }>();
    for (const result of results) {
      if (!isProvider(result.provider)) continue;
      const stats = providerStats.get(result.provider) ?? { ok: 0, fail: 0, circuit: false };
      if (result.ok && result.reason !== 'circuit_open') {
        const rpcResult =
          result.rpcResult && typeof result.rpcResult === 'object'
            ? (result.rpcResult as Record<string, unknown>)
            : null;
        if (
          rpcResult?.['reason'] === 'insufficient_sources' ||
          rpcResult?.['circuit_breaker_triggered'] === true ||
          rpcResult?.['market_halted'] === true
        ) {
          stats.fail += 1;
        } else {
          stats.ok += 1;
        }
      } else {
        stats.fail += 1;
      }
      if (result.reason === 'circuit_open') stats.circuit = true;
      providerStats.set(result.provider, stats);
    }

    for (const [provider, stats] of providerStats) {
      const breaker = breakers.get(provider as Provider);
      let status: 'healthy' | 'degraded' | 'unavailable' = 'healthy';
      if (breaker?.gate.state === 'open' || (stats.fail > 0 && stats.ok === 0))
        status = 'unavailable';
      else if (stats.fail > 0) status = 'degraded';

      await recordProviderHealth(supabase, ctx, {
        provider,
        domain: 'price_feed',
        status,
        errorCode: status === 'healthy' ? null : stats.circuit ? 'circuit_open' : 'fetch_failures',
        metadata: {
          ok: stats.ok,
          fail: stats.fail,
          circuitOpen: stats.circuit,
          breakerState: breaker?.gate.state ?? 'closed',
        },
      });
    }

    ctx.log('ops.price_feed.completed', {
      batch_count: results.length,
      skipped_count: circuitOpen,
      outcome_status: outcome.status,
      applied,
      rejected,
      circuit_open: circuitOpen,
      rpc_failed: rpcFailed,
    });

    await recordEdgeOpsEvent(supabase, ctx, {
      eventKey: 'ops.price_feed.completed',
      status: outcome.status,
      batchCount: results.length,
      skippedCount: circuitOpen,
      errorCode: outcome.errorCode,
      metadata: {
        applied,
        rejected,
        circuitOpen,
        rpcFailed,
        insufficientSources,
      },
    });

    // Provider outcome in body — HTTP 2xx alone must not be treated as success (ADR-021).
    return ctx.jsonOk({
      ok: outcome.status === 'ok',
      outcome: outcome.status,
      attempted: results.length,
      applied,
      rejected,
      circuitOpen,
      rpcFailed,
      insufficientSources,
    });
  } catch (error) {
    ctx.logError('ops.price_feed.failed', toStableErrorCode(error, 'internal_error'), {
      internal: error,
    });
    return ctx.jsonErr(toStableErrorCode(error, 'internal_error'), 500, { internal: error });
  }
});
