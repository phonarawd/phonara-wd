#!/usr/bin/env tsx
/**
 * Remote smoke — pg-bank-webhook HMAC path (no Supabase JWT).
 * Usage: `bun run stack:smoke-pg-webhook-hmac`
 */
import { createHmac, randomUUID } from 'node:crypto';
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { LOCKED_SUPABASE_URL } from './lib/locked-supabase-project';

loadRepoEnvFiles();

const SECRET = process.env['PG_BANK_WEBHOOK_SECRET']?.replace(/^['"]|['"]$/g, '');
if (!SECRET) {
  console.error('[smoke-pg-hmac] missing PG_BANK_WEBHOOK_SECRET in .env / .env.local');
  process.exit(1);
}

const FN_URL = `${LOCKED_SUPABASE_URL}/functions/v1/pg-bank-webhook`;

function hmacHex(secret: string, message: string): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}

function hmacHeaders(rawBody: string, opts?: { badSig?: boolean; skew?: number }) {
  const timestamp = Math.floor(Date.now() / 1000) + (opts?.skew ?? 0);
  const nonce = randomUUID();
  const signedPayload = `${timestamp}\n${nonce}\n${rawBody}`;
  let signature = hmacHex(SECRET!, signedPayload);
  if (opts?.badSig) signature = '0'.repeat(64);
  return {
    'x-pg-timestamp': String(timestamp),
    'x-pg-nonce': nonce,
    'x-pg-signature': signature,
    'Content-Type': 'application/json',
  };
}

async function main(): Promise<void> {
  let failed = 0;

  // 1) GET health via HMAC (no Authorization header)
  {
    const rawBody = '';
    const res = await fetch(FN_URL, { method: 'GET', headers: hmacHeaders(rawBody) });
    const json = (await res.json()) as { ok?: boolean; auth?: string; service?: string };
    const ok =
      res.status === 200 &&
      json.ok === true &&
      json.auth === 'pg_hmac' &&
      json.service === 'pg-bank-webhook';
    console.log(
      `[smoke-pg-hmac] GET HMAC → HTTP ${res.status} auth=${json.auth} ${ok ? 'OK' : 'FAIL'}`,
    );
    if (!ok) failed += 1;
  }

  // 2) POST bad signature → 401
  {
    const rawBody = JSON.stringify({
      transfer_id: 'smoke-bad-sig',
      amount_krw: '1000',
      depositor_name: 'Smoke',
      reference_code: 'REF001',
    });
    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: hmacHeaders(rawBody, { badSig: true }),
      body: rawBody,
    });
    const json = (await res.json()) as { error?: string };
    const ok = res.status === 401 && json.error === 'invalid_signature';
    console.log(
      `[smoke-pg-hmac] POST bad sig → HTTP ${res.status} error=${json.error} ${ok ? 'OK' : 'FAIL'}`,
    );
    if (!ok) failed += 1;
  }

  // 3) POST valid HMAC, expired timestamp → 401
  {
    const rawBody = JSON.stringify({
      transfer_id: 'smoke-expired',
      amount_krw: '1000',
      depositor_name: 'Smoke',
      reference_code: 'REF002',
    });
    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: hmacHeaders(rawBody, { skew: -600 }),
      body: rawBody,
    });
    const json = (await res.json()) as { error?: string };
    const ok = res.status === 401 && json.error === 'timestamp_expired';
    console.log(
      `[smoke-pg-hmac] POST expired ts → HTTP ${res.status} error=${json.error} ${ok ? 'OK' : 'FAIL'}`,
    );
    if (!ok) failed += 1;
  }

  // 4) POST valid HMAC — auth passes; ingest may fail on unknown reference (not 401)
  {
    const rawBody = JSON.stringify({
      transfer_id: `smoke-hmac-${randomUUID()}`,
      amount_krw: '1000',
      depositor_name: 'HMAC Smoke',
      reference_code: 'NONEXISTENT_REF_SMOKE',
    });
    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: hmacHeaders(rawBody),
      body: rawBody,
    });
    const json = (await res.json()) as { ok?: boolean; error?: string; auth?: string };
    const authPassed =
      res.status !== 401 && json.error !== 'unauthorized' && json.error !== 'invalid_signature';
    const ok =
      authPassed && (json.auth === 'pg_hmac' || json.ok === true || typeof json.error === 'string');
    console.log(
      `[smoke-pg-hmac] POST valid HMAC → HTTP ${res.status} auth=${json.auth ?? '-'} error=${json.error ?? '-'} ${ok ? 'OK' : 'FAIL'}`,
    );
    if (!ok) failed += 1;
  }

  // 5) No auth at all → 401 (proves verify_jwt=false + custom auth gate)
  {
    const res = await fetch(FN_URL, { method: 'GET' });
    const json = (await res.json()) as { error?: string };
    const ok = res.status === 401 && json.error === 'unauthorized';
    console.log(
      `[smoke-pg-hmac] GET no auth → HTTP ${res.status} error=${json.error} ${ok ? 'OK' : 'FAIL'}`,
    );
    if (!ok) failed += 1;
  }

  if (failed > 0) {
    console.error(`[smoke-pg-hmac] FAIL — ${failed} check(s) red`);
    process.exit(1);
  }
  console.log('[smoke-pg-hmac] OK — HMAC path verified (verify_jwt=false + custom auth)');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
