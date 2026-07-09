#!/usr/bin/env tsx
/**
 * Regenerate database.types.ts from the locked remote project when Docker is unavailable.
 * Uses the same schema list as scripts/generate-database-types.ts (public + graphql_public).
 * CI authoritative path remains: supabase db reset → bun run gen:types (--db-url).
 */
import { writeFileSync } from 'node:fs';
import { spawnSyncSafe } from './lib/spawn-safe.ts';
import { LOCKED_SUPABASE_PROJECT_REF } from './lib/locked-supabase-project';
import {
  DATABASE_TYPES_OUTPUT,
  DATABASE_TYPES_SCHEMAS,
  finalizeDatabaseTypesContent,
  sha256DatabaseTypes,
} from './lib/database-types-gen.ts';

const schema = DATABASE_TYPES_SCHEMAS.join(',');
const result = spawnSyncSafe(
  'supabase',
  ['gen', 'types', '--schema', schema, '--project-id', LOCKED_SUPABASE_PROJECT_REF],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);

if (result.status !== 0) {
  const detail = (result.stderr || result.stdout || 'unknown error').trim();
  console.error(`supabase gen types (remote) failed: ${detail}`);
  process.exit(1);
}

const output = result.stdout?.trim();
if (!output || output.length < 10_000) {
  console.error('supabase gen types (remote) returned empty or truncated output');
  process.exit(1);
}

const final = finalizeDatabaseTypesContent(output);
writeFileSync(DATABASE_TYPES_OUTPUT, final, 'utf8');
console.log(`database-types:remote wrote ${DATABASE_TYPES_OUTPUT}`);
console.log(`database-types:remote sha256 ${sha256DatabaseTypes(final)}`);
console.log(
  'database-types:remote note: CI check:types uses local db reset — run `bun run gen:types` when Docker is available.',
);
