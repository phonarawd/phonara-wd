import { createClient } from 'jsr:@supabase/supabase-js@2';

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

const jsonHeaders = { 'content-type': 'application/json' };

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

function serviceBearerFrom(request: Request): string | Response {
  const authorization = request.headers.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const token = match[1];
  const [, payload] = token.split('.');
  const claims = payload ? decodeBase64UrlJson(payload) : null;

  if (claims?.['role'] !== 'service_role') {
    return new Response(JSON.stringify({ ok: false, error: 'service_role_required' }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  return token;
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

Deno.serve(async (request) => {
  try {
    const serviceBearer = serviceBearerFrom(request);
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
      return new Response(
        JSON.stringify({ ok: false, error: 'source_query_failed', detail: sourceError.message }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const tasks = (sources ?? []).map(async (source: MarketSource): Promise<FeedResult> => {
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

      try {
        const price = await fetchers[provider](source.provider_symbol);
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
            reason: error.message,
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
          reason: error instanceof Error ? error.message : 'unknown_error',
        };
      }
    });

    const settled = await Promise.allSettled(tasks);
    const results: FeedResult[] = settled.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            internalSymbol: 'unknown',
            provider: 'unknown',
            providerSymbol: 'unknown',
            ok: false,
            reason: result.reason instanceof Error ? result.reason.message : 'unknown_error',
          },
    );

    const submitted = results.filter((result) => result.ok).length;
    const insufficientSources = results.filter((result) => {
      if (!result.ok || !result.rpcResult || typeof result.rpcResult !== 'object') {
        return false;
      }

      const rpcResult = result.rpcResult as Record<string, unknown>;
      return rpcResult['reason'] === 'insufficient_sources';
    }).length;

    return new Response(
      JSON.stringify({
        ok: true,
        attempted: results.length,
        submitted,
        failed: results.length - submitted,
        insufficientSources,
        results,
      }),
      { headers: jsonHeaders },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'unknown_error',
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
