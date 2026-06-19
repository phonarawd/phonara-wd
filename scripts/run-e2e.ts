import { spawn } from 'node:child_process';
import {
  finalizeE2eSession,
  getBlockedE2ePorts,
} from './lib/e2e-lifecycle';
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { readLocalSupabaseEnv } from './lib/db-connect';

// Playwright globalSetup imports tests/e2e/_helpers at load time — inject local
// stack keys here so E2E never depends on remote .env SERVICE_ROLE against 127.0.0.1.
loadRepoEnvFiles();
const localSupabase = readLocalSupabaseEnv();
if (localSupabase) {
  process.env['VITE_SUPABASE_URL'] = localSupabase.VITE_SUPABASE_URL;
  process.env['VITE_SUPABASE_ANON_KEY'] = localSupabase.VITE_SUPABASE_ANON_KEY;
  process.env['SUPABASE_SERVICE_ROLE_KEY'] = localSupabase.SUPABASE_SERVICE_ROLE_KEY;
}

const playwrightArgs = process.argv.slice(2);
let exitCode = 1;
let teardownDone = false;

async function teardown(reason: string): Promise<void> {
  if (teardownDone) return;
  teardownDone = true;
  process.stdout.write(`[e2e] finalizing session (${reason})…\n`);
  await finalizeE2eSession();
  const blocked = getBlockedE2ePorts();
  if (blocked.length > 0) {
    process.stderr.write(
      `[e2e] WARNING: ports still in use after teardown: ${blocked.join(', ')}\n` +
        'Run: bun run e2e:kill\n',
    );
  } else {
    process.stdout.write('[e2e] session finalized — ports free, artifacts cleaned\n');
  }
}

function onSignal(signal: 'SIGINT' | 'SIGTERM'): void {
  teardown(signal).finally(() => {
    process.exit(signal === 'SIGINT' ? 130 : 143);
  });
}

process.once('SIGINT', () => onSignal('SIGINT'));
process.once('SIGTERM', () => onSignal('SIGTERM'));

const child = spawn('bunx', ['playwright', 'test', ...playwrightArgs], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.once('error', (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  teardown('spawn error').finally(() => process.exit(1));
});

child.once('exit', (code, signal) => {
  exitCode = code ?? (signal ? 1 : 0);
  const reason = signal ?? `exit ${code ?? 0}`;
  teardown(reason).finally(() => process.exit(exitCode));
});
