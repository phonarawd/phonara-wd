#!/usr/bin/env tsx
/**
 * Engine Phase 0 — migration name parity drift assertion.
 *
 * Compares local `supabase/migrations/*.sql` names with remote
 * `schema_migrations.name` via Management API. Timestamp prefix drift is
 * ignored — parity is by migration **name** suffix only.
 *
 * Usage:
 *   bun run check:engine-foundation-parity           # local inventory + remote diff when token present
 *   bun run check:engine-foundation-parity -- --local-only
 *   bun run check:engine-foundation-parity -- --strict   # exit 1 when remote missing local names
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { LOCKED_SUPABASE_PROJECT_REF } from './lib/locked-supabase-project';
import { ensureSupabaseAuth, readAccessTokenFromEnvFiles } from './lib/supabase-auth';

loadRepoEnvFiles();

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const REF = LOCKED_SUPABASE_PROJECT_REF;
const localOnly = process.argv.includes('--local-only');
const strict = process.argv.includes('--strict');

interface RemoteMigration {
  version?: string;
  name?: string;
}

function parseLocalNames(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((file) => {
      const m = file.match(/^\d+_(.+)\.sql$/);
      if (!m) throw new Error(`Invalid migration filename: ${file}`);
      return m[1]!;
    });
}

async function fetchRemoteNames(token: string): Promise<string[]> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/migrations`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Remote migration list failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as RemoteMigration[] | { migrations?: RemoteMigration[] };
  const rows = Array.isArray(data) ? data : (data.migrations ?? []);
  return rows
    .map((r) => r.name ?? '')
    .filter(Boolean)
    .sort();
}

function printReport(
  local: string[],
  remote: string[] | null,
): { missingOnRemote: string[]; extraOnRemote: string[] } {
  const localSet = new Set(local);
  const remoteSet = new Set(remote ?? []);
  const missingOnRemote = remote === null ? [] : local.filter((n) => !remoteSet.has(n));
  const extraOnRemote = remote === null ? [] : remote.filter((n) => !localSet.has(n));

  console.log(`[engine-foundation-parity] project=${REF}`);
  console.log(`[engine-foundation-parity] local migrations=${local.length}`);
  if (remote) {
    console.log(`[engine-foundation-parity] remote migrations=${remote.length}`);
  }

  const localTail = local.at(-1);
  const remoteTail = remote?.at(-1);
  console.log(`[engine-foundation-parity] local latest name=${localTail ?? 'n/a'}`);
  console.log(`[engine-foundation-parity] remote latest name=${remoteTail ?? 'n/a'}`);

  if (remote === null) {
    console.log('[engine-foundation-parity] remote diff: skipped (local-only mode)');
  } else if (missingOnRemote.length > 0) {
    console.log('[engine-foundation-parity] missing on remote (name parity):');
    for (const name of missingOnRemote) console.log(`  - ${name}`);
  } else if (remote) {
    console.log('[engine-foundation-parity] missing on remote: 0');
  }

  if (extraOnRemote.length > 0) {
    console.log('[engine-foundation-parity] extra on remote (not in local tree):');
    for (const name of extraOnRemote) console.log(`  - ${name}`);
  }

  return { missingOnRemote, extraOnRemote };
}

async function main(): Promise<void> {
  const local = parseLocalNames();

  if (localOnly) {
    printReport(local, null);
    console.log('[engine-foundation-parity] OK — local inventory only (--local-only)');
    return;
  }

  try {
    await ensureSupabaseAuth();
  } catch (err) {
    printReport(local, null);
    console.warn(
      `[engine-foundation-parity] SKIP remote diff — ${err instanceof Error ? err.message : String(err)}`,
    );
    console.log('[engine-foundation-parity] OK — local inventory recorded (remote advisory)');
    return;
  }

  const token = readAccessTokenFromEnvFiles() ?? process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) {
    printReport(local, null);
    console.warn('[engine-foundation-parity] SKIP remote diff — no SUPABASE_ACCESS_TOKEN');
    console.log('[engine-foundation-parity] OK — local inventory recorded (remote advisory)');
    return;
  }

  const remote = await fetchRemoteNames(token);
  const { missingOnRemote } = printReport(local, remote);

  if (strict && missingOnRemote.length > 0) {
    console.error(
      '[engine-foundation-parity] FAIL — remote missing local migration name(s). Run stack:push-remote after test:sql.',
    );
    process.exit(1);
  }

  console.log('[engine-foundation-parity] OK — name parity drift assertion complete');
}

main().catch((err) => {
  console.error('[engine-foundation-parity] ERROR', err instanceof Error ? err.message : err);
  process.exit(1);
});
