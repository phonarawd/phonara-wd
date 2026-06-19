#!/usr/bin/env tsx
/**
 * Zero-touch dev stack bootstrap for agents (Supabase auth + Docker + local stack).
 *
 *   bun run stack:ensure              # auth + env (fast · session start)
 *   bun run stack:ensure -- --full    # auth + Docker Desktop + supabase start
 *   bun run stack:ensure -- --docker-only
 *   bun run stack:ensure -- --auth-only
 */

import { ensureDockerReady } from './lib/docker-ready';
import { ensureSupabaseAuth } from './lib/supabase-auth';
import { ensureLocalSupabaseStarted } from './lib/supabase-local';

const args = new Set(process.argv.slice(2));
const quiet = args.has('--quiet');
const full = args.has('--full');
const authOnly = args.has('--auth-only');
const dockerOnly = args.has('--docker-only');

async function main(): Promise<void> {
  if (!quiet) {
    process.stdout.write('=== PHONARA stack:ensure (zero-touch) ===\n');
  }

  if (dockerOnly) {
    ensureDockerReady({ quiet });
    return;
  }

  await ensureSupabaseAuth({ quiet });

  if (authOnly) return;

  if (full || args.has('--supabase-start')) {
    // Never auto-launch Docker Desktop from hooks/pretest — spikes CPU/RAM on
    // low-spec Windows and freezes Cursor. Operator starts Docker once before E2E.
    ensureDockerReady({ quiet, startDesktop: false });
    ensureLocalSupabaseStarted({ quiet });
    return;
  }

  if (!quiet) {
    process.stdout.write('[stack:ensure] auth OK · use --full before E2E/SQL/db reset\n');
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
