#!/usr/bin/env tsx
/**
 * One-shot dev environment bootstrap for PHONARA (Windows/macOS/Linux).
 * Installs JS deps, Playwright browsers, and verifies core toolchain.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function run(command: string, args: string[], cwd = root): boolean {
  const label = [command, ...args].join(' ');
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`✗ failed: ${label}`);
    return false;
  }
  return true;
}

function probe(command: string, args: string[]): string | null {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) return null;
  return (result.stdout ?? result.stderr ?? '').trim().split('\n')[0] ?? null;
}

console.log('PHONARA dev environment setup\n');

const bun = probe('bun', ['--version']);
const node = probe('node', ['--version']);
const docker = probe('docker', ['--version']);
const supabase = probe('supabase', ['--version']);

console.log('Toolchain:');
console.log(`  bun:      ${bun ?? 'MISSING — install https://bun.sh'}`);
console.log(`  node:     ${node ?? 'optional (bun bundles runtime)'}`);
console.log(`  docker:   ${docker ?? 'MISSING — required for local Supabase/E2E'}`);
console.log(`  supabase: ${supabase ?? 'MISSING — install https://supabase.com/docs/guides/cli'}`);

if (!bun) {
  process.exit(1);
}

let ok = true;
ok = run('bun', ['install']) && ok;
ok = run('bun', ['run', 'build:packages']) && ok;
ok = run('bunx', ['playwright', 'install', 'chromium']) && ok;

if (docker && supabase) {
  const config = resolve(root, 'supabase', 'config.toml');
  if (existsSync(config)) {
    console.log('\nℹ Local Supabase: run `supabase start` when you need DB/E2E (Docker).');
  }
} else {
  console.log('\n⚠ Skipping Supabase start hint — install Docker + Supabase CLI for money/E2E gates.');
}

console.log('\nPresentation stack (apps/web):');
console.log('  React 19 + React Compiler, Vite 8, Tailwind v4, TanStack Router/Query');
console.log('  framer-motion, lucide-react, Radix UI, vaul, cmdk, sonner, canvas-confetti');
console.log('  react-hook-form + zod, embla-carousel, react-day-picker, tw-animate-css');

if (ok) {
  console.log('\n✓ setup complete — run `bun run dev` to start the web app.');
} else {
  console.log('\n✗ setup finished with errors — fix the steps above and re-run `bun run setup`.');
  process.exit(1);
}
