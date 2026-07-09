const jsonHeaders = { 'content-type': 'application/json' };

async function sha256(text: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function tokenMatchesSecret(token: string, secret: string): Promise<boolean> {
  const [tokenHash, secretHash] = await Promise.all([sha256(token), sha256(secret)]);
  return constantTimeEqual(tokenHash, secretHash);
}

function decodeBase64UrlJson(segment: string): Record<string, unknown> | null {
  try {
    const base64 = segment.replaceAll('-', '+').replaceAll('_', '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

/** Layered service-role gate — matches price-feed cron/worker pattern. */
export async function authorizeServiceRole(request: Request): Promise<string | Response> {
  const authorization = request.headers.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return json({ ok: false, error: 'unauthorized' }, 401);

  const token = match[1].trim();
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (serviceKey && (await tokenMatchesSecret(token, serviceKey))) {
    return token;
  }

  const [, payload] = token.split('.');
  const claims = payload ? decodeBase64UrlJson(payload) : null;
  if (claims?.['role'] === 'service_role') {
    return token;
  }

  return json({ ok: false, error: 'service_role_required' }, 403);
}

export function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing_env:${name}`);
  return v;
}
