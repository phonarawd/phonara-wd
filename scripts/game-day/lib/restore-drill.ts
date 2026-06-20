import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { DbSnapshot } from './snapshot.ts';
import { captureSnapshot, snapshotsMatch } from './snapshot.ts';

const PROJECT_REF = 'yocjhjsdwoijfdrehzoq';
export const DB_CONTAINER = `supabase_db_${PROJECT_REF}`;
const REALTIME_CONTAINER = `supabase_realtime_${PROJECT_REF}`;
const BACKUP_DIR = join(process.cwd(), 'backups');
const DB_SUPERUSER = 'supabase_admin';
const DB_PASSWORD = 'postgres';

/** Application money-path tables restored in drill 5 (data-only). */
const RESTORE_TABLES = [
  'wallets',
  'wallet_ledger',
  'system_accounts',
  'system_account_ledger',
  'game_bets',
  'game_rounds',
  'withdrawal_requests',
  'krw_deposit_requests',
  'bank_incoming_transfers',
] as const;

export interface DumpResult {
  readonly dumpPath: string;
  readonly dumpBytes: number;
  readonly commands: string[];
}

export interface RestoreResult {
  readonly hashChainWalletBroken: number;
  readonly hashChainSystemBroken: number;
  readonly commands: string[];
  readonly error?: string;
}

function run(
  command: string,
  args: string[],
  options: { maxBuffer?: number; input?: string } = {},
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: options.maxBuffer ?? 64 * 1024 * 1024,
    input: options.input,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function dockerExec(args: string[], options: { input?: string; maxBuffer?: number } = {}) {
  return run('docker', ['exec', '-e', `PGPASSWORD=${DB_PASSWORD}`, DB_CONTAINER, ...args], options);
}

function assertContainerRunning(): void {
  const inspect = run('docker', ['inspect', '-f', '{{.State.Running}}', DB_CONTAINER]);
  if (inspect.stdout.trim() !== 'true') {
    throw new Error(`Local Supabase DB container ${DB_CONTAINER} is not running`);
  }
}

function sleepMs(ms: number): void {
  spawnSync('powershell', ['-Command', `Start-Sleep -Milliseconds ${ms}`], { encoding: 'utf8' });
}

export function waitForDbReady(maxAttempts = 90): void {
  for (let i = 0; i < maxAttempts; i += 1) {
    const probe = dockerExec([
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-t',
      '-A',
      '-c',
      'SELECT 1;',
    ]);
    if (probe.status === 0 && probe.stdout.trim() === '1') {
      return;
    }
    sleepMs(1000);
  }
  throw new Error(`DB not ready after restore (${maxAttempts}s)`);
}

function psqlScalar(sql: string, user = 'postgres'): number {
  const result = dockerExec([
    'psql',
    '-U',
    user,
    '-d',
    'postgres',
    '-v',
    'ON_ERROR_STOP=1',
    '-t',
    '-A',
    '-c',
    sql,
  ]);
  if (result.status !== 0) {
    throw new Error(`psql scalar failed: ${result.stderr || result.stdout}`);
  }
  return Number.parseInt(result.stdout.trim(), 10);
}

export function createLocalDump(label = 'gameday-restore'): DumpResult {
  assertContainerRunning();
  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpPath = join(BACKUP_DIR, `${label}-${stamp}.sql`);

  const tableArgs = RESTORE_TABLES.flatMap((t) => ['-t', `public.${t}`]);
  const commands: string[] = [
    `docker exec ${DB_CONTAINER} pg_dump -U ${DB_SUPERUSER} -d postgres --data-only --no-owner --no-privileges ${RESTORE_TABLES.map((t) => `-t public.${t}`).join(' ')} > "${dumpPath}"`,
  ];

  const dump = dockerExec([
    'pg_dump',
    '-U',
    DB_SUPERUSER,
    '-d',
    'postgres',
    '--data-only',
    '--no-owner',
    '--no-privileges',
    ...tableArgs,
  ]);
  if (dump.status !== 0) {
    throw new Error(`pg_dump failed: ${dump.stderr || dump.stdout}`);
  }
  writeFileSync(dumpPath, dump.stdout, 'utf8');
  return { dumpPath, dumpBytes: dump.stdout.length, commands };
}

/** Session-scoped GUC — required for pg_dump COPY into guarded ledger tables. */
const LEDGER_WRITE_SESSION = `SELECT set_config('phonara.ledger_write', 'allowed', false);`;

function truncateRestoreTables(): void {
  const tableList = RESTORE_TABLES.map((t) => `public.${t}`).join(', ');
  const result = dockerExec([
    'psql',
    '-U',
    DB_SUPERUSER,
    '-d',
    'postgres',
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    `${LEDGER_WRITE_SESSION} TRUNCATE ${tableList} RESTART IDENTITY CASCADE;`,
  ]);
  if (result.status !== 0) {
    throw new Error(`TRUNCATE failed: ${result.stderr || result.stdout}`);
  }
}

export function restoreFromDump(dumpPath: string): RestoreResult {
  assertContainerRunning();
  const commands: string[] = [];

  commands.push(`docker stop ${REALTIME_CONTAINER}`);
  run('docker', ['stop', REALTIME_CONTAINER]);

  commands.push(`TRUNCATE ${RESTORE_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  try {
    truncateRestoreTables();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { hashChainWalletBroken: -1, hashChainSystemBroken: -1, commands, error: msg };
  }

  commands.push(
    `docker exec -i ${DB_CONTAINER} psql -U ${DB_SUPERUSER} -d postgres -v ON_ERROR_STOP=1 -c "${LEDGER_WRITE_SESSION.trim()}" < "${dumpPath}"`,
  );
  const restoreInput = `${LEDGER_WRITE_SESSION}\n${readFileSync(dumpPath, 'utf8')}`;
  const restore = run(
    'docker',
    ['exec', '-e', `PGPASSWORD=${DB_PASSWORD}`, '-i', DB_CONTAINER, 'psql', '-U', DB_SUPERUSER, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'],
    { input: restoreInput, maxBuffer: 128 * 1024 * 1024 },
  );
  if (restore.status !== 0) {
    return { hashChainWalletBroken: -1, hashChainSystemBroken: -1, commands, error: restore.stderr || restore.stdout };
  }

  commands.push(`docker start ${REALTIME_CONTAINER}`);
  run('docker', ['start', REALTIME_CONTAINER]);
  waitForDbReady(60);

  try {
    const walletBroken = psqlScalar('SELECT count(*)::int FROM verify_ledger_hash_chain();');
    const systemBroken = psqlScalar('SELECT count(*)::int FROM verify_system_account_hash_chain();');
    return { hashChainWalletBroken: walletBroken, hashChainSystemBroken: systemBroken, commands };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { hashChainWalletBroken: -1, hashChainSystemBroken: -1, commands, error: msg };
  }
}

export interface RestoreDrillOutcome {
  readonly pass: boolean;
  readonly snapshotBefore: DbSnapshot;
  readonly snapshotAfter: DbSnapshot;
  readonly dumpPath: string;
  readonly diffs: string[];
  readonly hashChainWalletBroken: number;
  readonly hashChainSystemBroken: number;
  readonly commands: string[];
  readonly error?: string;
}

export function evaluateRestoreDrill(
  snapshotBefore: DbSnapshot,
  snapshotAfter: DbSnapshot,
  dumpPath: string,
  restore: RestoreResult,
  dumpCommands: string[],
): RestoreDrillOutcome {
  const { match, diffs } = snapshotsMatch(snapshotBefore, snapshotAfter);
  const hashOk =
    restore.hashChainWalletBroken === 0 && restore.hashChainSystemBroken === 0;
  const pass = match && hashOk && !restore.error;

  writeFileSync(
    join(BACKUP_DIR, 'last-gameday-restore.json'),
    `${JSON.stringify(
      {
        rehearsed_at: new Date().toISOString(),
        dump_path: dumpPath,
        tables: RESTORE_TABLES,
        snapshot_match: match,
        diffs,
        hash_chain_wallet_broken: restore.hashChainWalletBroken,
        hash_chain_system_broken: restore.hashChainSystemBroken,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  return {
    pass,
    snapshotBefore,
    snapshotAfter,
    dumpPath,
    diffs,
    hashChainWalletBroken: restore.hashChainWalletBroken,
    hashChainSystemBroken: restore.hashChainSystemBroken,
    commands: [...dumpCommands, ...restore.commands],
    error: pass
      ? undefined
      : restore.error ?? `snapshot_match=${match} diffs=${diffs.join('; ')}`,
  };
}

export function capturePreRestoreSnapshot(userAId: string): DbSnapshot {
  return captureSnapshot(userAId);
}
