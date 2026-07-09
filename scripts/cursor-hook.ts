import { spawnSyncSafe } from './lib/spawn-safe';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { countActiveHeavyRepoShells } from './lib/cursor-dev-processes';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type HookKind = 'session-start' | 'session-stop' | 'after-shell' | 'before-shell';

function runHygiene(script: string): void {
  spawnSyncSafe('bun', ['run', script], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
}

const kind = (process.argv[2] ?? '') as HookKind;

switch (kind) {
  case 'session-start':
    runHygiene('cursor:session-start');
    process.stdout.write('{}\n');
    break;

  case 'session-stop':
    spawnSyncSafe('tsx', ['scripts/cursor-session-hygiene.ts', 'agent-stop'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
    process.stdout.write('{}\n');
    break;

  case 'after-shell': {
    runHygiene('cursor:after-heavy-shell');
    process.stdout.write('{}\n');
    break;
  }

  case 'before-shell': {
    runHygiene('cursor:before-heavy-shell');
    const active = countActiveHeavyRepoShells();
    if (active > 0) {
      process.stdout.write(
        JSON.stringify({
          permission: 'allow',
          agent_message:
            'Stale vitest/playwright/E2E processes were cleared before this heavy command. Do not start another heavy gate in parallel.',
        }) + '\n',
      );
    } else {
      process.stdout.write('{ "permission": "allow" }\n');
    }
    break;
  }

  default:
    process.stderr.write(`[cursor:hook] unknown kind: ${kind}\n`);
    process.exit(1);
}
