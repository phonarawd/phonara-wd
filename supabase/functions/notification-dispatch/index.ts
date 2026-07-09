import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  createEdgeContext,
  mapSupabaseError,
  recordEdgeOpsEvent,
  recordProviderHealth,
} from '../_shared/edge-observability.ts';
import { authorizeServiceRole, env } from '../_shared/service-auth.ts';
import { buildOutboundDispatchHeaders } from '../_shared/outbound-dispatch-auth.ts';

const WORKER_ID = 'notification-dispatch';

interface ClaimedNotification {
  id: string;
  user_id: string;
  channel: string;
  event_type: string;
  payload: Record<string, unknown>;
  attempts: number;
  provider_idempotency_key: string;
}

async function dispatchChannel(
  channel: string,
  eventType: string,
  payload: Record<string, unknown>,
  idempotencyKey: string,
): Promise<{ ok: boolean; error?: string; providerAttempted?: boolean }> {
  if (channel === 'web_push' || channel === 'push') {
    const endpoint = Deno.env.get('WEB_PUSH_DISPATCH_URL');
    if (!endpoint) return { ok: false, error: 'web_push_not_configured', providerAttempted: false };
    const body = JSON.stringify({
      event_type: eventType,
      payload,
      idempotency_key: idempotencyKey,
    });
    const headers = await buildOutboundDispatchHeaders(
      body,
      idempotencyKey,
      Deno.env.get('WEB_PUSH_DISPATCH_HMAC_SECRET') ?? undefined,
    );
    const res = await fetch(endpoint, { method: 'POST', headers, body });
    return res.ok
      ? { ok: true, providerAttempted: true }
      : { ok: false, error: `web_push_${res.status}`, providerAttempted: true };
  }

  if (channel === 'email') {
    const endpoint = Deno.env.get('EMAIL_DISPATCH_URL');
    if (!endpoint) return { ok: false, error: 'email_not_configured', providerAttempted: false };
    const body = JSON.stringify({
      event_type: eventType,
      payload,
      idempotency_key: idempotencyKey,
    });
    const headers = await buildOutboundDispatchHeaders(
      body,
      idempotencyKey,
      Deno.env.get('EMAIL_DISPATCH_HMAC_SECRET') ?? undefined,
    );
    const res = await fetch(endpoint, { method: 'POST', headers, body });
    return res.ok
      ? { ok: true, providerAttempted: true }
      : { ok: false, error: `email_${res.status}`, providerAttempted: true };
  }

  if (channel === 'in_app') {
    return { ok: true, providerAttempted: false };
  }

  return { ok: false, error: 'unknown_channel', providerAttempted: false };
}

Deno.serve(async (req) => {
  const ctx = createEdgeContext('notification-dispatch', req);

  try {
    const auth = await authorizeServiceRole(req);
    if (typeof auth !== 'string') return auth;

    const supabase = createClient(env('SUPABASE_URL'), auth, {
      auth: { persistSession: false },
    });

    const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') ?? 50), 100);

    const { data: claimData, error: claimErr } = await supabase.rpc(
      'rpc_service_claim_notification_dispatch_batch',
      {
        p_worker_id: WORKER_ID,
        p_batch_size: limit,
        p_claim_ttl_seconds: 300,
      },
    );
    if (claimErr) {
      ctx.logError('ops.notification.dispatch.claim_failed', mapSupabaseError(claimErr));
      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.notification.dispatch_failed',
        status: 'error',
        errorCode: mapSupabaseError(claimErr),
      });
      return ctx.jsonErr(mapSupabaseError(claimErr), 500, { internal: claimErr });
    }

    const claim = claimData as { items?: ClaimedNotification[]; claimed?: number };
    const rows = claim.items ?? [];

    const sent: string[] = [];
    const failed: string[] = [];
    const manual: string[] = [];
    const channelOutcomes = new Map<string, { ok: number; fail: number; missing: number }>();

    for (const row of rows) {
      const idempotencyKey =
        row.provider_idempotency_key ?? `notification:dispatch:${row.id}:${row.attempts ?? 0}`;

      const result = await dispatchChannel(
        row.channel,
        row.event_type,
        (row.payload ?? {}) as Record<string, unknown>,
        idempotencyKey,
      );

      const stats = channelOutcomes.get(row.channel) ?? { ok: 0, fail: 0, missing: 0 };
      if (result.ok) stats.ok += 1;
      else if (result.providerAttempted === false) stats.missing += 1;
      else stats.fail += 1;
      channelOutcomes.set(row.channel, stats);

      let outcome: 'sent' | 'retryable_failed' | 'failed' | 'manual_review';
      if (result.ok) {
        outcome = 'sent';
      } else if (result.error === 'unknown_channel') {
        outcome = 'manual_review';
      } else if (result.providerAttempted === false) {
        outcome = 'retryable_failed';
      } else {
        outcome = 'retryable_failed';
      }

      const { error: completeErr } = await supabase.rpc(
        'rpc_service_complete_notification_dispatch',
        {
          p_notification_id: row.id,
          p_worker_id: WORKER_ID,
          p_outcome: outcome,
          p_error_code: result.error ?? null,
          p_provider_attempted: result.providerAttempted ?? true,
        },
      );

      if (completeErr) {
        failed.push(row.id);
        continue;
      }

      if (outcome === 'sent') sent.push(row.id);
      else if (outcome === 'manual_review') manual.push(row.id);
      else failed.push(row.id);
    }

    for (const [channel, stats] of channelOutcomes) {
      const provider = channel === 'push' ? 'web_push' : channel;
      let status: 'healthy' | 'degraded' | 'unavailable' | 'missing_config' = 'healthy';
      if (stats.missing > 0 && stats.ok === 0) status = 'missing_config';
      else if (stats.fail > 0) status = stats.ok > 0 ? 'degraded' : 'unavailable';

      await recordProviderHealth(supabase, ctx, {
        provider,
        domain: 'notification',
        channel,
        status,
        errorCode: status === 'healthy' ? null : 'dispatch_failures',
        metadata: { ok: stats.ok, fail: stats.fail, missing: stats.missing },
      });
    }

    ctx.log('ops.notification.dispatch.completed', {
      batch_count: claim.claimed ?? rows.length,
      skipped_count: manual.length,
    });

    await recordEdgeOpsEvent(supabase, ctx, {
      eventKey: 'ops.notification.dispatch_completed',
      status: 'ok',
      batchCount: claim.claimed ?? rows.length,
      skippedCount: manual.length,
      metadata: { sent: sent.length, failed: failed.length, manual_review: manual.length },
    });

    return ctx.jsonOk({
      ok: true,
      claimed: claim.claimed ?? rows.length,
      sent: sent.length,
      failed: failed.length,
      manual_review: manual.length,
    });
  } catch (e) {
    ctx.logError('ops.notification.dispatch.failed', 'internal_error', { internal: e });
    return ctx.jsonErr('internal_error', 500, { internal: e });
  }
});
