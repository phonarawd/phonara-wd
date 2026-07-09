import { createClient } from 'jsr:@supabase/supabase-js@2';
import { parsePgBankIngestBody } from '../_shared/pg-bank-transfer.ts';
import { authorizePgBankIngest } from '../_shared/pg-webhook-auth.ts';
import {
  createEdgeContext,
  mapSupabaseError,
  recordEdgeOpsEvent,
  toStableErrorCode,
} from '../_shared/edge-observability.ts';
import { env } from '../_shared/service-auth.ts';

async function readRawBody(req: Request): Promise<string> {
  return await req.text();
}

Deno.serve(async (req) => {
  const ctx = createEdgeContext('pg-bank-webhook', req);

  if (req.method === 'GET') {
    const auth = await authorizePgBankIngest(req);
    if (auth instanceof Response) return auth;
    ctx.log('ops.webhook.pg_bank.health_ok');
    return ctx.jsonOk({ ok: true, service: 'pg-bank-webhook', auth: auth.mode });
  }

  if (req.method !== 'POST') {
    return ctx.jsonErr('method_not_allowed', 405);
  }

  try {
    const rawBody = await readRawBody(req);
    const auth = await authorizePgBankIngest(req, rawBody);
    if (auth instanceof Response) return auth;

    let body: unknown;
    try {
      body = rawBody.length > 0 ? JSON.parse(rawBody) : null;
    } catch {
      return ctx.jsonErr('invalid_json', 400);
    }

    const parsed = parsePgBankIngestBody(body);
    if ('error' in parsed) {
      return ctx.jsonErr(toStableErrorCode(parsed.error, 'invalid_body'), 400);
    }

    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });

    if (auth.mode !== 'service_role') {
      const { data: replay, error: replayErr } = await supabase.rpc(
        'rpc_service_register_pg_webhook_replay',
        {
          p_replay_key: auth.replayKey,
          p_timestamp_unix: auth.timestampUnix ?? Math.floor(Date.now() / 1000),
          p_signature_digest: auth.signatureDigest ?? auth.mode,
          p_request_hash: auth.requestHash,
          p_canonical_body_hash: auth.canonicalBodyHash,
          p_provider: 'pg_bank',
        },
      );

      if (replayErr) {
        ctx.logError('ops.webhook.pg_bank.replay_failed', mapSupabaseError(replayErr));
        await recordEdgeOpsEvent(supabase, ctx, {
          eventKey: 'ops.webhook.pg_bank_ingest_failed',
          status: 'error',
          errorCode: mapSupabaseError(replayErr),
        });
        return ctx.jsonErr(mapSupabaseError(replayErr), 500, { internal: replayErr });
      }

      const replayObj = replay as { ok?: boolean; duplicate?: boolean; conflict?: boolean };
      if (replayObj?.conflict) {
        return ctx.jsonErr('replay_body_mismatch', 409);
      }
      if (replayObj?.duplicate) {
        ctx.log('ops.webhook.pg_bank.duplicate_ignored', { batch_count: 0, skipped_count: 1 });
        await recordEdgeOpsEvent(supabase, ctx, {
          eventKey: 'ops.webhook.pg_bank_duplicate',
          status: 'ok',
          skippedCount: 1,
        });
        return ctx.jsonOk({
          ok: true,
          auth: auth.mode,
          ingest: parsed.source,
          duplicate: true,
        });
      }
    }

    const { data, error } = await supabase.rpc('rpc_process_bank_transfer_batch', {
      p_items: parsed.items,
      p_source: parsed.source,
    });

    if (error) {
      ctx.logError('ops.webhook.pg_bank.ingest_failed', mapSupabaseError(error));
      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.webhook.pg_bank_ingest_failed',
        status: 'error',
        batchCount: parsed.items.length,
        errorCode: mapSupabaseError(error),
      });
      return ctx.jsonErr(mapSupabaseError(error), 500, { internal: error });
    }

    ctx.log('ops.webhook.pg_bank.ingest_completed', {
      batch_count: parsed.items.length,
    });

    await recordEdgeOpsEvent(supabase, ctx, {
      eventKey: 'ops.webhook.pg_bank_ingest_completed',
      status: 'ok',
      batchCount: parsed.items.length,
    });

    const ingestPayload =
      typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : { data };

    return ctx.jsonOk({
      ok: true,
      auth: auth.mode,
      ingest: parsed.source,
      ...ingestPayload,
    });
  } catch (e) {
    ctx.logError('ops.webhook.pg_bank.failed', 'internal_error', { internal: e });
    return ctx.jsonErr('internal_error', 500, { internal: e });
  }
});
