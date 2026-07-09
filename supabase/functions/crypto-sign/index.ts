import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  createEdgeContext,
  mapSupabaseError,
  recordEdgeOpsEvent,
  toStableErrorCode,
} from '../_shared/edge-observability.ts';
import { authorizeServiceRole, env } from '../_shared/service-auth.ts';

interface SignRequestBody {
  withdrawal_id?: string;
  amount?: string;
  currency?: string;
  destination?: { chain?: string; address?: string };
}

/** Service-role sign endpoint contract — fail-closed without operator HSM/hot keys. */
Deno.serve(async (req) => {
  const ctx = createEdgeContext('crypto-sign', req);

  try {
    const auth = await authorizeServiceRole(req);
    if (typeof auth !== 'string') return auth;

    const body = (await req.json().catch(() => ({}))) as SignRequestBody;
    const withdrawalId = body.withdrawal_id;
    if (!withdrawalId || withdrawalId.length < 8) {
      return ctx.jsonErr('invalid_withdrawal_id', 400);
    }

    const supabase = createClient(env('SUPABASE_URL'), auth, {
      auth: { persistSession: false },
    });

    const { data: row, error: qErr } = await supabase
      .from('withdrawal_requests')
      .select('id, status, amount, currency, destination, on_chain_tx_hash')
      .eq('id', withdrawalId)
      .maybeSingle();
    if (qErr) {
      ctx.logError('ops.crypto.sign.query_failed', mapSupabaseError(qErr));
      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.crypto.sign_failed',
        status: 'error',
        errorCode: mapSupabaseError(qErr),
      });
      return ctx.jsonErr(mapSupabaseError(qErr), 500, { internal: qErr });
    }
    if (!row) return ctx.jsonErr('withdrawal_not_found', 404);
    if (row.status !== 'approved') {
      return ctx.jsonErr('invalid_withdrawal_status', 409);
    }
    if (row.on_chain_tx_hash) {
      return ctx.jsonOk({ ok: true, tx_hash: row.on_chain_tx_hash, idempotent: true });
    }
    if (row.currency !== 'USDT') {
      return ctx.jsonErr('unsupported_currency', 400);
    }

    const chain = String(row.destination?.chain ?? body.destination?.chain ?? '').toUpperCase();
    if (chain !== 'TRC20' && chain !== 'ERC20') {
      return ctx.jsonErr('invalid_chain', 400);
    }

    const tronKey = Deno.env.get('CRYPTO_TRON_HOT_WALLET_PRIVATE_KEY');
    const ethKey = Deno.env.get('CRYPTO_ETH_HOT_WALLET_PRIVATE_KEY');
    const hasKey = chain === 'TRC20' ? Boolean(tronKey) : Boolean(ethKey);

    if (!hasKey) {
      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.crypto.sign_fail_closed',
        status: 'error',
        errorCode: 'signing_not_configured',
        metadata: { chain },
      });
      return ctx.jsonOk(
        {
          ok: false,
          fail_closed: true,
          reason: 'signing_not_configured',
          chain,
        },
        503,
      );
    }

    await recordEdgeOpsEvent(supabase, ctx, {
      eventKey: 'ops.crypto.sign_fail_closed',
      status: 'error',
      errorCode: 'hot_wallet_local_signing_not_implemented_use_external_hsm',
      metadata: { chain },
    });

    return ctx.jsonOk(
      {
        ok: false,
        fail_closed: true,
        reason: 'hot_wallet_local_signing_not_implemented_use_external_hsm',
        chain,
      },
      503,
    );
  } catch (e) {
    ctx.logError('ops.crypto.sign.failed', toStableErrorCode(e, 'internal_error'), { internal: e });
    return ctx.jsonErr('internal_error', 500, { internal: e });
  }
});
