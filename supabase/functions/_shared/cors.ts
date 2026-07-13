/**
 * Explicit CORS for Edge Functions invoked directly from the browser
 * (siwe-auth, product-analytics, market-data-proxy). SA-05 — do not rely on
 * the Supabase gateway's default CORS behavior for public browser ingress;
 * declare the allowed methods/headers and answer the OPTIONS preflight
 * ourselves.
 *
 * These functions are intentionally origin-permissive public endpoints
 * (wallet-signature login challenge/verify, anonymous analytics ingest,
 * display-only exchange market data passthrough) — real authorization
 * happens inside the RPC layer (HMAC(IP) dual-bucket, JWT sub binding) or,
 * for market-data-proxy, is simply not needed (public read-only quote data,
 * no DB/RPC access). No `Access-Control-Allow-Credentials` is set, so a
 * wildcard origin does not expose cookie/session credentials.
 */

export const CORS_ALLOW_METHODS = 'GET, POST, OPTIONS';
export const CORS_ALLOW_HEADERS = 'authorization, content-type, x-request-id, apikey';

export const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': CORS_ALLOW_METHODS,
  'access-control-allow-headers': CORS_ALLOW_HEADERS,
  'access-control-max-age': '86400',
};

/** Return a 204 preflight response when `req` is an OPTIONS request, else null. */
export function handleCorsPreflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
