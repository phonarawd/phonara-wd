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
const supabase = probe('bunx', ['supabase', '--version']) ?? probe('supabase', ['--version']);

console.log('Toolchain:');
console.log(`  bun:      ${bun ?? 'MISSING — install https://bun.sh'}`);
console.log(`  node:     ${node ?? 'optional (bun bundles runtime)'}`);
console.log(`  docker:   ${docker ?? 'MISSING — required for local Supabase/E2E'}`);
console.log(`  supabase: ${supabase ?? 'MISSING — run `bun install` (CLI pinned in devDependencies)'}`);

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

console.log('\nPresentation stack (apps/web) — Lovable replacement mode:');
console.log('  Core: React 19 + React Compiler, Vite 8, Tailwind v4, TS 6 strict');
console.log('  Data: TanStack Router/Query/Table/Virtual');
console.log('  UI: framer-motion, Radix (full shadcn set), vaul, cmdk, sonner, @use-gesture/react');
console.log('  Forms: react-hook-form + zod 4, input-otp, react-day-picker, embla-carousel');
console.log('  Casino: pixi.js@8, pixi-filters@6, matter-js, canvas-confetti, comlink');
console.log('  Trade: lightweight-charts@5');
console.log('  Share/SEO: html-to-image, qrcode.react, react-helmet-async, vite-plugin-pwa');
console.log('\nEngine stack (read-only during UI import):');
console.log('  @phonara/money, game-engine, trading-engine, wallet-ledger, Supabase JS v2');
console.log('\nSystem tools (install separately if MISSING):');
console.log('  Docker Desktop — local Supabase + money E2E');
console.log('  Supabase CLI — migrations (`supabase start`, `db reset`)');
console.log('  Playwright Chromium — installed by this script');

if (ok) {
  console.log('\n▶ stack:ensure (Supabase auth + env)');
  run('bun', ['run', 'stack:ensure', '--', '--auth-only', '--quiet']);
  console.log('\nℹ Full local stack (Docker + supabase start): `bun run stack:ensure:full`');
  console.log('\n✓ setup complete — run `bun run dev` to start the web app.');
} else {
  console.log('\n✗ setup finished with errors — fix the steps above and re-run `bun run setup`.');
  process.exit(1);
}
