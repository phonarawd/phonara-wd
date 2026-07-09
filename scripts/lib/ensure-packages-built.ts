import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sleepMs, spawnSyncSafe } from './spawn-safe';

const CACHE_DIR = join(process.cwd(), 'node_modules', '.cache', 'phonara-e2e');
const LOCK_FILE = join(CACHE_DIR, 'build-packages.lock');
const DIST_MARKERS = [
  join(process.cwd(), 'packages/money/dist/index.js'),
  join(process.cwd(), 'packages/i18n/dist/index.js'),
] as const;

function distReady(): boolean {
  return DIST_MARKERS.every((path) => existsSync(path));
}

function sleepSync(ms: number): void {
  sleepMs(ms);
}

function runBuildPackages(): void {
  const result = spawnSyncSafe('bun', ['run', 'build:packages'], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/**
 * Build packages once before E2E. Uses a simple lock so parallel webServer
 * starters on low-spec PCs do not run duplicate `tsc -b --force` builds.
 */
export function ensurePackagesBuiltForE2e(options: { quiet?: boolean } = {}): void {
  if (distReady()) return;

  mkdirSync(CACHE_DIR, { recursive: true });

  let acquired = false;
  for (let attempt = 0; attempt < 180; attempt += 1) {
    if (distReady()) return;
    try {
      writeFileSync(LOCK_FILE, String(process.pid), { flag: 'wx' });
      acquired = true;
      break;
    } catch {
      if (distReady()) return;
      sleepSync(500);
    }
  }

  if (!acquired) {
    if (distReady()) return;
    throw new Error('[e2e] timed out waiting for packages build lock');
  }

  try {
    if (!distReady()) {
      if (!options.quiet) {
        process.stdout.write(
          '[e2e] building packages once (low-spec: no parallel webServer builds)\n',
        );
      }
      runBuildPackages();
    }
  } finally {
    try {
      rmSync(LOCK_FILE, { force: true });
    } catch {
      // lock may already be gone
    }
  }
}

export function requirePackagesDistOrExit(): void {
  if (distReady()) return;
  process.stderr.write(
    '[e2e-dev-server] packages dist missing — run `bun run build:packages` or `bun run test:e2e` (pretest builds once)\n',
  );
  process.exit(1);
}
