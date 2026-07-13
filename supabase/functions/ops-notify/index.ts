import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  createEdgeContext,
  mapSupabaseError,
  recordEdgeOpsEvent,
  recordProviderHealth,
} from '../_shared/edge-observability.ts';
import {
  dispatchOpsTelegramAlert,
  type OpsTelegramDispatchPayload,
} from '../_shared/ops-telegram-dispatch.ts';
import {
  dispatchOpsWebPushAlert,
  loadAdminOpsPushSubscriptions,
} from '../_shared/ops-web-push-dispatch.ts';
import { authorizeServiceRole, env } from '../_shared/service-auth.ts';

const WORKER_ID = 'ops-notify';

interface ClaimedOpsNotify {
  id: string;
  alert_id: string | null;
  notify_kind: string;
  severity: string;
  payload: Record<string, unknown>;
  attempts: number;
  provider_idempotency_key: string;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function registerOutboundReplay(
  supabase: ReturnType<typeof createClient>,
  idempotencyKey: string,
  body: string,
): Promise<{ duplicate?: boolean; conflict?: boolean; error?: string }> {
  const canonicalBodyHash = await sha256Hex(body);
  const requestHash = await sha256Hex(`POST\n${body}`);
  const ts = Math.floor(Date.now() / 1000);

  const { data, error } = await supabase.rpc('rpc_service_register_pg_webhook_replay', {
    p_replay_key: idempotencyKey,
    p_timestamp_unix: ts,
    p_signature_digest: 'ops_telegram_outbound',
    p_request_hash: requestHash,
    p_canonical_body_hash: canonicalBodyHash,
    p_provider: 'ops_telegram',
  });

  if (error) return { error: mapSupabaseError(error) };

  const replay = data as { duplicate?: boolean; conflict?: boolean };
  return { duplicate: replay.duplicate, conflict: replay.conflict };
}

Deno.serve(async (req) => {
  const ctx = createEdgeContext('ops-notify', req);

  try {
    const auth = await authorizeServiceRole(req);
    if (typeof auth !== 'string') return auth;

    const supabase = createClient(env('SUPABASE_URL'), auth, {
      auth: { persistSession: false },
    });

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 50);
    const digestMode = url.searchParams.get('digest') === 'critical';

    if (digestMode) {
      const { data: digestData, error: digestErr } = await supabase.rpc(
        'rpc_service_enqueue_ops_telegram_digest',
        {},
      );
      if (digestErr) {
        ctx.logError('ops.telegram.digest_enqueue_failed', mapSupabaseError(digestErr));
        return ctx.jsonErr(mapSupabaseError(digestErr), 500, { internal: digestErr });
      }
      ctx.log('ops.telegram.digest_enqueued', { metadata: digestData });
    }

    const { data: claimData, error: claimErr } = await supabase.rpc(
      'rpc_service_claim_ops_notify_batch',
      {
        p_worker_id: WORKER_ID,
        p_batch_size: limit,
        p_claim_ttl_seconds: 300,
      },
    );
    if (claimErr) {
      ctx.logError('ops.telegram.claim_failed', mapSupabaseError(claimErr));
      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.telegram.dispatch_failed',
        status: 'error',
        errorCode: mapSupabaseError(claimErr),
      });
      return ctx.jsonErr(mapSupabaseError(claimErr), 500, { internal: claimErr });
    }

    const claim = claimData as { items?: ClaimedOpsNotify[]; claimed?: number };
    const rows = claim.items ?? [];

    const sent: string[] = [];
    const failed: string[] = [];
    const manual: string[] = [];
    let providerOk = 0;
    let providerFail = 0;
    let missingConfig = 0;
    let webPushSent = 0;
    let webPushFail = 0;

    const adminPush = await loadAdminOpsPushSubscriptions(supabase);

    for (const row of rows) {
      const idempotencyKey =
        row.provider_idempotency_key ?? `ops_notify:${row.id}:${row.attempts ?? 0}`;
      const payload = (row.payload ?? {}) as OpsTelegramDispatchPayload;
      const body = JSON.stringify({
        event_type: 'ops_alert',
        notify_kind: row.notify_kind,
        severity: row.severity,
        payload,
        idempotency_key: idempotencyKey,
      });

      const replay = await registerOutboundReplay(supabase, idempotencyKey, body);
      if (replay.error) {
        failed.push(row.id);
        await supabase.rpc('rpc_service_complete_ops_notify', {
          p_notify_id: row.id,
          p_worker_id: WORKER_ID,
          p_outcome: 'retryable_failed',
          p_error_code: replay.error,
          p_provider_attempted: false,
        });
        continue;
      }

      if (replay.conflict) {
        failed.push(row.id);
        await supabase.rpc('rpc_service_complete_ops_notify', {
          p_notify_id: row.id,
          p_worker_id: WORKER_ID,
          p_outcome: 'manual_review',
          p_error_code: 'replay_body_mismatch',
          p_provider_attempted: false,
        });
        manual.push(row.id);
        continue;
      }

      if (replay.duplicate) {
        await supabase.rpc('rpc_service_complete_ops_notify', {
          p_notify_id: row.id,
          p_worker_id: WORKER_ID,
          p_outcome: 'sent',
          p_error_code: null,
          p_provider_attempted: false,
        });
        sent.push(row.id);
        continue;
      }

      const result = await dispatchOpsTelegramAlert(payload, idempotencyKey);

      if (result.ok) providerOk += 1;
      else if (result.providerAttempted === false) missingConfig += 1;
      else providerFail += 1;

      // Best-effort operator Web Push (Gap A-4) — does not fail pager outcome.
      if (adminPush.subscriptions.length > 0) {
        const pushResult = await dispatchOpsWebPushAlert(
          payload,
          adminPush.subscriptions,
          `${idempotencyKey}:web_push`,
        );
        if (pushResult.ok && (pushResult.sent ?? 0) > 0) webPushSent += pushResult.sent ?? 0;
        else if (pushResult.providerAttempted) webPushFail += 1;
      }

      let outcome: 'sent' | 'retryable_failed' | 'failed' | 'manual_review';
      if (result.ok) {
        outcome = 'sent';
      } else if (
        result.error === 'pager_not_configured' ||
        result.error === 'telegram_not_configured'
      ) {
        outcome = 'retryable_failed';
      } else {
        outcome = 'retryable_failed';
      }

      const { error: completeErr } = await supabase.rpc('rpc_service_complete_ops_notify', {
        p_notify_id: row.id,
        p_worker_id: WORKER_ID,
        p_outcome: outcome,
        p_error_code: result.error ?? null,
        p_provider_attempted: result.providerAttempted ?? true,
      });

      if (completeErr) {
        failed.push(row.id);
        continue;
      }

      if (outcome === 'sent') sent.push(row.id);
      else failed.push(row.id);
    }

    let providerStatus: 'healthy' | 'degraded' | 'unavailable' | 'missing_config' = 'healthy';
    if (missingConfig > 0 && providerOk === 0) providerStatus = 'missing_config';
    else if (providerFail > 0) providerStatus = providerOk > 0 ? 'degraded' : 'unavailable';

    await recordProviderHealth(supabase, ctx, {
      provider: 'telegram',
      domain: 'ops',
      channel: 'telegram',
      status: providerStatus,
      errorCode: providerStatus === 'healthy' ? null : 'dispatch_failures',
      metadata: { ok: providerOk, fail: providerFail, missing: missingConfig },
    });

    if (webPushSent > 0 || webPushFail > 0) {
      await recordProviderHealth(supabase, ctx, {
        provider: 'web_push',
        domain: 'ops',
        channel: 'web_push',
        status: webPushFail > 0 ? (webPushSent > 0 ? 'degraded' : 'unavailable') : 'healthy',
        errorCode: webPushFail > 0 ? 'dispatch_failures' : null,
        metadata: { ok: webPushSent, fail: webPushFail },
      });
    }

    ctx.log('ops.telegram.dispatch.completed', {
      batch_count: claim.claimed ?? rows.length,
      skipped_count: manual.length,
    });

    await recordEdgeOpsEvent(supabase, ctx, {
      eventKey: 'ops.telegram.dispatch_completed',
      status: 'ok',
      batchCount: claim.claimed ?? rows.length,
      skippedCount: manual.length,
      metadata: {
        sent: sent.length,
        failed: failed.length,
        digest: digestMode,
        web_push_sent: webPushSent,
        web_push_fail: webPushFail,
      },
    });

    return ctx.jsonOk({
      ok: true,
      claimed: claim.claimed ?? rows.length,
      sent: sent.length,
      failed: failed.length,
      manual_review: manual.length,
      digest: digestMode,
      web_push_sent: webPushSent,
    });
  } catch (e) {
    ctx.logError('ops.telegram.dispatch.failed', 'internal_error', { internal: e });
    return ctx.jsonErr('internal_error', 500, { internal: e });
  }
});
