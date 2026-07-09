#!/usr/bin/env tsx
/**
 * Recover Docker Desktop when the GUI shows N/A but the engine pipe is missing.
 *
 *   bun run stack:docker:recover
 */
import { execSync } from 'node:child_process';
import { isDockerDaemonReady } from './lib/docker-daemon';
import { getDockerDesktopState, recoverDockerDesktopEngine } from './lib/docker-desktop-lifecycle';

function sleepMs(ms: number): void {
  execSync(
    process.platform === 'win32'
      ? `powershell -NoProfile -Command "Start-Sleep -Milliseconds ${ms}"`
      : `sleep ${Math.ceil(ms / 1000)}`,
    { stdio: 'ignore' },
  );
}

function main(): void {
  const before = getDockerDesktopState();
  process.stdout.write(`[stack:docker:recover] before: ${before}\n`);

  if (before === 'engine_ready') {
    process.stdout.write('[stack:docker:recover] engine already ready — nothing to do\n');
    return;
  }

  if (before === 'not_installed') {
    process.stderr.write('[stack:docker:recover] Docker Desktop not installed\n');
    process.exit(1);
  }

  recoverDockerDesktopEngine({ quiet: false });

  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (isDockerDaemonReady()) {
      process.stdout.write(
        `[stack:docker:recover] OK — engine ready (${getDockerDesktopState()})\n`,
      );
      return;
    }
    sleepMs(3000);
  }

  process.stderr.write(
    '[stack:docker:recover] FAIL — engine still not ready after 180s. ' +
      'Quit Docker from tray manually, run `wsl --shutdown`, reopen Docker Desktop.\n',
  );
  process.exit(1);
}

main();
