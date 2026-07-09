#!/usr/bin/env tsx
/**
 * Canonical remote migration apply — repo rule `96-prod-apply-agent-deny`.
 *
 * Usage: `bun run stack:push-remote` after local `test:sql` green.
 * Auth: SUPABASE_ACCESS_TOKEN in .env · no `supabase link` required.
 * Parity: migration name (Management API server version ≠ local file prefix OK).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { LOCKED_SUPABASE_PROJECT_REF } from './lib/locked-supabase-project';
import { ensureSupabaseAuth } from './lib/supabase-auth';

loadRepoEnvFiles();

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const REF = LOCKED_SUPABASE_PROJECT_REF;

interface RemoteMigration {
  version?: string;
  name?: string;
}

interface Lint {
  level: 'ERROR' | 'WARN' | 'INFO';
  name: string;
  title?: string;
}

function parseLocalMigrations(): Array<{ version: string; name: string; path: string }> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((file) => {
      const m = file.match(/^(\d+)_(.+)\.sql$/);
      if (!m) throw new Error(`Invalid migration filename: ${file}`);
      return { version: m[1]!, name: m[2]!, path: join(MIGRATIONS_DIR, file) };
    });
}

async function fetchRemoteMigrations(
  token: string,
): Promise<Array<{ version: string; name: string }>> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/migrations`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Remote migration list failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as RemoteMigration[] | { migrations?: RemoteMigration[] };
  const rows = Array.isArray(data) ? data : (data.migrations ?? []);
  return rows
    .map((r) => ({ version: r.version ?? '', name: r.name ?? '' }))
    .filter((r) => r.version && r.name);
}

async function applyMigration(token: string, name: string, query: string): Promise<void> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/migrations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, query }),
  });
  if (!res.ok) {
    throw new Error(`apply ${name} failed: ${res.status} ${await res.text()}`);
  }
}

async function fetchSecurityErrors(token: string): Promise<number> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/advisors/security`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Security advisor failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { lints?: Lint[]; result?: { lints?: Lint[] } };
  const lints = data.lints ?? data.result?.lints ?? [];
  return lints.filter((l) => l.level === 'ERROR').length;
}

async function main(): Promise<void> {
  await ensureSupabaseAuth({ quiet: false });

  const token = process.env.SUPABASE_ACCESS_TOKEN!.trim();
  const local = parseLocalMigrations();
  const remote = await fetchRemoteMigrations(token);
  const remoteNames = new Set(remote.map((r) => r.name));
  const pending = local.filter((m) => !remoteNames.has(m.name));

  if (pending.length === 0) {
    const tail = remote.at(-1);
    process.stdout.write(
      `[stack:push-remote] remote already has all local migration names (tail ${tail?.version}_${tail?.name})\n`,
    );
    const errors = await fetchSecurityErrors(token);
    process.stdout.write(`[stack:push-remote] security advisor ERROR count: ${errors}\n`);
    process.exit(errors > 0 ? 1 : 0);
  }

  process.stdout.write(`[stack:push-remote] applying ${pending.length} migration(s) to ${REF}…\n`);

  for (const mig of pending) {
    const query = readFileSync(mig.path, 'utf8');
    process.stdout.write(`  → ${mig.version}_${mig.name}\n`);
    await applyMigration(token, mig.name, query);
  }

  const after = await fetchRemoteMigrations(token);
  const afterNames = new Set(after.map((r) => r.name));
  const stillPending = local.filter((m) => !afterNames.has(m.name));
  if (stillPending.length > 0) {
    process.stderr.write(
      `[stack:push-remote] FAIL — names still missing: ${stillPending.map((m) => m.name).join(', ')}\n`,
    );
    process.exit(1);
  }

  const tail = after.at(-1)!;
  process.stdout.write(
    `[stack:push-remote] OK — remote tail ${tail.version}_${tail.name} (${local.length} local files · name parity)\n`,
  );
  process.stdout.write(
    '[stack:push-remote] note: Management API may assign server timestamps ≠ local file prefixes (SQL applied OK)\n',
  );

  const errors = await fetchSecurityErrors(token);
  process.stdout.write(`[stack:push-remote] security advisor ERROR count: ${errors}\n`);
  if (errors > 0) {
    process.stderr.write(
      '[stack:push-remote] FAIL — resolve security advisor ERRORs before done\n',
    );
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`[stack:push-remote] ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
