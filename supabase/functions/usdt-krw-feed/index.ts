import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  createEdgeContext,
  mapSupabaseError,
  recordEdgeOpsEvent,
  recordProviderHealth,
  toStableErrorCode,
} from '../_shared/edge-observability.ts';

import { parseUpbitTradePriceFromJson } from '../_shared/upbit-rate-parse.ts';

import { authorizeServiceRole, env } from '../_shared/service-auth.ts';

async function fetchUpbitUsdtKrw(): Promise<string> {
  const res = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-USDT', {
    headers: { accept: 'application/json' },
  });

  if (!res.ok) throw new Error(`upbit_${res.status}`);

  const text = await res.text();

  return parseUpbitTradePriceFromJson(text);
}

Deno.serve(async (req) => {
  const ctx = createEdgeContext('usdt-krw-feed', req);

  try {
    const auth = await authorizeServiceRole(req);

    if (typeof auth !== 'string') return auth;

    const supabase = createClient(env('SUPABASE_URL'), auth, {
      auth: { persistSession: false },
    });

    let rate: string;

    try {
      rate = await fetchUpbitUsdtKrw();

      await recordProviderHealth(supabase, ctx, {
        provider: 'upbit',

        domain: 'fx_rate',

        channel: 'KRW-USDT',

        status: 'healthy',
      });
    } catch (e) {
      const errorCode = toStableErrorCode(e, 'upbit_unavailable');

      await recordProviderHealth(supabase, ctx, {
        provider: 'upbit',

        domain: 'fx_rate',

        channel: 'KRW-USDT',

        status: 'unavailable',

        errorCode,
      });

      ctx.logError('ops.fx.usdt_krw.fetch_failed', errorCode);

      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.fx.usdt_krw_failed',

        status: 'error',

        errorCode,
      });

      return ctx.jsonErr(errorCode, 502, { internal: e });
    }

    const { data, error } = await supabase.rpc('rpc_service_ingest_usdt_krw_rate', {
      p_rate: rate,

      p_source: 'upbit',
    });

    if (error) {
      ctx.logError('ops.fx.usdt_krw.ingest_failed', mapSupabaseError(error));

      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.fx.usdt_krw_failed',

        status: 'error',

        errorCode: mapSupabaseError(error),
      });

      return ctx.jsonErr(mapSupabaseError(error), 500, { internal: error });
    }

    ctx.log('ops.fx.usdt_krw.completed', { batch_count: 1 });

    await recordEdgeOpsEvent(supabase, ctx, {
      eventKey: 'ops.fx.usdt_krw_completed',

      status: 'ok',

      batchCount: 1,
    });

    return ctx.jsonOk({ ok: true, rate, data });
  } catch (e) {
    ctx.logError('ops.fx.usdt_krw.failed', 'internal_error', { internal: e });

    return ctx.jsonErr('internal_error', 500, { internal: e });
  }
});
