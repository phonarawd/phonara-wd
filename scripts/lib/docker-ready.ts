import { execSync } from 'node:child_process';
import {
  dockerAutoStartEnabled,
  getDockerDesktopState,
  recoverDockerDesktopEngine,
  startDockerDesktopWindows,
} from './docker-desktop-lifecycle';
import { isDockerDaemonReady } from './docker-daemon';
import { isLocalSupabaseRunning } from './supabase-local';

export { isDockerDaemonReady } from './docker-daemon';

export type EnsureDockerOptions = {
  startDesktop?: boolean;
  timeoutMs?: number;
  quiet?: boolean;
};

function sleep(ms: number): void {
  execSync(
    process.platform === 'win32'
      ? `powershell -NoProfile -Command "Start-Sleep -Milliseconds ${ms}"`
      : `sleep ${Math.ceil(ms / 1000)}`,
    { stdio: 'ignore' },
  );
}

/** Wait until `docker info` succeeds. On Windows, optionally launches Docker Desktop. */
export function ensureDockerReady(options: EnsureDockerOptions = {}): void {
  const startDesktop =
    options.startDesktop ?? (process.platform === 'win32' && dockerAutoStartEnabled());
  const { timeoutMs = 180_000, quiet = false } = options;

  if (isDockerDaemonReady()) {
    if (!quiet) process.stdout.write('[stack:docker] daemon ready\n');
    return;
  }

  // Local Supabase is up — stack bootstrap already succeeded (CI or prior start).
  if (isLocalSupabaseRunning()) {
    if (!quiet) {
      process.stdout.write('[stack:docker] supabase stack running — skip daemon gate\n');
    }
    return;
  }

  const desktopState = getDockerDesktopState();
  if (desktopState === 'zombie_ui') {
    if (!quiet) {
      process.stdout.write(
        '[stack:docker] zombie UI detected (Docker open but engine N/A) — recovering…\n',
      );
    }
    recoverDockerDesktopEngine({ quiet });
  } else if (process.platform === 'win32' && startDesktop) {
    if (!quiet)
      process.stdout.write('[stack:docker] on-demand start — launching Docker Desktop…\n');
    if (!startDockerDesktopWindows({ quiet })) {
      throw new Error(
        '[stack:docker] Docker Desktop not found. Install Docker Desktop for Windows.',
      );
    }
  } else if (!startDesktop) {
    const hint =
      process.platform === 'win32'
        ? 'start Docker Desktop manually, or set PHONARA_DOCKER_AUTO_START=1 (default) and re-run E2E/SQL.'
        : 'start the Docker daemon or run `supabase start` before E2E/SQL.';
    throw new Error(`[stack:docker] daemon not running — ${hint}`);
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (isDockerDaemonReady()) {
      if (!quiet) process.stdout.write('[stack:docker] daemon ready\n');
      return;
    }
    sleep(3_000);
  }

  throw new Error(
    `[stack:docker] daemon not ready after ${Math.round(timeoutMs / 1000)}s — ` +
      'run: bun run stack:docker:recover · wait until Docker Desktop is idle, then re-run E2E/SQL. ' +
      '(On-demand auto-start: PHONARA_DOCKER_AUTO_START=1 · see 84-docker-on-demand.mdc)',
  );
}
