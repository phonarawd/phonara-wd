/**
 * siwe-auth — EIP-4361 SIWE challenge + verify → service_role complete.
 * Public ingress: HMAC(IP) dual-bucket on challenge create.
 * Login UI live unlock is deferred (siweLoginLive=false).
 * Never trust client-supplied user_id — JWT sub or existing wallet identity only.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { verifyMessage } from 'npm:viem@2.23.2';
import { handleCorsPreflight } from '../_shared/cors.ts';
import { createEdgeContext, mapSupabaseError } from '../_shared/edge-observability.ts';
import { decodeJwtSub, ingressIpHmac } from '../_shared/service-ingress.ts';

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing_env:${name}`);
  return v;
}

function normalizeAddress(address: string): string {
  const raw = address.trim().toLowerCase();
  const hex = raw.startsWith('0x') ? raw.slice(2) : raw;
  if (!/^[0-9a-f]{40}$/.test(hex)) {
    throw new Error('siwe_invalid_address');
  }
  return `0x${hex}`;
}

function serviceClient() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const ctx = createEdgeContext('siwe-auth', req);

  try {
    if (req.method !== 'POST') {
      return ctx.jsonErr('method_not_allowed', 405);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? 'complete')
      .trim()
      .toLowerCase();
    const service = serviceClient();
    const ipHmac = await ingressIpHmac(req);

    if (action === 'challenge' || action === 'create_challenge') {
      const addressRaw = String(body.address ?? '').trim();
      const chainRaw = body.chain_id;
      if (!addressRaw) {
        return ctx.jsonErr('invalid_request', 400);
      }
      const address = normalizeAddress(addressRaw);
      const chainId =
        typeof chainRaw === 'number' && Number.isFinite(chainRaw) && chainRaw > 0
          ? Math.floor(chainRaw)
          : null;

      const { data, error } = await service.rpc('rpc_service_create_siwe_challenge', {
        p_address: address,
        p_chain_id: chainId,
        p_ip_hmac: ipHmac,
      });
      if (error) {
        ctx.logError('auth.siwe.challenge_failed', mapSupabaseError(error));
        return ctx.jsonErr(mapSupabaseError(error), 400, { internal: error });
      }
      ctx.log('auth.siwe.challenge_created', { batch_count: 1 });
      return ctx.jsonOk({ ok: true, result: data });
    }

    if (action !== 'complete') {
      return ctx.jsonErr('invalid_request', 400);
    }

    const challengeId = String(body.challenge_id ?? '').trim();
    const message = String(body.message ?? '');
    const signature = String(body.signature ?? '').trim();
    const addressRaw = String(body.address ?? '').trim();

    // Reject client-supplied identity bind (M-04).
    if (body.user_id !== undefined && body.user_id !== null && String(body.user_id).trim() !== '') {
      return ctx.jsonErr('siwe_user_id_forbidden', 400);
    }

    if (!challengeId || !message || !signature || !addressRaw) {
      return ctx.jsonErr('invalid_request', 400);
    }

    const address = normalizeAddress(addressRaw);

    let valid = false;
    try {
      valid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch (err) {
      ctx.logError('auth.siwe.verify_failed', String(err));
      return ctx.jsonErr('siwe_signature_invalid', 401);
    }
    if (!valid) {
      return ctx.jsonErr('siwe_signature_invalid', 401);
    }

    if (!message.includes(address) || !message.includes('Nonce:')) {
      return ctx.jsonErr('siwe_message_mismatch', 400);
    }

    let userId = decodeJwtSub(req.headers.get('authorization'));
    if (!userId) {
      const { data: lookup, error: lookupErr } = await service.rpc(
        'rpc_service_lookup_siwe_identity',
        {
          p_address: address,
          p_chain_id: null,
        },
      );
      if (lookupErr) {
        ctx.logError('auth.siwe.lookup_failed', mapSupabaseError(lookupErr));
        return ctx.jsonErr(mapSupabaseError(lookupErr), 400, { internal: lookupErr });
      }
      if (lookup && typeof lookup === 'object' && (lookup as { found?: boolean }).found === true) {
        userId = String((lookup as { user_id?: string }).user_id ?? '');
      }
    }

    if (!userId) {
      // Minting new Auth users is deferred until siweLoginLive unlock.
      return ctx.jsonErr('siwe_identity_required', 403);
    }

    const { data, error } = await service.rpc('rpc_service_complete_siwe_login', {
      p_challenge_id: challengeId,
      p_address: address,
      p_user_id: userId,
    });

    if (error) {
      ctx.logError('auth.siwe.complete_failed', mapSupabaseError(error));
      return ctx.jsonErr(mapSupabaseError(error), 400, { internal: error });
    }

    ctx.log('auth.siwe.completed', {
      batch_count: 1,
      challenge_id: challengeId,
    });
    return ctx.jsonOk({ ok: true, result: data });
  } catch (err) {
    const code = err instanceof Error ? err.message : 'internal_error';
    if (code.startsWith('missing_env:')) {
      return ctx.jsonErr('misconfigured', 503);
    }
    if (code === 'siwe_invalid_address') {
      return ctx.jsonErr(code, 400);
    }
    ctx.logError('auth.siwe.unhandled', String(err));
    return ctx.jsonErr('internal_error', 500);
  }
});
