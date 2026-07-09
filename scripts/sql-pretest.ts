#!/usr/bin/env tsx
/**
 * SQL pretest — skip redundant stack bootstrap on GitHub Actions when the job
 * already ran `supabase start` + `db reset` (mirrors scripts/e2e-pretest.ts).
 */
import { isLocalSupabaseRunning } from './lib/supabase-local';
import { spawnSyncSafe } from './lib/spawn-safe';

function runStep(command: string, args: string[]): void {
  const result = spawnSyncSafe(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// GHA sql job starts Supabase and exports SUPABASE_DB_URL before test:sql.
const ciSqlStackReady =
  process.env.GITHUB_ACTIONS === 'true' &&
  (Boolean(process.env.SUPABASE_DB_URL) || isLocalSupabaseRunning());

if (!ciSqlStackReady) {
  runStep('tsx', ['scripts/ensure-dev-stack.ts', '--full', '--quiet', '--sql-gate']);
}
