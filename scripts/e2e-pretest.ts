#!/usr/bin/env tsx
/**
 * Unified E2E pretest — orphan kill · port sweep · packages dist · local stack (non-CI).
 */
import { spawnSyncSafe } from './lib/spawn-safe';

function runStep(command: string, args: string[]): void {
  const result = spawnSyncSafe(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runStep('tsx', ['scripts/cursor-kill-orphans.ts']);
runStep('tsx', ['scripts/e2e-kill.ts']);

// GHA job already started Supabase and exported VITE_* keys before test:e2e.
const ciStackReady =
  process.env.GITHUB_ACTIONS === 'true' && Boolean(process.env.VITE_SUPABASE_ANON_KEY);

if (!ciStackReady) {
  runStep('tsx', ['scripts/ensure-dev-stack.ts', '--full', '--quiet']);
}

runStep('tsx', ['scripts/ensure-e2e-packages.ts']);
