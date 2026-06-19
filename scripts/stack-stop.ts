#!/usr/bin/env tsx
/**
 * Release local Supabase containers after E2E/SQL sessions.
 *
 * Keeps Docker Desktop running (operator choice) but stops ~15 Supabase
 * containers that saturate RAM/CPU on low-spec PCs when left idle.
 *
 * Skip: PHONARA_KEEP_STACK=1 (e.g. back-to-back SQL after E2E).
 */
import { spawnSync } from 'node:child_process';
import { runDockerClean } from './lib/docker-clean';
import { isLocalSupabaseRunning } from './lib/supabase-local';

const args = new Set(process.argv.slice(2));
const quiet = args.has('--quiet') || process.env['PHONARA_STACK_QUIET'] === '1';

function main(): void {
  if (process.env['PHONARA_KEEP_STACK'] === '1') {
    if (!quiet) {
      process.stdout.write('[stack:stop] PHONARA_KEEP_STACK=1 — local stack left running\n');
    }
    return;
  }

  if (!isLocalSupabaseRunning()) {
    if (!quiet) process.stdout.write('[stack:stop] local stack already stopped\n');
    if (process.env['PHONARA_SKIP_DOCKER_CLEAN'] !== '1') {
      runDockerClean({ level: 'safe', quiet });
    }
    return;
  }

  if (!quiet) {
    process.stdout.write('[stack:stop] stopping local Supabase (`supabase stop`)…\n');
  }

  const stop = spawnSync('bunx', ['supabase', 'stop'], {
    stdio: quiet ? 'pipe' : 'inherit',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (stop.status !== 0) {
    process.stderr.write(
      '[stack:stop] `supabase stop` failed — run manually if lag persists: supabase stop\n',
    );
    process.exit(1);
  }

  if (!quiet) {
    process.stdout.write('[stack:stop] local stack stopped — Supabase containers released\n');
  }

  // Stopped container layers + dangling images — safe; never touches named DB volumes.
  if (process.env['PHONARA_SKIP_DOCKER_CLEAN'] !== '1') {
    runDockerClean({ level: 'safe', quiet });
  }
}

main();
