/**
 * Ensure private Storage bucket `platform-audit-evidence` exists (R0 Evidence Retention).
 * Uses service role from .env — does not print secrets.
 *
 * Usage: bun run scripts/ensure-platform-audit-evidence-bucket.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const BUCKET = 'platform-audit-evidence';
const PROJECT_URL_DEFAULT = 'https://yocjhjsdwoijfdrehzoq.supabase.co';

function loadEnvFile(path: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out.set(k, v);
  }
  return out;
}

function env(key: string): string | undefined {
  const fromProcess = process.env[key]?.replace(/^['"]|['"]$/g, '');
  if (fromProcess) return fromProcess;
  for (const file of ['.env', '.env.local', '.env.production']) {
    const v = loadEnvFile(resolve(process.cwd(), file)).get(key);
    if (v) return v.replace(/^['"]|['"]$/g, '');
  }
  return undefined;
}

async function main(): Promise<void> {
  // Single-project lock — never trust env URL for target project.
  const url = PROJECT_URL_DEFAULT;
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) {
    console.error('[ensure-bucket] missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: listErr } = await admin.storage.listBuckets();
  if (listErr) {
    console.error('[ensure-bucket] listBuckets failed:', listErr.message);
    process.exit(1);
  }

  const found = (existing ?? []).some((b) => b.id === BUCKET || b.name === BUCKET);
  if (found) {
    console.log(`[ensure-bucket] OK already exists: ${BUCKET}`);
    process.exit(0);
  }

  const { data, error } = await admin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'text/plain',
      'application/json',
      'application/zip',
    ],
  });

  if (error) {
    console.error('[ensure-bucket] createBucket failed:', error.message);
    process.exit(1);
  }

  console.log(`[ensure-bucket] CREATED private bucket: ${BUCKET}`, data?.name ?? '');
}

main().catch((e) => {
  console.error('[ensure-bucket] fatal', e);
  process.exit(1);
});
