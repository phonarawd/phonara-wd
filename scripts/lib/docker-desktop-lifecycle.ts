/**
 * Docker Desktop on-demand lifecycle (Windows low-spec).
 * ON: pretest:e2e / pretest:sql / stack:ensure --full (when auto-start enabled)
 * OFF: posttest stack:stop (when auto-quit enabled)
 *
 * Zombie UI: after `wsl --shutdown` the Desktop tray/GUI can stay open while the
 * Linux engine pipe (`dockerDesktopLinuxEngine`) is gone — Docker UI shows N/A.
 * Use `docker desktop start` or `bun run stack:docker:recover`.
 *
 * Escape hatches:
 *   PHONARA_DOCKER_AUTO_START=0  — never launch Desktop; operator starts manually
 *   PHONARA_DOCKER_AUTO_QUIT=0   — keep Desktop running after stack:stop
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { isDockerDaemonReady } from './docker-daemon';

const DOCKER_DESKTOP_PATHS_WIN = [
  `${process.env.ProgramFiles ?? 'C:\\Program Files'}\\Docker\\Docker\\Docker Desktop.exe`,
  `${process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'}\\Docker\\Docker\\Docker Desktop.exe`,
] as const;

const DOCKER_DESKTOP_PROCESS_NAMES = [
  'Docker Desktop',
  'com.docker.backend',
  'com.docker.build',
  'com.docker.service',
] as const;

export type DockerDesktopState = 'engine_ready' | 'engine_off' | 'zombie_ui' | 'not_installed';

/** Quit path for stack:stop / cursor:idle — avoids 60s+ quit when already idle. */
export type DockerQuitStrategy = 'skip' | 'zombie_cleanup' | 'full_quit';

export function resolveDockerQuitStrategy(state: DockerDesktopState): DockerQuitStrategy {
  if (state === 'engine_off' || state === 'not_installed') return 'skip';
  if (state === 'zombie_ui') return 'zombie_cleanup';
  return 'full_quit';
}

function envFlag(name: string, defaultWhenUnset: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultWhenUnset;
  return raw !== '0' && raw.toLowerCase() !== 'false';
}

/** Default ON — only pretest --full paths call ensureDockerReady with this. */
export function dockerAutoStartEnabled(): boolean {
  return envFlag('PHONARA_DOCKER_AUTO_START', true);
}

/** Default ON on Windows — releases WSL VM RAM after E2E/SQL. */
export function dockerAutoQuitEnabled(): boolean {
  if (process.platform !== 'win32') return false;
  return envFlag('PHONARA_DOCKER_AUTO_QUIT', true);
}

export function resolveDockerDesktopExe(): string | null {
  for (const exe of DOCKER_DESKTOP_PATHS_WIN) {
    if (existsSync(exe)) return exe;
  }
  return null;
}

/** Pure classifier for tests — maps probe inputs to lifecycle state. */
export function classifyDockerDesktopState(input: {
  installed: boolean;
  daemonReady: boolean;
  uiRunning: boolean;
}): DockerDesktopState {
  if (!input.installed) return 'not_installed';
  if (input.daemonReady) return 'engine_ready';
  if (input.uiRunning) return 'zombie_ui';
  return 'engine_off';
}

export function isDockerDesktopProcessRunning(): boolean {
  if (process.platform !== 'win32') return false;
  const names = DOCKER_DESKTOP_PROCESS_NAMES.map((n) => `'${n.replace(/'/g, "''")}'`).join(',');
  try {
    const raw = execSync(
      `powershell -NoProfile -Command "(Get-Process -Name ${names} -ErrorAction SilentlyContinue | Measure-Object).Count"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 8_000 },
    ).trim();
    return Number.parseInt(raw, 10) > 0;
  } catch {
    return false;
  }
}

export function getDockerDesktopState(): DockerDesktopState {
  const installed = resolveDockerDesktopExe() !== null;
  if (!installed) return 'not_installed';

  const uiRunning = isDockerDesktopProcessRunning();
  // Docker OFF — skip `docker info` (3s hang on low-spec when engine pipe is gone).
  if (!uiRunning) {
    return 'engine_off';
  }

  return classifyDockerDesktopState({
    installed: true,
    daemonReady: isDockerDaemonReady(),
    uiRunning: true,
  });
}

function sleepMs(ms: number): void {
  execSync(
    process.platform === 'win32'
      ? `powershell -NoProfile -Command "Start-Sleep -Milliseconds ${ms}"`
      : `sleep ${Math.ceil(ms / 1000)}`,
    { stdio: 'ignore' },
  );
}

function dockerDesktopCliOutput(args: string[], timeoutMs: number): { ok: boolean; text: string } {
  const result = spawnSync('docker', ['desktop', ...args], {
    encoding: 'utf8',
    timeout: timeoutMs,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const text = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return { ok: result.status === 0, text };
}

export function startDockerDesktopCli(options: { quiet?: boolean } = {}): boolean {
  const { quiet = false } = options;
  const { ok, text } = dockerDesktopCliOutput(['start'], 90_000);
  if (
    ok ||
    /Starting Docker Desktop|Docker Desktop is already running|already running/i.test(text)
  ) {
    if (!quiet) process.stdout.write('[stack:docker] `docker desktop start` invoked\n');
    return true;
  }
  if (!quiet && text) process.stderr.write(`[stack:docker] docker desktop start: ${text}\n`);
  return false;
}

export function stopDockerDesktopCli(options: { quiet?: boolean } = {}): boolean {
  const { quiet = false } = options;
  const { ok, text } = dockerDesktopCliOutput(['stop'], 60_000);
  if (ok || /Docker Desktop is not running|not running/i.test(text)) {
    if (!quiet) process.stdout.write('[stack:docker] `docker desktop stop` complete\n');
    return true;
  }
  if (!quiet && text) process.stderr.write(`[stack:docker] docker desktop stop: ${text}\n`);
  return false;
}

export function forceKillDockerDesktopProcesses(options: { quiet?: boolean } = {}): boolean {
  const { quiet = false } = options;
  if (process.platform !== 'win32') return false;
  if (!isDockerDesktopProcessRunning()) return true;

  if (!quiet) {
    process.stdout.write('[stack:docker] force-stopping orphaned Docker Desktop processes…\n');
  }

  const names = DOCKER_DESKTOP_PROCESS_NAMES.map((n) => `'${n.replace(/'/g, "''")}'`).join(',');
  try {
    execSync(
      `powershell -NoProfile -Command "Get-Process -Name ${names} -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"`,
      { stdio: 'ignore', timeout: 15_000 },
    );
  } catch {
    return false;
  }

  sleepMs(1500);
  return !isDockerDesktopProcessRunning();
}

export function startDockerDesktopWindows(options: { quiet?: boolean } = {}): boolean {
  const { quiet = false } = options;
  const state = getDockerDesktopState();

  if (state === 'zombie_ui') {
    recoverDockerDesktopEngine(options);
    return true;
  }

  if (startDockerDesktopCli(options)) {
    return true;
  }

  const exe = resolveDockerDesktopExe();
  if (!exe) return false;
  try {
    execSync(
      `powershell -NoProfile -Command "Start-Process -FilePath '${exe.replace(/'/g, "''")}'"`,
      { stdio: 'ignore' },
    );
    if (!quiet) process.stdout.write('[stack:docker] Docker Desktop.exe launched\n');
    return true;
  } catch {
    return false;
  }
}

/**
 * Recover zombie UI (tray open, engine pipe missing, Docker UI shows N/A).
 * Order: stop CLI → -Quit → force-kill UI → wsl shutdown → docker desktop start.
 */
export function recoverDockerDesktopEngine(options: { quiet?: boolean } = {}): void {
  const { quiet = false } = options;
  if (!quiet) {
    process.stdout.write(
      '[stack:docker] recovering engine (zombie UI: GUI open but dockerDesktopLinuxEngine missing)…\n',
    );
  }

  stopDockerDesktopCli({ quiet: true });
  quitDockerDesktopWindows({ quiet: true });
  forceKillDockerDesktopProcesses({ quiet: true });

  if (process.platform === 'win32') {
    wslShutdownWindows({ quiet: true });
    sleepMs(2000);
  }

  if (!startDockerDesktopCli({ quiet: true })) {
    const exe = resolveDockerDesktopExe();
    if (exe) {
      try {
        execSync(
          `powershell -NoProfile -Command "Start-Process -FilePath '${exe.replace(/'/g, "''")}'"`,
          { stdio: 'ignore' },
        );
      } catch {
        // wait loop in ensureDockerReady / stack-docker-recover will surface failure
      }
    }
  }
}

export function quitDockerDesktopWindows(options: { quiet?: boolean } = {}): boolean {
  const { quiet = false } = options;
  const exe = resolveDockerDesktopExe();
  if (!exe) {
    if (!quiet) process.stdout.write('[stack:docker] Docker Desktop not installed — skip quit\n');
    return false;
  }

  if (!quiet)
    process.stdout.write('[stack:docker] quitting Docker Desktop (WSL VM RAM release)…\n');

  stopDockerDesktopCli({ quiet: true });

  try {
    execSync(
      `powershell -NoProfile -Command "Start-Process -FilePath '${exe.replace(/'/g, "''")}' -ArgumentList '-Quit' -Wait"`,
      { stdio: 'ignore', timeout: 30_000 },
    );
  } catch {
    // Fall through — verify daemon stopped.
  }

  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (!isDockerDaemonReady()) {
      if (!quiet) process.stdout.write('[stack:docker] Docker engine stopped\n');
      return true;
    }
    sleepMs(2000);
  }

  if (!quiet) {
    process.stdout.write(
      '[stack:docker] engine still up — trying wsl --shutdown + force-kill for vmmem release\n',
    );
  }
  return false;
}

export function wslShutdownWindows(options: { quiet?: boolean } = {}): boolean {
  const { quiet = false } = options;
  if (process.platform !== 'win32') return false;
  if (!quiet) {
    process.stdout.write(
      '[stack:docker] wsl --shutdown (release vmmem when Docker quit incomplete)…\n',
    );
  }
  try {
    execSync('wsl --shutdown', { stdio: 'ignore', timeout: 30_000 });
    if (!quiet) process.stdout.write('[stack:docker] WSL VM stopped\n');
    return true;
  } catch {
    if (!quiet)
      process.stdout.write(
        '[stack:docker] wsl --shutdown failed — run manually if vmmem persists\n',
      );
    return false;
  }
}

export function quitDockerDesktopAndReleaseWsl(options: { quiet?: boolean } = {}): void {
  const { quiet = false } = options;
  const strategy = resolveDockerQuitStrategy(getDockerDesktopState());

  if (strategy === 'skip') {
    if (!quiet) {
      process.stdout.write('[stack:docker] already OFF — skip quit/wsl shutdown\n');
    }
    return;
  }

  if (strategy === 'zombie_cleanup') {
    if (!quiet) {
      process.stdout.write(
        '[stack:docker] zombie UI — force-stop + wsl release (engine already off)\n',
      );
    }
    forceKillDockerDesktopProcesses(options);
    if (process.platform === 'win32') {
      wslShutdownWindows(options);
    }
    return;
  }

  quitDockerDesktopWindows(options);
  if (process.platform === 'win32') {
    wslShutdownWindows(options);
    // Prevent zombie UI: tray stays open after wsl shutdown while engine pipe is gone.
    forceKillDockerDesktopProcesses(options);
  }
}

export type WslConfigRecommendation = {
  memoryGb: number;
  processors: number;
  swapGb: number;
};

export function recommendedWslConfig(): WslConfigRecommendation {
  return { memoryGb: 4, processors: 4, swapGb: 2 };
}

export function wslConfigPath(): string {
  return path.join(homedir(), '.wslconfig');
}

export function renderWslConfig(rec: WslConfigRecommendation = recommendedWslConfig()): string {
  return [
    '# PHONARA — caps WSL2 VM RAM when Docker Desktop runs (low-spec Windows)',
    '# Apply: bun run stack:docker:setup -- --apply-wslconfig',
    '# Then: wsl --shutdown (or reboot) once',
    '[wsl2]',
    `memory=${rec.memoryGb}GB`,
    `processors=${rec.processors}`,
    `swap=${rec.swapGb}GB`,
    'localhostForwarding=true',
    '',
  ].join('\n');
}
