import { execSync, spawnSync } from 'node:child_process';

const DOCKER_DESKTOP_PATHS_WIN = [
  `${process.env.ProgramFiles ?? 'C:\\Program Files'}\\Docker\\Docker\\Docker Desktop.exe`,
  `${process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'}\\Docker\\Docker\\Docker Desktop.exe`,
] as const;

export function isDockerDaemonReady(): boolean {
  const probe = spawnSync('docker', ['info'], { stdio: 'ignore' });
  return probe.status === 0;
}

function startDockerDesktopWindows(): boolean {
  for (const exe of DOCKER_DESKTOP_PATHS_WIN) {
    try {
      execSync(
        `powershell -NoProfile -Command "Start-Process -FilePath '${exe.replace(/'/g, "''")}'"`,
        { stdio: 'ignore' },
      );
      return true;
    } catch {
      // try next path
    }
  }
  return false;
}

function sleep(ms: number): void {
  execSync(
    process.platform === 'win32'
      ? `powershell -NoProfile -Command "Start-Sleep -Milliseconds ${ms}"`
      : `sleep ${Math.ceil(ms / 1000)}`,
    { stdio: 'ignore' },
  );
}

export type EnsureDockerOptions = {
  startDesktop?: boolean;
  timeoutMs?: number;
  quiet?: boolean;
};

/** Wait until `docker info` succeeds. On Windows, optionally launches Docker Desktop. */
export function ensureDockerReady(options: EnsureDockerOptions = {}): void {
  const { startDesktop = true, timeoutMs = 180_000, quiet = false } = options;

  if (isDockerDaemonReady()) {
    if (!quiet) process.stdout.write('[stack:docker] daemon ready\n');
    return;
  }

  if (process.platform === 'win32' && startDesktop) {
    if (!quiet) process.stdout.write('[stack:docker] starting Docker Desktop…\n');
    if (!startDockerDesktopWindows()) {
      throw new Error(
        '[stack:docker] Docker Desktop not found. Install Docker Desktop for Windows.',
      );
    }
  } else if (!startDesktop) {
    throw new Error('[stack:docker] daemon not running (startDesktop=false)');
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
      'start Docker Desktop manually, wait until it is idle, then re-run E2E/SQL. ' +
      '(Auto-launch is disabled on low-spec PCs — see 79-low-spec-pc.mdc)',
  );
}
