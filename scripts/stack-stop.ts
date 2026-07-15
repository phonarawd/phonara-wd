#!/usr/bin/env tsx
/**
 * Release local Supabase containers after E2E/SQL sessions.
 *
 * On-demand OFF (default): stops Supabase containers + quits Docker Desktop (WSL RAM).
 * Skip stack: PHONARA_KEEP_STACK=1 · skip Desktop quit: PHONARA_DOCKER_AUTO_QUIT=0
 */
import { runDockerClean } from './lib/docker-clean';
import {
  dockerAutoQuitEnabled,
  quitDockerDesktopAndReleaseWsl,
} from './lib/docker-desktop-lifecycle';
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { isLocalSupabaseRunning } from './lib/supabase-local';
import { spawnSyncSafe } from './lib/spawn-safe';

loadRepoEnvFiles();

const args = new Set(process.argv.slice(2));
const quiet = args.has('--quiet') || process.env['PHONARA_STACK_QUIET'] === '1';

function maybeQuitDockerDesktop(): void {
  if (dockerAutoQuitEnabled()) {
    quitDockerDesktopAndReleaseWsl({ quiet });
  } else if (!quiet) {
    process.stdout.write('[stack:stop] PHONARA_DOCKER_AUTO_QUIT=0 — Docker Desktop left running\n');
  }
}

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
    maybeQuitDockerDesktop();
    return;
  }

  if (!quiet) {
    process.stdout.write('[stack:stop] stopping local Supabase (`supabase stop`)…\n');
  }

  const stop = spawnSyncSafe('bunx', ['supabase', 'stop'], {
    stdio: quiet ? 'pipe' : 'inherit',
    encoding: 'utf8',
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

  maybeQuitDockerDesktop();
}

main();
