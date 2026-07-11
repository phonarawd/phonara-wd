/**
 * siwe-auth — EIP-4361 SIWE verify → service_role complete.
 * WAVE engine path for ew-e9-identity-wave (ADR-019).
 * Login UI live unlock is deferred (siweLoginLive=false).
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { verifyMessage } from 'npm:viem@2.23.2';
import { createEdgeContext, mapSupabaseError } from '../_shared/edge-observability.ts';

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

Deno.serve(async (req) => {
  const ctx = createEdgeContext('siwe-auth', req);

  try {
    if (req.method !== 'POST') {
      return ctx.jsonErr('method_not_allowed', 405);
    }

    const body = await req.json().catch(() => ({}));
    const challengeId = String(body.challenge_id ?? '').trim();
    const message = String(body.message ?? '');
    const signature = String(body.signature ?? '').trim();
    const addressRaw = String(body.address ?? '').trim();
    const userId = String(body.user_id ?? '').trim();

    if (!challengeId || !message || !signature || !addressRaw || !userId) {
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

    const service = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });

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
