#!/usr/bin/env tsx
/**
 * Regenerate packages/shared-types/src/database.types.ts from the local Supabase schema.
 *
 * Modes:
 *   (default)  write regenerated types to disk
 *   --check    regenerate in-memory and fail if committed file differs (drift gate)
 *
 * Requires a running local Supabase (`supabase start` + `supabase db reset`) or host psql
 * against SUPABASE_DB_URL. Skips when no DB is reachable unless
 * PHONARA_DATABASE_TYPES_STRICT=1.
 */
import { existsSync, writeFileSync } from 'node:fs';
import {
  DEFAULT_DB_URL,
  findSupabaseDbContainer,
  probePostgresReady,
  resolveSupabaseContainerDbUrl,
} from './lib/db-connect.ts';
import {
  DATABASE_TYPES_OUTPUT,
  DATABASE_TYPES_SCHEMAS,
  finalizeDatabaseTypesContent,
  normalizeDatabaseTypesContent,
  readCommittedDatabaseTypes,
  sha256DatabaseTypes,
} from './lib/database-types-gen.ts';
import { spawnSyncSafe } from './lib/spawn-safe.ts';
import { waitForLocalPostgresReady } from './lib/supabase-local.ts';

const checkMode = process.argv.includes('--check');
const strict = process.env.PHONARA_DATABASE_TYPES_STRICT === '1';

function isLocalDatabaseReachable(): boolean {
  if (probePostgresReady()) return true;
  // Container or supabase status means postgres may still be booting — wait below.
  if (findSupabaseDbContainer()) return true;
  const status = spawnSyncSafe('supabase', ['status'], { encoding: 'utf8', stdio: 'pipe' });
  return status.status === 0 && /DB URL:/i.test(status.stdout ?? '');
}

function resolveGenTypesDbUrl(): string {
  const containerUrl = resolveSupabaseContainerDbUrl();
  if (containerUrl) return containerUrl;

  const explicit = process.env.SUPABASE_DB_URL?.trim();
  if (explicit) return explicit;

  return DEFAULT_DB_URL;
}

function runSupabaseGenTypes(): string {
  // Tokenless mode: --db-url only (CI sql job has no SUPABASE_ACCESS_TOKEN).
  // Prefer container bridge IP over --local / host 54322 (GHA port bind race after db reset).
  // Supabase CLI 2.106.0 regressed and required a token for all modes; fixed in 2.107.0 (#5553).
  const schema = DATABASE_TYPES_SCHEMAS.join(',');
  const dbUrl = resolveGenTypesDbUrl();
  const args = ['gen', 'types', '--schema', schema, '--db-url', dbUrl];

  const result = spawnSyncSafe('supabase', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || 'unknown error').trim();
    throw new Error(`supabase gen types failed: ${detail}`);
  }

  const output = result.stdout?.trim();
  if (!output) {
    throw new Error('supabase gen types returned empty output');
  }
  return output;
}

function reportSkip(message: string): void {
  if (checkMode && strict) {
    console.error(`${message} (PHONARA_DATABASE_TYPES_STRICT=1 requires a database)`);
    process.exit(1);
  }
  console.log(message);
}

function main(): void {
  if (!isLocalDatabaseReachable()) {
    reportSkip(
      'database-types: no local Supabase / SUPABASE_DB_URL; skipping generation and drift check.',
    );
    return;
  }

  let generated: string;
  try {
    waitForLocalPostgresReady({ quiet: true, timeoutMs: strict ? 120_000 : 30_000 });
    generated = finalizeDatabaseTypesContent(runSupabaseGenTypes());
  } catch (error) {
    console.error(
      `database-types: generation failed: ${error instanceof Error ? error.message : error}`,
    );
    process.exit(1);
  }

  if (checkMode) {
    if (!existsSync(DATABASE_TYPES_OUTPUT)) {
      console.error(
        `database-types drift: missing committed file at ${DATABASE_TYPES_OUTPUT}. Run \`bun run gen:types\`.`,
      );
      process.exit(1);
    }

    const committed = normalizeDatabaseTypesContent(readCommittedDatabaseTypes());
    const expected = normalizeDatabaseTypesContent(generated);

    if (sha256DatabaseTypes(committed) !== sha256DatabaseTypes(expected)) {
      if (process.env.GITHUB_ACTIONS === 'true') {
        writeFileSync('database.types.ci-expected.ts', expected, 'utf8');
      }
      console.error(
        'database-types drift detected. Run `bun run gen:types` after `supabase db reset` and commit:',
      );
      console.error(
        '  (no Docker) interim: `bun run gen:types:remote` — CI authoritative hash still requires local db reset.',
      );
      console.error(`  committed: ${DATABASE_TYPES_OUTPUT}`);
      console.error(`  committed sha256: ${sha256DatabaseTypes(committed)}`);
      console.error(`  expected sha256:  ${sha256DatabaseTypes(expected)}`);
      process.exit(1);
    }

    console.log(`database-types: OK (committed file matches local schema).`);
    return;
  }

  writeFileSync(DATABASE_TYPES_OUTPUT, generated, 'utf8');
  console.log(`database-types: wrote ${DATABASE_TYPES_OUTPUT}`);
}

main();
