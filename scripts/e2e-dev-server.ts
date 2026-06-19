import { spawn } from 'node:child_process';
import { requirePackagesDistOrExit } from './lib/ensure-packages-built';

const app = process.argv[2];
const port = process.argv[3];

if ((app !== 'web' && app !== 'admin') || !port) {
  process.stderr.write('Usage: tsx scripts/e2e-dev-server.ts <web|admin> <port>\n');
  process.exit(1);
}

// pretest:e2e builds once; web+admin servers must not each run tsc --force in parallel.
requirePackagesDistOrExit();

function toCommand(parts: string[]): string {
  return parts
    .map((part) => (part.includes(' ') || part.includes('*') ? `"${part.replaceAll('"', '\\"')}"` : part))
    .join(' ');
}

const server = spawn(
  toCommand([
    'bun',
    'run',
    `dev:${app}`,
    '--',
    '--host',
    '127.0.0.1',
    '--port',
    port,
    '--strictPort',
  ]),
  {
    stdio: 'inherit',
    shell: true,
  },
);

const stop = (): void => {
  if (!server.killed) server.kill('SIGTERM');
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

server.once('exit', (code) => {
  process.exit(code ?? 0);
});
server.once('error', (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
