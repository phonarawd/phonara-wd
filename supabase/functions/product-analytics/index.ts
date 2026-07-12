/**
 * product-analytics — public ingress for product_analytics_events.
 * Anon PostgREST EXECUTE revoked (M-04); HMAC(IP) dual-bucket + payload limits in RPC.
 * Optional JWT sub binds user_id; never trust body.user_id.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createEdgeContext, mapSupabaseError } from '../_shared/edge-observability.ts';
import { decodeJwtSub, ingressIpHmac } from '../_shared/service-ingress.ts';

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing_env:${name}`);
  return v;
}

const MAX_BODY_BYTES = 8192;

Deno.serve(async (req) => {
  const ctx = createEdgeContext('product-analytics', req);

  try {
    if (req.method !== 'POST') {
      return ctx.jsonErr('method_not_allowed', 405);
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return ctx.jsonErr('payload_too_large', 413);
    }

    const body = raw.length > 0 ? JSON.parse(raw) : {};
    if (body && typeof body === 'object' && 'user_id' in body) {
      return ctx.jsonErr('analytics_user_id_forbidden', 400);
    }

    const eventName = String(body.event_name ?? '').trim();
    const surface = body.surface == null ? null : String(body.surface);
    const properties =
      body.properties && typeof body.properties === 'object' && !Array.isArray(body.properties)
        ? body.properties
        : {};
    const anonymousId = body.anonymous_id == null ? null : String(body.anonymous_id);
    const clientEventId = body.client_event_id == null ? null : String(body.client_event_id);
    const occurredAt = body.occurred_at == null ? null : String(body.occurred_at);

    if (!eventName) {
      return ctx.jsonErr('invalid_request', 400);
    }

    const ipHmac = await ingressIpHmac(req);
    const userId = decodeJwtSub(req.headers.get('authorization'));

    const service = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });

    const { data, error } = await service.rpc('rpc_service_record_product_analytics_event', {
      p_event_name: eventName,
      p_surface: surface,
      p_properties: properties,
      p_anonymous_id: anonymousId,
      p_client_event_id: clientEventId,
      p_occurred_at: occurredAt,
      p_ip_hmac: ipHmac,
      p_user_id: userId,
    });

    if (error) {
      ctx.logError('analytics.record_failed', mapSupabaseError(error));
      return ctx.jsonErr(mapSupabaseError(error), 400, { internal: error });
    }

    ctx.log('analytics.recorded', { batch_count: 1 });
    return ctx.jsonOk({ ok: true, result: data });
  } catch (err) {
    const code = err instanceof Error ? err.message : 'internal_error';
    if (code.startsWith('missing_env:')) {
      return ctx.jsonErr('misconfigured', 503);
    }
    if (code === 'Unexpected end of JSON input' || code.includes('JSON')) {
      return ctx.jsonErr('invalid_json', 400);
    }
    ctx.logError('analytics.unhandled', String(err));
    return ctx.jsonErr('internal_error', 500);
  }
});
