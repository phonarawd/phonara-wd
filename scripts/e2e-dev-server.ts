import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirePackagesDistOrExit } from './lib/ensure-packages-built';
import { spawnSafe, resolveBunExe } from './lib/spawn-safe';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const app = process.argv[2];
const port = process.argv[3];

if ((app !== 'web' && app !== 'admin') || !port) {
  process.stderr.write('Usage: tsx scripts/e2e-dev-server.ts <web|admin> <port>\n');
  process.exit(1);
}

// pretest:e2e builds once; web+admin servers must not each run tsc --force in parallel.
requirePackagesDistOrExit();

const serverEnv: NodeJS.ProcessEnv = { ...process.env };

const appDir = app === 'web' ? join(repoRoot, 'apps/web') : join(repoRoot, 'apps/admin');

const server = spawnSafe(
  resolveBunExe(),
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', port, '--strictPort'],
  {
    cwd: appDir,
    stdio: 'inherit',
    env: serverEnv,
  },
);

let intentionalStop = false;

const stop = (): void => {
  intentionalStop = true;
  if (!server.killed) server.kill('SIGTERM');
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

server.once('exit', (code, signal) => {
  if (intentionalStop || signal === 'SIGTERM' || signal === 'SIGINT') {
    process.exit(0);
    return;
  }
  process.exit(code ?? 0);
});
server.once('error', (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
