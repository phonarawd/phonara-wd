import { spawnSync } from 'node:child_process';
import { defineConfig } from '@playwright/test';

const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function readLocalServiceKey(): string | undefined {
  const result = spawnSync('supabase', ['status', '-o', 'env'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) return undefined;
  const values = new Map<string, string>();
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=['"]?(.+?)['"]?$/);
    if (match) values.set(match[1]!, match[2]!);
  }
  return values.get('SECRET_KEY') ?? values.get('SUPABASE_SERVICE_ROLE_KEY') ?? values.get('SERVICE_ROLE_KEY');
}

/** Sports engine E2E must hit local migrations (S1–S7), not remote .env URL. */
process.env['VITE_SUPABASE_URL'] = 'http://127.0.0.1:54444';
process.env['VITE_SUPABASE_ANON_KEY'] = LOCAL_ANON_KEY;
const localServiceKey = readLocalServiceKey();
if (localServiceKey) {
  process.env['SUPABASE_SERVICE_ROLE_KEY'] = localServiceKey.replace(/^['"]|['"]$/g, '');
}

/** RPC-only sportsbook engine E2E — no web UI / no dev servers. */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['sports-engine.spec.ts'],
  outputDir: 'test-results',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: 'http://127.0.0.1:3000',
  },
});
