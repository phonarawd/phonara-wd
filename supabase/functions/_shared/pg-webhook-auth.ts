import { authorizeServiceRole, json } from './service-auth.ts';

async function sha256(text: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest);
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = await sha256(text);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function secretMatches(provided: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(provided), sha256(expected)]);
  return constantTimeEqual(a, b);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Stable JSON for HMAC signing (sorted object keys, recursive). */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJsonStringify(item)).join(',')}]`;
  }
  if (!isRecord(value)) return JSON.stringify(value);
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJsonStringify(value[k])}`).join(',')}}`;
}

function parseTimestampHeader(raw: string | null): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
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

export interface PgWebhookAuthContext {
  mode: 'service_role' | 'pg_hmac' | 'pg_webhook_secret';
  timestampUnix?: number;
  nonce?: string;
  signatureDigest?: string;
  canonicalBody: string;
  canonicalBodyHash: string;
  requestHash: string;
  replayKey: string;
}

const TIMESTAMP_SKEW_SECONDS = 300;
const TIMESTAMP_BUCKET_SECONDS = 300;

/** service_role OR HMAC headers OR legacy x-pg-webhook-secret (L4 ingest). */
export async function authorizePgBankIngest(
  request: Request,
  rawBody = '',
): Promise<PgWebhookAuthContext | Response> {
  const serviceAuth = await authorizeServiceRole(request);
  if (typeof serviceAuth === 'string') {
    const canonicalBody = rawBody;
    const canonicalBodyHash = await sha256Hex(canonicalBody);
    const requestHash = await sha256Hex(`${request.method}\n${canonicalBody}`);
    return {
      mode: 'service_role',
      canonicalBody,
      canonicalBodyHash,
      requestHash,
      replayKey: `service:${requestHash}`,
    };
  }

  const secret = Deno.env.get('PG_BANK_WEBHOOK_SECRET');
  if (!secret) {
    return json({ ok: false, error: 'webhook_not_configured' }, 503);
  }

  const timestampRaw =
    request.headers.get('x-pg-timestamp') ?? request.headers.get('x-pg-webhook-timestamp');
  const nonceRaw = request.headers.get('x-pg-nonce') ?? request.headers.get('x-pg-webhook-nonce');
  const signatureRaw =
    request.headers.get('x-pg-signature') ?? request.headers.get('x-pg-webhook-signature');

  if (timestampRaw && signatureRaw) {
    const timestampUnix = parseTimestampHeader(timestampRaw);
    if (timestampUnix === null) {
      return json({ ok: false, error: 'invalid_timestamp' }, 401);
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestampUnix) > TIMESTAMP_SKEW_SECONDS) {
      return json({ ok: false, error: 'timestamp_expired' }, 401);
    }

    const canonicalBody = rawBody;
    const nonce = nonceRaw?.trim() ?? '';
    const signedPayload = nonce
      ? `${timestampUnix}\n${nonce}\n${canonicalBody}`
      : `${timestampUnix}\n${canonicalBody}`;
    const expectedSig = await hmacSha256Hex(secret, signedPayload);
    const providedSig = signatureRaw.trim().toLowerCase();
    if (providedSig.length === 0 || providedSig !== expectedSig.toLowerCase()) {
      return json({ ok: false, error: 'invalid_signature' }, 401);
    }

    const canonicalBodyHash = await sha256Hex(canonicalBody);
    const requestHash = await sha256Hex(`${request.method}\n${canonicalBody}`);
    const replayKey = nonce
      ? nonce
      : await sha256Hex(
          `${canonicalBodyHash}:${Math.floor(timestampUnix / TIMESTAMP_BUCKET_SECONDS)}`,
        );

    return {
      mode: 'pg_hmac',
      timestampUnix,
      nonce: nonce || undefined,
      signatureDigest: providedSig,
      canonicalBody,
      canonicalBodyHash,
      requestHash,
      replayKey,
    };
  }

  const provided = request.headers.get('x-pg-webhook-secret')?.trim() ?? '';
  if (provided && (await secretMatches(provided, secret))) {
    const canonicalBody = rawBody;
    const canonicalBodyHash = await sha256Hex(canonicalBody);
    const requestHash = await sha256Hex(`${request.method}\n${canonicalBody}`);
    return {
      mode: 'pg_webhook_secret',
      canonicalBody,
      canonicalBodyHash,
      requestHash,
      replayKey: `secret:${requestHash}`,
    };
  }

  return json({ ok: false, error: 'unauthorized' }, 401);
}
