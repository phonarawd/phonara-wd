#!/usr/bin/env tsx
/**
 * Unified E2E posttest — artifact clean · Supabase/Docker on-demand OFF.
 * Respects PHONARA_KEEP_STACK=1 (stack-stop skips when set).
 */
import { spawnSyncSafe } from './lib/spawn-safe';

// CI uploads playwright-report/ on failure — do not delete artifacts in posttest there.
if (process.env.GITHUB_ACTIONS !== 'true') {
  const clean = spawnSyncSafe('bun', ['run', 'clean:artifacts'], { stdio: 'inherit' });
  if (clean.status !== 0) {
    process.exit(clean.status ?? 1);
  }
}

if (process.env.GITHUB_ACTIONS !== 'true') {
  const stop = spawnSyncSafe('tsx', ['scripts/stack-stop.ts', '--quiet'], { stdio: 'inherit' });
  process.exit(stop.status ?? 0);
}

process.exit(0);
