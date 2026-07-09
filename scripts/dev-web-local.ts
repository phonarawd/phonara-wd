#!/usr/bin/env tsx
/**
 * One command: Docker Supabase + Web Vite (3000 strict) with local VITE_* env.
 *
 * Uses `.env.local` overrides (Vite `envDir` = repo root). Syncs anon key from
 * `supabase status` after the stack is up so db reset / key rotation stays aligned.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readLocalSupabaseEnv } from './lib/db-connect';
import { ensureDockerReady } from './lib/docker-ready';
import { ensureLocalSupabaseStarted } from './lib/supabase-local';
import { spawnSafe } from './lib/spawn-safe';

const ENV_LOCAL = join(process.cwd(), '.env.local');

function upsertEnvLocal(lines: string[], key: string, value: string): string[] {
  const prefix = `${key}=`;
  let found = false;
  const out = lines.map((line) => {
    if (line.startsWith(prefix)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) out.push(`${key}=${value}`);
  return out;
}

function syncLocalViteEnv(): void {
  const local = readLocalSupabaseEnv();
  if (!local) {
    throw new Error(
      '[dev:web:local] could not read local Supabase keys — is `supabase start` healthy?',
    );
  }

  const lines = existsSync(ENV_LOCAL) ? readFileSync(ENV_LOCAL, 'utf8').split(/\r?\n/) : [];
  let out = upsertEnvLocal(lines, 'VITE_SUPABASE_URL', local.VITE_SUPABASE_URL);
  out = upsertEnvLocal(out, 'VITE_SUPABASE_ANON_KEY', local.VITE_SUPABASE_ANON_KEY);
  writeFileSync(ENV_LOCAL, `${out.join('\n').replace(/\n*$/, '')}\n`, 'utf8');

  process.stdout.write('[dev:web:local] synced VITE_SUPABASE_* → .env.local\n');
  process.stdout.write(`[dev:web:local] API ${local.VITE_SUPABASE_URL}\n`);
}

function run(command: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawnSafe(command, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

async function main(): Promise<void> {
  process.stdout.write('=== PHONARA dev:web:local ===\n');

  ensureDockerReady({ quiet: false });
  ensureLocalSupabaseStarted({ quiet: false });
  syncLocalViteEnv();

  process.stdout.write('[dev:web:local] starting Web on http://127.0.0.1:3000 …\n');
  process.stdout.write(
    '[dev:web:local] stop with Ctrl+C · stack stays up (bun run stack:stop)\n\n',
  );

  const devCode = await run('bun', [
    '--filter',
    '@phonara/web',
    'dev',
    '--',
    '--host',
    '127.0.0.1',
    '--port',
    '3000',
    '--strictPort',
  ]);
  process.exit(devCode);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
