#!/usr/bin/env tsx
/**
 * Prune stopped Docker artifacts after E2E/SQL — disk + Docker Desktop lag relief.
 *
 * Default (--safe): stopped containers, unused networks, dangling images.
 * Does NOT delete Supabase named volumes (local DB preserved).
 *
 * Levels:
 *   --safe    (default) dangling layers only
 *   --cache   + build cache
 *   --images  + all unused images (next supabase start re-pulls)
 *
 * NEVER auto: volume prune — use --volumes only with operator intent (wipes local DB).
 */
import { runDockerClean, runDockerVolumePurge } from './lib/docker-clean';

const args = new Set(process.argv.slice(2));
const quiet = args.has('--quiet') || process.env['PHONARA_STACK_QUIET'] === '1';

function level(): 'safe' | 'cache' | 'images' {
  if (args.has('--images')) return 'images';
  if (args.has('--cache')) return 'cache';
  return 'safe';
}

function main(): void {
  if (process.env['PHONARA_SKIP_DOCKER_CLEAN'] === '1') {
    if (!quiet) process.stdout.write('[stack:docker-clean] PHONARA_SKIP_DOCKER_CLEAN=1 — skipped\n');
    return;
  }

  runDockerClean({ level: level(), quiet });

  if (args.has('--volumes')) {
    if (process.env['PHONARA_DOCKER_PURGE_VOLUMES'] !== '1') {
      process.stderr.write(
        '[stack:docker-clean] --volumes requires PHONARA_DOCKER_PURGE_VOLUMES=1 (wipes local Supabase DB)\n',
      );
      process.exit(1);
    }
    runDockerVolumePurge({ quiet });
  }
}

main();
