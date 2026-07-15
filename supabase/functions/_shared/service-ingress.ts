/**
 * Public service-ingress helpers — HMAC(IP) for dual rate buckets.
 * Raw IP never enters Postgres; only hex HMAC is passed to service RPCs.
 */
export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Prefer edge/proxy client IP headers; never log the raw value. */
export function extractClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded && forwarded.length > 0 && forwarded.length <= 128) return forwarded;
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp && realIp.length > 0 && realIp.length <= 128) return realIp;
  const cf = req.headers.get('cf-connecting-ip')?.trim();
  if (cf && cf.length > 0 && cf.length <= 128) return cf;
  return '0.0.0.0';
}

export async function ingressIpHmac(req: Request): Promise<string> {
  const secret =
    Deno.env.get('SERVICE_INGRESS_HMAC_SECRET') ??
    Deno.env.get('PG_BANK_WEBHOOK_SECRET') ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret) throw new Error('missing_env:SERVICE_INGRESS_HMAC_SECRET');
  return hmacSha256Hex(secret, `ip:${extractClientIp(req)}`);
}

export function decodeJwtSub(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replaceAll('-', '+').replaceAll('_', '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const claims = JSON.parse(atob(padded)) as { sub?: unknown; role?: unknown };
    if (claims.role === 'service_role') return null;
    const sub = typeof claims.sub === 'string' ? claims.sub.trim() : '';
    if (!/^[0-9a-f-]{36}$/i.test(sub)) return null;
    return sub;
  } catch {
    return null;
  }
}
