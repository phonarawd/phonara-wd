import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const PROJECT_REF = 'yocjhjsdwoijfdrehzoq';
const CONTAINER = `supabase_db_${PROJECT_REF}`;
const BACKUP_DIR = join(process.cwd(), 'backups');

function run(command: string, args: string[], maxBuffer = 64 * 1024 * 1024): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer });
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

/**
 * Local backup/recovery rehearsal (RUNBOOK §3).
 * Does NOT trigger remote PITR — dumps local Docker Postgres, resets via migrations,
 * then verifies SQL integration tests pass.
 */
function main(): void {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpPath = join(BACKUP_DIR, `local-rehearsal-${stamp}.sql`);

  mkdirSync(BACKUP_DIR, { recursive: true });

  const inspect = run('docker', ['inspect', '-f', '{{.State.Running}}', CONTAINER]);
  if (inspect.stdout.trim() !== 'true') {
    throw new Error(`Local Supabase DB container ${CONTAINER} is not running. Start with: supabase start`);
  }

  console.log(`[1/3] pg_dump → ${dumpPath}`);
  const dump = run('docker', [
    'exec',
    CONTAINER,
    'pg_dump',
    '-U',
    'postgres',
    '-d',
    'postgres',
    '--no-owner',
    '--no-privileges',
  ]);
  assertOk('pg_dump', dump);
  writeFileSync(dumpPath, dump.stdout, 'utf8');

  console.log('[2/3] Recovery rehearsal: supabase db reset');
  const reset = run('supabase', ['db', 'reset', '--yes']);
  assertOk('supabase db reset', reset);

  console.log('[3/3] Post-recovery gate: bun run test:sql');
  const sqlTests = run('tsx', ['scripts/run-sql-tests.ts']);
  assertOk('test:sql', sqlTests);

  const summary = {
    rehearsed_at: new Date().toISOString(),
    container: CONTAINER,
    dump_path: dumpPath,
    dump_bytes: dump.stdout.length,
    recovery: 'supabase db reset',
    sql_tests: 'PASS',
  };
  writeFileSync(join(BACKUP_DIR, 'last-rehearsal.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log('backup-rehearsal OK');
}

main();
