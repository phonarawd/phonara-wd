#!/usr/bin/env tsx
/**
 * One command: Docker Supabase + local admin seed + Admin Vite (3001 strict).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateSync } from 'otplib';
import { ensureDockerReady } from './lib/docker-ready';
import { ensureLocalSupabaseStarted } from './lib/supabase-local';
import { spawnSafe } from './lib/spawn-safe';

const CREDENTIALS_FILE = join(process.cwd(), '.local-admin-dev.credentials.json');

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

function printQuickRef(): void {
  if (!existsSync(CREDENTIALS_FILE)) return;
  try {
    const creds = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf8')) as {
      loginUrl: string;
      email: string;
      password: string;
      totpSecret: string;
    };
    const code = generateSync({ secret: creds.totpSecret });
    process.stdout.write('\n--- Admin login (local) ---\n');
    process.stdout.write(`${creds.loginUrl}\n`);
    process.stdout.write(`${creds.email} / ${creds.password}\n`);
    process.stdout.write(`TOTP now: ${code}\n\n`);
  } catch {
    /* ignore */
  }
}

async function main(): Promise<void> {
  process.stdout.write('=== PHONARA dev:admin:local ===\n');

  ensureDockerReady({ quiet: false, startDesktop: false });
  ensureLocalSupabaseStarted({ quiet: false });

  const seedCode = await run('bunx', ['tsx', 'scripts/seed-local-admin-dev.ts']);
  if (seedCode !== 0) process.exit(seedCode);

  printQuickRef();

  process.stdout.write('[dev:admin:local] starting Admin on http://127.0.0.1:3001 …\n');
  process.stdout.write(
    '[dev:admin:local] stop with Ctrl+C · stack stays up (bun run stack:stop)\n\n',
  );

  const devCode = await run('bun', [
    '--filter',
    '@phonara/admin',
    'dev',
    '--',
    '--host',
    '127.0.0.1',
    '--port',
    '3001',
    '--strictPort',
  ]);
  process.exit(devCode);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
