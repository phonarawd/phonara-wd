import { createClient } from 'jsr:@supabase/supabase-js@2';
import { deriveChildAddress, type CryptoHdChain } from '../_shared/crypto-hd.ts';
import {
  createEdgeContext,
  mapSupabaseError,
  toStableErrorCode,
} from '../_shared/edge-observability.ts';

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing_env:${name}`);
  return v;
}

Deno.serve(async (req) => {
  const ctx = createEdgeContext('derive-crypto-address', req);

  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!bearer) return ctx.jsonErr('unauthorized', 401);

    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return ctx.jsonErr('unauthenticated', 401);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const chain = String(body.chain ?? 'TRC20').toUpperCase() as CryptoHdChain;

    const { data: slot, error: slotErr } = await supabase.rpc('rpc_get_crypto_deposit_address', {
      p_asset: 'USDT',
      p_chain: chain,
    });
    if (slotErr) {
      ctx.logError('ops.crypto.derive.slot_failed', mapSupabaseError(slotErr));
      return ctx.jsonErr(mapSupabaseError(slotErr), 400, { internal: slotErr });
    }

    const needsDerivation = Boolean(slot?.needs_derivation);
    if (!needsDerivation) {
      ctx.log('ops.crypto.derive.completed', { batch_count: 1 });
      return ctx.jsonOk({ ok: true, address: slot.address, chain, asset: 'USDT' });
    }

    const index = Number(slot.derivation_index ?? 0);
    const tronXpub = Deno.env.get('CRYPTO_TRON_XPUB');
    const ethXpub = Deno.env.get('CRYPTO_ETH_XPUB');
    const xpub = chain === 'ERC20' ? ethXpub : tronXpub;
    if (!xpub || xpub.length < 20) {
      ctx.logError('ops.crypto.derive.missing_xpub', 'custody_xpub_not_configured');
      return ctx.jsonErr('custody_xpub_not_configured', 503);
    }

    const address = deriveChildAddress(xpub, index, chain);

    const service = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });

    const { data: setRes, error: setErr } = await service.rpc('rpc_service_set_crypto_address', {
      p_user_id: userData.user.id,
      p_chain: chain,
      p_address: address,
      p_derivation_index: index,
    });
    if (setErr) {
      ctx.logError('ops.crypto.derive.persist_failed', mapSupabaseError(setErr));
      return ctx.jsonErr(mapSupabaseError(setErr), 500, { internal: setErr });
    }

    ctx.log('ops.crypto.derive.completed', { batch_count: 1 });
    return ctx.jsonOk({
      ok: true,
      address: setRes?.address ?? address,
      chain,
      asset: 'USDT',
      derived: true,
    });
  } catch (e) {
    ctx.logError('ops.crypto.derive.failed', toStableErrorCode(e, 'internal_error'), {
      internal: e,
    });
    return ctx.jsonErr('internal_error', 500, { internal: e });
  }
});
