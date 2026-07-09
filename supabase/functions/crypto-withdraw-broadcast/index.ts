import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  createEdgeContext,
  mapSupabaseError,
  recordEdgeOpsEvent,
  recordProviderHealth,
  REQUEST_ID_HEADER,
} from '../_shared/edge-observability.ts';
import { authorizeServiceRole, env } from '../_shared/service-auth.ts';

const WORKER_ID = 'crypto-withdraw-broadcast';

interface BroadcastResult {
  withdrawal_id: string;
  ok: boolean;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

interface ClaimedWithdrawal {
  id: string;
  amount: string;
  currency: string;
  destination: Record<string, unknown>;
  broadcast_attempts: number;
  broadcast_idempotency_key: string;
}

Deno.serve(async (req) => {
  const ctx = createEdgeContext('crypto-withdraw-broadcast', req);

  try {
    const auth = await authorizeServiceRole(req);
    if (typeof auth !== 'string') return auth;

    const supabase = createClient(env('SUPABASE_URL'), auth, {
      auth: { persistSession: false },
    });

    const hotKey = Deno.env.get('CRYPTO_HOT_WALLET_PRIVATE_KEY');
    const signEndpoint =
      Deno.env.get('CRYPTO_SIGN_ENDPOINT') ?? `${env('SUPABASE_URL')}/functions/v1/crypto-sign`;

    const { data: claimData, error: claimErr } = await supabase.rpc(
      'rpc_service_claim_withdrawal_broadcast_batch',
      {
        p_worker_id: WORKER_ID,
        p_batch_size: 20,
        p_claim_ttl_seconds: 600,
      },
    );
    if (claimErr) {
      ctx.logError('ops.withdrawal.broadcast.claim_failed', mapSupabaseError(claimErr));
      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.withdrawal.broadcast_failed',
        status: 'error',
        errorCode: mapSupabaseError(claimErr),
      });
      return ctx.jsonErr(mapSupabaseError(claimErr), 500, { internal: claimErr });
    }

    const claim = claimData as { items?: ClaimedWithdrawal[]; claimed?: number };
    const pending = claim.items ?? [];

    if (!hotKey && !signEndpoint) {
      for (const row of pending) {
        await supabase.rpc('rpc_service_fail_withdrawal_broadcast', {
          p_withdrawal_id: row.id,
          p_worker_id: WORKER_ID,
          p_error_code: 'missing_hot_wallet_or_sign_endpoint',
          p_retryable: true,
        });
      }

      await recordProviderHealth(supabase, ctx, {
        provider: 'crypto_sign',
        domain: 'withdrawal',
        status: 'missing_config',
        errorCode: 'missing_hot_wallet_or_sign_endpoint',
      });

      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.withdrawal.broadcast_fail_closed',
        status: 'error',
        batchCount: claim.claimed ?? pending.length,
        errorCode: 'missing_hot_wallet_or_sign_endpoint',
      });

      return ctx.jsonOk({
        ok: true,
        fail_closed: true,
        claimed: claim.claimed ?? pending.length,
        processed: 0,
        reason: 'missing_hot_wallet_or_sign_endpoint',
      });
    }

    const results: BroadcastResult[] = [];
    let failCount = 0;

    for (const row of pending) {
      let txHash: string | null = null;

      if (signEndpoint) {
        const signRes = await fetch(signEndpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${auth}`,
            'x-idempotency-key': row.broadcast_idempotency_key,
            [REQUEST_ID_HEADER]: ctx.requestId,
          },
          body: JSON.stringify({
            withdrawal_id: row.id,
            amount: row.amount,
            currency: row.currency,
            destination: row.destination,
            idempotency_key: row.broadcast_idempotency_key,
          }),
        });
        if (!signRes.ok) {
          const signBody = (await signRes.json().catch(() => ({}))) as { reason?: string };
          await supabase.rpc('rpc_service_fail_withdrawal_broadcast', {
            p_withdrawal_id: row.id,
            p_worker_id: WORKER_ID,
            p_error_code: signBody.reason ?? `sign_${signRes.status}`,
            p_retryable: true,
          });
          failCount += 1;
          results.push({
            withdrawal_id: row.id,
            ok: false,
            error: `sign_${signRes.status}`,
            skipped: true,
            reason: signBody.reason ?? 'sign_failed',
          });
          continue;
        }
        const signed = (await signRes.json()) as { tx_hash?: string };
        txHash = signed.tx_hash ?? null;
      } else if (hotKey) {
        await supabase.rpc('rpc_service_fail_withdrawal_broadcast', {
          p_withdrawal_id: row.id,
          p_worker_id: WORKER_ID,
          p_error_code: 'hot_wallet_local_signing_not_implemented',
          p_retryable: false,
        });
        failCount += 1;
        results.push({
          withdrawal_id: row.id,
          ok: false,
          skipped: true,
          reason: 'hot_wallet_local_signing_not_implemented_use_CRYPTO_SIGN_ENDPOINT',
        });
        continue;
      }

      if (!txHash || txHash.startsWith('sim_')) {
        await supabase.rpc('rpc_service_fail_withdrawal_broadcast', {
          p_withdrawal_id: row.id,
          p_worker_id: WORKER_ID,
          p_error_code: 'invalid_tx_hash',
          p_retryable: false,
        });
        failCount += 1;
        results.push({
          withdrawal_id: row.id,
          ok: false,
          skipped: true,
          reason: 'invalid_tx_hash',
        });
        continue;
      }

      const { data, error } = await supabase.rpc('rpc_service_mark_withdrawal_broadcast', {
        p_withdrawal_id: row.id,
        p_tx_hash: txHash,
        p_reason: signEndpoint ? 'sign_endpoint_broadcast' : 'hot_wallet_broadcast',
        p_worker_id: WORKER_ID,
      });
      if (error) failCount += 1;
      results.push({
        withdrawal_id: row.id,
        ok: !error,
        error: error?.message,
        ...(data as object),
      });
    }

    const providerStatus =
      failCount === 0 ? 'healthy' : failCount < results.length ? 'degraded' : 'unavailable';
    await recordProviderHealth(supabase, ctx, {
      provider: 'crypto_sign',
      domain: 'withdrawal',
      status: providerStatus,
      errorCode: failCount > 0 ? 'broadcast_failures' : null,
      metadata: { processed: results.length, failed: failCount },
    });

    ctx.log('ops.withdrawal.broadcast.completed', {
      batch_count: claim.claimed ?? pending.length,
      skipped_count: failCount,
    });

    await recordEdgeOpsEvent(supabase, ctx, {
      eventKey: 'ops.withdrawal.broadcast_completed',
      status: failCount > 0 ? 'error' : 'ok',
      batchCount: claim.claimed ?? pending.length,
      skippedCount: failCount,
      errorCode: failCount > 0 ? 'broadcast_failures' : null,
    });

    return ctx.jsonOk({
      ok: true,
      claimed: claim.claimed ?? pending.length,
      processed: results.length,
      failed: failCount,
    });
  } catch (e) {
    ctx.logError('ops.withdrawal.broadcast.failed', 'internal_error', { internal: e });
    return ctx.jsonErr('internal_error', 500, { internal: e });
  }
});
