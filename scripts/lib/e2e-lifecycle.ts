import { execSync, spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { EPHEMERAL_AUTH_PATHS } from './workspace-artifacts';

/** Dev/preview ports used by Playwright webServer configs — must be free after E2E. */
export const E2E_PORTS = [3000, 3001, 3002] as const;

export interface FinalizeE2eOptions {
  /** Kill listeners on E2E ports (default true). */
  killPorts?: boolean;
  /** Run clean:artifacts (default true). */
  cleanArtifacts?: boolean;
  /** Remove ephemeral E2E auth token files (default true). */
  removeAuthTokens?: boolean;
}

function getListeningPids(port: number): number[] {
  if (process.platform === 'win32') {
    try {
      const out = execSync('netstat -ano', { encoding: 'utf8' });
      const pids = new Set<number>();
      const portPattern = new RegExp(`:${port}\\s`);
      for (const line of out.split('\n')) {
        if (!line.includes('LISTENING') || !portPattern.test(line)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = Number.parseInt(parts.at(-1) ?? '', 10);
        if (Number.isFinite(pid) && pid > 0) pids.add(pid);
      }
      return [...pids];
    } catch {
      return [];
    }
  }

  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    if (!out) return [];
    return out
      .split('\n')
      .map((value) => Number.parseInt(value, 10))
      .filter((pid) => Number.isFinite(pid) && pid > 0);
  } catch {
    return [];
  }
}

function killPid(pid: number): void {
  if (pid === process.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore' });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
  } catch {
    // Process may already have exited.
  }
}

/** Stop orphan Vite/dev/preview listeners left after interrupted E2E runs. */
export function killE2ePortListeners(): number {
  const ownPid = process.pid;
  let killed = 0;
  for (const port of E2E_PORTS) {
    for (const pid of getListeningPids(port)) {
      if (pid === ownPid) continue;
      killPid(pid);
      killed += 1;
    }
  }
  return killed;
}

function removeEphemeralAuthFiles(): number {
  let removed = 0;
  for (const path of EPHEMERAL_AUTH_PATHS) {
    if (!existsSync(path)) continue;
    rmSync(path, { force: true });
    removed += 1;
  }
  return removed;
}

function runCleanArtifacts(): void {
  spawnSync('bun', ['run', 'clean:artifacts'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

/**
 * Full E2E session finalization: kill port listeners, remove auth tokens,
 * sweep Playwright/build residue. Safe to call multiple times.
 */
export async function finalizeE2eSession(options: FinalizeE2eOptions = {}): Promise<void> {
  const killPorts = options.killPorts ?? true;
  const cleanArtifacts = options.cleanArtifacts ?? true;
  const removeAuthTokens = options.removeAuthTokens ?? true;

  if (killPorts) {
    const killed = killE2ePortListeners();
    if (killed > 0) {
      process.stdout.write(`[e2e] killed ${killed} listener process(es) on E2E ports\n`);
    }
  }

  if (removeAuthTokens) {
    const removed = removeEphemeralAuthFiles();
    if (removed > 0) {
      process.stdout.write(`[e2e] removed ${removed} ephemeral auth file(s)\n`);
    }
  }

  if (cleanArtifacts) {
    runCleanArtifacts();
  }
}

/** Returns ports that still have a LISTENING socket (should be empty after finalize). */
export function getBlockedE2ePorts(): number[] {
  return E2E_PORTS.filter((port) => getListeningPids(port).length > 0);
}
