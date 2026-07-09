import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const PROJECT_REF = 'yocjhjsdwoijfdrehzoq';
const CONTAINER = `supabase_db_${PROJECT_REF}`;
const REALTIME_CONTAINER = `supabase_realtime_${PROJECT_REF}`;
const BACKUP_DIR = join(process.cwd(), 'backups');
const DB_SUPERUSER = 'supabase_admin';
const DB_PASSWORD = 'postgres';

function run(
  command: string,
  args: string[],
  options: { maxBuffer?: number; input?: string; env?: Record<string, string> } = {},
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: options.maxBuffer ?? 64 * 1024 * 1024,
    input: options.input,
    env: { ...process.env, ...options.env },
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function assertOk(label: string, result: ReturnType<typeof run>): void {
  if (result.status === 0) return;
  throw new Error(`${label} failed:\n${result.stderr || result.stdout}`);
}

function dockerExec(
  args: string[],
  options: { input?: string; maxBuffer?: number } = {},
): ReturnType<typeof run> {
  return run('docker', ['exec', '-e', `PGPASSWORD=${DB_PASSWORD}`, CONTAINER, ...args], options);
}

function psql(sql: string, database = 'postgres', user = DB_SUPERUSER): ReturnType<typeof run> {
  return dockerExec([
    'psql',
    '-U',
    user,
    '-d',
    database,
    '-v',
    'ON_ERROR_STOP=1',
    '-t',
    '-A',
    '-c',
    sql,
  ]);
}

function psqlScalar(sql: string, database = 'postgres', user = DB_SUPERUSER): number {
  const result = psql(sql, database, user);
  assertOk(`psql query: ${sql}`, result);
  const value = Number.parseInt(result.stdout.trim(), 10);
  if (Number.isNaN(value)) {
    throw new Error(`Expected integer from psql, got: ${result.stdout.trim()}`);
  }
  return value;
}

function dropReplicationSlots(): void {
  const slots = dockerExec([
    'psql',
    '-U',
    DB_SUPERUSER,
    '-d',
    'template1',
    '-t',
    '-A',
    '-c',
    "SELECT slot_name FROM pg_replication_slots WHERE database = 'postgres';",
  ]);
  assertOk('list replication slots', slots);
  for (const slot of slots.stdout
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)) {
    assertOk(
      `drop replication slot ${slot}`,
      psql(`SELECT pg_drop_replication_slot('${slot}');`, 'template1'),
    );
  }
}

function ensureRealtimeStopped(): void {
  run('docker', ['stop', REALTIME_CONTAINER]);
}

/**
 * Local backup/recovery rehearsal (RUNBOOK §3).
 * Does NOT trigger remote PITR — dumps local Docker Postgres, restores the dump via psql,
 * then verifies wallet + system hash chains on the restored database.
 */
function main(): void {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpPath = join(BACKUP_DIR, `local-rehearsal-${stamp}.sql`);

  mkdirSync(BACKUP_DIR, { recursive: true });

  const inspect = run('docker', ['inspect', '-f', '{{.State.Running}}', CONTAINER]);
  if (inspect.stdout.trim() !== 'true') {
    throw new Error(
      `Local Supabase DB container ${CONTAINER} is not running. Start with: supabase start`,
    );
  }

  console.log(`[1/5] pg_dump → ${dumpPath}`);
  const dump = dockerExec([
    'pg_dump',
    '-U',
    DB_SUPERUSER,
    '-d',
    'postgres',
    '--no-owner',
    '--no-privileges',
  ]);
  assertOk('pg_dump', dump);
  writeFileSync(dumpPath, dump.stdout, 'utf8');

  console.log(
    '[2/5] Recovery rehearsal: stop realtime → drop slots → DROP DATABASE → psql restore',
  );
  ensureRealtimeStopped();
  dropReplicationSlots();
  assertOk('drop database', psql('DROP DATABASE IF EXISTS postgres WITH (FORCE);', 'template1'));
  assertOk('create database', psql('CREATE DATABASE postgres;', 'template1'));

  const restore = run(
    'docker',
    [
      'exec',
      '-e',
      `PGPASSWORD=${DB_PASSWORD}`,
      '-i',
      CONTAINER,
      'psql',
      '-U',
      DB_SUPERUSER,
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    {
      input: readFileSync(dumpPath, 'utf8'),
      maxBuffer: 128 * 1024 * 1024,
    },
  );
  assertOk('psql restore', restore);

  console.log('[3/5] Post-restore hash-chain verify (restored database)');
  const walletBroken = psqlScalar(
    'SELECT count(*)::int FROM verify_ledger_hash_chain();',
    'postgres',
    'postgres',
  );
  const systemBroken = psqlScalar(
    'SELECT count(*)::int FROM verify_system_account_hash_chain();',
    'postgres',
    'postgres',
  );
  if (walletBroken !== 0 || systemBroken !== 0) {
    throw new Error(
      `Hash-chain verify failed after restore: verify_ledger_hash_chain=${walletBroken}, verify_system_account_hash_chain=${systemBroken}`,
    );
  }

  console.log('[4/5] Restart Supabase stack after restore');
  assertOk('supabase start', run('supabase', ['start']));

  console.log(
    '[5/5] Restore local dev grants/schema via supabase db reset (not part of recovery verify)',
  );
  assertOk('supabase db reset', run('supabase', ['db', 'reset', '--yes']));

  const summary = {
    rehearsed_at: new Date().toISOString(),
    container: CONTAINER,
    dump_path: dumpPath,
    dump_bytes: dump.stdout.length,
    recovery:
      'psql restore from dump (stop realtime → drop replication slots → DROP DATABASE postgres → CREATE → psql stdin as supabase_admin)',
    hash_chain_wallet_broken: walletBroken,
    hash_chain_system_broken: systemBroken,
    hash_chain_verify: 'PASS',
  };
  writeFileSync(
    join(BACKUP_DIR, 'last-rehearsal.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  );
  console.log('backup-rehearsal OK');
}

main();
