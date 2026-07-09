import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_DB_URL, findSupabaseDbContainer, hasPsql } from './lib/db-connect.ts';
import { ensureLocalSupabaseReadyForSql, waitForLocalPostgresReady } from './lib/supabase-local.ts';

// Runs every supabase/tests/*.sql file against a Postgres database.
// Each test file wraps itself in BEGIN ... ROLLBACK, so it leaves no residue.
//
// Preflight: `pretest:sql` → ensure-dev-stack --full resets on migration drift OR
// dirty SQL baseline (failed/interrupted prior runs where ON_ERROR_STOP skips ROLLBACK).
//
// Execution strategy (auto-detected):
//   1. If a local `supabase_db_*` Docker container is running (`supabase start`),
//      pipe each file into that container's psql — matches guard-coverage / pentest
//      and avoids GHA cases where host port 54322 is not yet bound.
//   2. Otherwise, if `psql` is on PATH -> run against SUPABASE_DB_URL.
const dbUrl = DEFAULT_DB_URL;

const testsDir = join(process.cwd(), 'supabase', 'tests');

if (!existsSync(testsDir)) {
  console.error(`No SQL tests directory at ${testsDir}`);
  process.exit(1);
}

const files = readdirSync(testsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.error('No *.sql test files found in supabase/tests/');
  process.exit(1);
}

type Runner = (sqlPath: string) => ReturnType<typeof spawnSync>;

function buildRunner(): { runner: Runner; mode: string } {
  const container = findSupabaseDbContainer();
  if (container) {
    return {
      mode: `docker exec ${container} psql`,
      runner: (sqlPath: string) => {
        const sql = readFileSync(sqlPath, 'utf8');
        return spawnSync(
          'docker',
          [
            'exec',
            '-i',
            container,
            'psql',
            '-U',
            'postgres',
            '-d',
            'postgres',
            '-v',
            'ON_ERROR_STOP=1',
          ],
          { input: sql, stdio: ['pipe', 'inherit', 'inherit'] },
        );
      },
    };
  }

  if (hasPsql()) {
    return {
      mode: `psql (${dbUrl})`,
      runner: (sqlPath: string) =>
        spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', sqlPath], { stdio: 'inherit' }),
    };
  }

  console.error(
    'No running `supabase_db_*` Docker container and no `psql` on PATH.\n' +
      'Run `supabase start` (or `bun run pretest:sql`) before `bun run test:sql`.',
  );
  process.exit(1);
}

try {
  ensureLocalSupabaseReadyForSql({ quiet: true });
  waitForLocalPostgresReady({ quiet: true, timeoutMs: 120_000 });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const { runner, mode } = buildRunner();

console.log(`Running SQL tests via: ${mode}`);

let failed = 0;

for (const file of files) {
  const path = join(testsDir, file);
  console.log(`\n=== Running ${file} ===`);
  const result = runner(path);
  if (result.status !== 0) {
    console.error(`FAILED: ${file} (exit ${result.status ?? 'unknown'})`);
    failed += 1;
  } else {
    console.log(`PASSED: ${file}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} SQL test file(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${files.length} SQL test file(s) passed.`);
