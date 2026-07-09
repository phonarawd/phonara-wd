import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_DB_URL,
  findSupabaseDbContainer,
  hasPsql,
  readLocalSupabaseEnv,
} from './db-connect';
import { sleepMs, spawnSyncSafe } from './spawn-safe';

export function findSupabaseDbContainer(): string | null {
  const probe = spawnSyncSafe('docker', ['ps', '--format', '{{.Names}}'], {
    encoding: 'utf8',
  });
  if (probe.status !== 0 || !probe.stdout) return null;
  return (
    probe.stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find((name) => name.startsWith('supabase_db_')) ?? null
  );
}

export function isLocalSupabaseRunning(): boolean {
  if (findSupabaseDbContainer()) return true;
  const status = spawnSyncSafe('bunx', ['supabase', 'status', '-o', 'json'], {
    stdio: 'pipe',
    encoding: 'utf8',
  });
  return status.status === 0 && /"API_URL"/.test(status.stdout ?? '');
}

export type EnsureLocalSupabaseOptions = {
  quiet?: boolean;
};

export function ensureLocalSupabaseStarted(options: EnsureLocalSupabaseOptions = {}): void {
  const { quiet = false } = options;
  if (isLocalSupabaseRunning()) {
    if (probeLocalPostgresReady()) {
      if (!quiet) process.stdout.write('[stack:supabase] local stack already running\n');
      return;
    }
    if (!quiet) {
      process.stdout.write('[stack:supabase] stack marked running but postgres down — stopping…\n');
    }
    spawnSyncSafe('bunx', ['supabase', 'stop'], { stdio: 'inherit' });
  }

  if (!quiet)
    process.stdout.write(
      '[stack:supabase] starting local stack (`supabase start --ignore-health-check`)…\n',
    );
  let start = spawnSyncSafe('bunx', ['supabase', 'start', '--ignore-health-check'], {
    stdio: 'inherit',
  });
  if (start.status !== 0) {
    if (!quiet) {
      process.stdout.write('[stack:supabase] start failed — retry after `supabase stop`…\n');
    }
    spawnSyncSafe('bunx', ['supabase', 'stop'], { stdio: 'inherit' });
    start = spawnSyncSafe('bunx', ['supabase', 'start', '--ignore-health-check'], {
      stdio: 'inherit',
    });
    if (start.status !== 0) {
      throw new Error('[stack:supabase] `supabase start` failed');
    }
  }

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (isLocalSupabaseRunning() && probeLocalPostgresReady()) {
      if (!quiet) process.stdout.write('[stack:supabase] local stack ready\n');
      return;
    }
    sleepMs(2000);
  }

  throw new Error('[stack:supabase] local stack did not become ready in time');
}

function probeLocalPostgresReady(): boolean {
  const container = findSupabaseDbContainer();
  if (container) {
    const result = spawnSyncSafe(
      'docker',
      ['exec', container, 'psql', '-U', 'postgres', '-At', '-c', 'SELECT 1'],
      { encoding: 'utf8' },
    );
    return result.status === 0 && (result.stdout ?? '').trim() === '1';
  }

  if (hasPsql()) {
    const result = spawnSyncSafe('psql', [DEFAULT_DB_URL, '-At', '-c', 'SELECT 1'], {
      encoding: 'utf8',
    });
    return result.status === 0 && (result.stdout ?? '').trim() === '1';
  }

  return false;
}

/** Block until local Postgres answers `SELECT 1` (docker exec preferred). */
export function waitForLocalPostgresReady(
  options: { quiet?: boolean; timeoutMs?: number } = {},
): void {
  const { quiet = false, timeoutMs = 120_000 } = options;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (probeLocalPostgresReady()) {
      if (!quiet) process.stdout.write('[stack:supabase] postgres ready\n');
      return;
    }
    sleepMs(2000);
  }
  throw new Error('[stack:supabase] postgres did not become ready in time');
}

function localMigrationHeadVersion(): string {
  const versions = readdirSync(join(process.cwd(), 'supabase', 'migrations'))
    .filter((name) => name.endsWith('.sql'))
    .map((name) => name.slice(0, name.indexOf('_')))
    .sort();
  const head = versions.at(-1);
  if (!head) throw new Error('[stack:supabase] no migration files found');
  return head;
}

function appliedMigrationHeadVersion(): string | null {
  const container = findSupabaseDbContainer();
  if (!container) return null;
  const result = spawnSyncSafe(
    'docker',
    [
      'exec',
      container,
      'psql',
      '-U',
      'postgres',
      '-At',
      '-c',
      'SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 1;',
    ],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) return null;
  const version = (result.stdout ?? '').trim();
  return version.length > 0 ? version : null;
}

/** Detect residue from interrupted/failed SQL integration tests (ON_ERROR_STOP skips ROLLBACK). */
const SQL_TEST_BASELINE_DIRTY_PROBE = `
SELECT CASE WHEN
  COALESCE((SELECT value FROM app_config WHERE key = 'system_readonly'), 'false') <> 'false'
  OR COALESCE((SELECT COUNT(*) FROM auth.users), 0) <> 0
  OR ABS(
    COALESCE((SELECT SUM(phon_available::NUMERIC + phon_locked::NUMERIC) FROM wallets), 0)
    - COALESCE((
      SELECT SUM(CASE
        WHEN direction = 'credit' THEN amount::NUMERIC
        WHEN direction IN ('debit', 'reverse') THEN -amount::NUMERIC
        ELSE 0
      END)
      FROM wallet_ledger WHERE currency = 'PHON'
    ), 0)
  ) > 0.000001
  OR ABS(
    COALESCE((SELECT SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC) FROM wallets), 0)
    - COALESCE((
      SELECT SUM(CASE
        WHEN direction = 'credit' THEN amount::NUMERIC
        WHEN direction IN ('debit', 'reverse') THEN -amount::NUMERIC
        ELSE 0
      END)
      FROM wallet_ledger WHERE currency = 'USDT'
    ), 0)
  ) > 0.000001
  OR ABS(
    COALESCE((SELECT SUM(phon_available::NUMERIC + phon_locked::NUMERIC) FROM wallets), 0)
    + COALESCE((SELECT SUM(balance::NUMERIC) FROM system_accounts WHERE currency = 'PHON'), 0)
  ) > 0.000001
  OR ABS(
    COALESCE((SELECT SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC) FROM wallets), 0)
    + COALESCE((SELECT SUM(balance::NUMERIC) FROM system_accounts WHERE currency = 'USDT'), 0)
  ) > 0.000001
THEN 't' ELSE 'f' END;
`;

export function isLocalSqlTestBaselineDirty(): boolean {
  const container = findSupabaseDbContainer();
  if (!container) return true;
  const result = spawnSyncSafe(
    'docker',
    ['exec', container, 'psql', '-U', 'postgres', '-At', '-c', SQL_TEST_BASELINE_DIRTY_PROBE],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) return true;
  return (result.stdout ?? '').trim() === 't';
}

function resetLocalSupabaseDb(options: EnsureLocalSupabaseOptions = {}): void {
  const reset = spawnSyncSafe('supabase', ['db', 'reset'], { stdio: 'inherit' });
  if (reset.status !== 0) throw new Error('[stack:supabase] `supabase db reset` failed');
  if (!options.quiet) process.stdout.write('[stack:supabase] db reset complete\n');
}

/** Signal PostgREST to reload after migrations or container restart. */
export function reloadPostgrestSchema(options: { quiet?: boolean; timeoutMs?: number } = {}): void {
  const { quiet = false, timeoutMs = 120_000 } = options;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const container = findSupabaseDbContainer();
    if (!container) {
      sleepMs(2000);
      continue;
    }
    const result = spawnSyncSafe(
      'docker',
      ['exec', container, 'psql', '-U', 'postgres', '-c', "NOTIFY pgrst, 'reload schema';"],
      { encoding: 'utf8' },
    );
    if (result.status === 0) {
      if (!quiet) process.stdout.write('[stack:supabase] PostgREST schema reload signaled\n');
      return;
    }
    sleepMs(2000);
  }
  throw new Error('[stack:supabase] PostgREST schema reload failed');
}

/** Block until a public RPC responds (guards stale PostgREST cache after db reset). */
export async function waitForPostgrestRpcReady(
  rpcName: string,
  options: { quiet?: boolean; timeoutMs?: number } = {},
): Promise<void> {
  const { quiet = false, timeoutMs = 60_000 } = options;
  const env = readLocalSupabaseEnv();
  const url = env?.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const anonKey =
    env?.VITE_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  const endpoint = `${url}/rest/v1/rpc/${rpcName}`;
  const deadline = Date.now() + timeoutMs;
  let streak = 0;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      if (response.ok) {
        streak += 1;
        if (streak >= 3) {
          if (!quiet) process.stdout.write(`[stack:supabase] RPC probe stable: ${rpcName}\n`);
          return;
        }
      } else {
        streak = 0;
      }
    } catch {
      streak = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`[stack:supabase] RPC probe timed out: ${rpcName}`);
}

/**
 * SQL preflight: start stack, auto-reset on migration drift or dirty test residue.
 * Skips PostgREST RPC probe (SQL tests use psql/docker exec only).
 */
export function ensureLocalSupabaseReadyForSql(options: EnsureLocalSupabaseOptions = {}): void {
  ensureLocalSupabaseStarted(options);
  const expected = localMigrationHeadVersion();
  const applied = appliedMigrationHeadVersion();
  const baselineDirty = isLocalSqlTestBaselineDirty();
  if (applied !== expected || baselineDirty) {
    if (!options.quiet) {
      const reason =
        applied !== expected
          ? `migration drift (applied=${applied ?? 'none'} expected=${expected})`
          : 'SQL test baseline dirty (prior failed/interrupted test:sql residue)';
      process.stdout.write(`[stack:supabase] ${reason} — db reset…\n`);
    }
    resetLocalSupabaseDb(options);
    reloadPostgrestSchema({ ...options, timeoutMs: 120_000 });
  }
}

/**
 * E2E/SQL preflight: start stack, auto-reset on backup drift, reload PostgREST schema.
 */
export async function ensureLocalSupabaseReadyForE2e(
  options: EnsureLocalSupabaseOptions = {},
): Promise<void> {
  ensureLocalSupabaseStarted(options);
  const expected = localMigrationHeadVersion();
  const applied = appliedMigrationHeadVersion();
  const baselineDirty = isLocalSqlTestBaselineDirty();
  const didReset = applied !== expected || baselineDirty;
  if (didReset) {
    if (!options.quiet) {
      const reason =
        applied !== expected
          ? `migration drift (applied=${applied ?? 'none'} expected=${expected})`
          : 'SQL test baseline dirty (prior failed/interrupted test:sql residue)';
      process.stdout.write(`[stack:supabase] ${reason} — db reset…\n`);
    }
    resetLocalSupabaseDb(options);
    reloadPostgrestSchema({ ...options, timeoutMs: 120_000 });
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  } else {
    reloadPostgrestSchema(options);
  }
  await waitForPostgrestRpcReady('rpc_get_golden_earth_status', {
    ...options,
    timeoutMs: didReset ? 300_000 : 60_000,
  });
  if (didReset) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
}
