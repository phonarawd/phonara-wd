import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { E2E_PORTS, getListeningPids } from './e2e-lifecycle';
import { PROCESS_CACHE_TTL_MS, withProcessCache } from './win-process-cache';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Match repo path on Windows (case-insensitive) and POSIX. */
const REPO_PATH_PATTERN = REPO_ROOT.replace(/\\/g, '\\\\');
const REPO_SLUG = 'phonara-gb';

/** Hung dev servers, gates, and agent background shells tied to this repo. */
const ORPHAN_PATTERNS = [
  /vitest/i,
  /playwright/i,
  /test:e2e/i,
  /run-e2e\.ts/i,
  /run-full-gate/i,
  /node_modules[\\/]@playwright/i,
  /node_modules[\\/]vitest[\\/]vitest\.mjs/i,
  /node_modules[\\/]\.bun[\\/]tsx/i,
  /e2e-dev-server/i,
  /dev:web/i,
  /dev:admin/i,
  /\bbun\s+--filter\s+@phonara\/(web|admin)\s+dev\b/i,
  /\bvite\b/i,
  /apps[\\/]web[\\/]node_modules[\\/]vite/i,
  /apps[\\/]admin[\\/]node_modules[\\/]vite/i,
  /check:full/i,
  /build:packages/i,
  /packages\/game-engine/i,
  /packages\\game-engine/i,
  /Tee-Object/i,
  /check-full-log/i,
];

const PROTECTED_PATTERNS = [
  /tsserver/i,
  /cursor[\\/]resources/i,
  /cursor-dev-processes/i,
  /cursor-kill-orphans/i,
  /cursor-session-hygiene/i,
  /cursor-emergency-reset/i,
  /cursor-status/i,
  /cursor-hook/i,
  /e2e-kill/i,
  /clean-artifacts/i,
  /cursor-clean-metadata/i,
  /cursor-preflight/i,
  /sync-cursor-archival/i,
];

export interface RepoDevProcess {
  pid: number;
  name: string;
  commandLine: string;
}

function isRepoCommandLine(commandLine: string): boolean {
  const normalized = commandLine.toLowerCase();
  const repoLower = REPO_ROOT.toLowerCase();
  return (
    normalized.includes(REPO_SLUG) ||
    normalized.includes(repoLower) ||
    new RegExp(REPO_PATH_PATTERN, 'i').test(commandLine)
  );
}

function isOrphanCandidate(commandLine: string): boolean {
  if (PROTECTED_PATTERNS.some((pattern) => pattern.test(commandLine))) {
    return false;
  }
  return ORPHAN_PATTERNS.some((pattern) => pattern.test(commandLine));
}

function killPidTree(pid: number): void {
  if (pid <= 0 || pid === process.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore', timeout: 8_000 });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
  } catch {
    // Already exited.
  }
}

function parentPid(pid: number): number | null {
  try {
    if (process.platform === 'win32') {
      const raw = execSync(
        `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\").ParentProcessId"`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5_000 },
      ).trim();
      const parsed = Number.parseInt(raw, 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    const raw = execSync(`ps -o ppid= -p ${pid}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5_000,
    }).trim();
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function currentProcessTreePids(): Set<number> {
  const protectedPids = new Set<number>([process.pid]);
  let cursor: number | null = process.pid;
  for (let depth = 0; depth < 16 && cursor; depth += 1) {
    const parent = parentPid(cursor);
    if (!parent || protectedPids.has(parent)) break;
    protectedPids.add(parent);
    cursor = parent;
  }
  return protectedPids;
}

function windowsCommandLine(pid: number): string {
  try {
    const raw = execSync(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\").CommandLine"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5_000 },
    ).trim();
    return raw;
  } catch {
    return '';
  }
}

function listWindowsProcesses(): RepoDevProcess[] {
  const repoFilter = REPO_SLUG.replace(/'/g, "''");
  // Win32_Process -Filter does not support OR — query node/bun separately (low-spec safe).
  // Semicolon-separated one-liner — space join after `@()` is invalid PowerShell.
  const ps = [
    '$rows = @()',
    "foreach ($name in @('node.exe','bun.exe')) {",
    '  Get-CimInstance Win32_Process -Filter ("Name=\'" + $name + "\'")',
    `  | Where-Object { $_.CommandLine -like '*${repoFilter}*' }`,
    '  | ForEach-Object { $rows += $_ }',
    '}',
    '$rows | ForEach-Object { [PSCustomObject]@{',
    '  ProcessId = $_.ProcessId;',
    '  Name = $_.Name;',
    '  CommandLine = $_.CommandLine',
    '} }',
    '| ConvertTo-Json -Compress',
  ].join('; ');

  try {
    const raw = execSync(`powershell -NoProfile -Command "${ps}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 20_000,
    }).trim();
    if (!raw) return [];

    const parsed = JSON.parse(raw) as
      | { ProcessId: number; Name: string; CommandLine?: string }
      | Array<{ ProcessId: number; Name: string; CommandLine?: string }>;

    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows
      .filter((row) => row.CommandLine && isRepoCommandLine(row.CommandLine))
      .map((row) => ({
        pid: row.ProcessId,
        name: row.Name,
        commandLine: row.CommandLine ?? '',
      }));
  } catch {
    return [];
  }
}

/** Repo dev listeners on E2E ports — catches orphan Vite even when CIM listing flakes. */
function listRepoE2ePortListeners(): RepoDevProcess[] {
  const seen = new Set<number>();
  const results: RepoDevProcess[] = [];

  for (const port of E2E_PORTS) {
    for (const pid of getListeningPids(port)) {
      if (seen.has(pid)) continue;
      seen.add(pid);

      const commandLine = process.platform === 'win32' ? windowsCommandLine(pid) : '';
      if (commandLine && !isRepoCommandLine(commandLine)) continue;
      if (commandLine && !isOrphanCandidate(commandLine)) continue;

      results.push({
        pid,
        name: process.platform === 'win32' ? 'node.exe' : 'process',
        commandLine: commandLine || `LISTEN :${port} pid=${pid}`,
      });
    }
  }

  return results;
}

function listUnixProcesses(): RepoDevProcess[] {
  try {
    const raw = execSync('ps -ax -o pid=,command=', { encoding: 'utf8' });
    const results: RepoDevProcess[] = [];
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const space = trimmed.indexOf(' ');
      if (space <= 0) continue;
      const pid = Number.parseInt(trimmed.slice(0, space), 10);
      const commandLine = trimmed.slice(space + 1);
      if (!Number.isFinite(pid) || !isRepoCommandLine(commandLine)) continue;
      results.push({ pid, name: 'process', commandLine });
    }
    return results;
  } catch {
    return [];
  }
}

export function listRepoDevProcesses(): RepoDevProcess[] {
  if (process.platform !== 'win32') {
    return listUnixProcesses();
  }
  return withProcessCache(PROCESS_CACHE_TTL_MS, listWindowsProcesses);
}

export function listOrphanRepoDevProcesses(): RepoDevProcess[] {
  const byPid = new Map<number, RepoDevProcess>();

  for (const proc of listRepoDevProcesses()) {
    if (isOrphanCandidate(proc.commandLine)) {
      byPid.set(proc.pid, proc);
    }
  }

  for (const proc of listRepoE2ePortListeners()) {
    if (!byPid.has(proc.pid)) {
      byPid.set(proc.pid, proc);
    }
  }

  return [...byPid.values()];
}

/** Stop hung vitest/playwright/E2E workers tied to this repo. Never touches Cursor tsserver. */
export function killOrphanRepoDevProcesses(): number {
  const protectedPids = currentProcessTreePids();
  const orphans = listOrphanRepoDevProcesses().filter((orphan) => !protectedPids.has(orphan.pid));
  for (const orphan of orphans) {
    killPidTree(orphan.pid);
  }
  return orphans.length;
}

export function countActiveHeavyRepoShells(): number {
  const orphans = listOrphanRepoDevProcesses();
  const blockedPorts = E2E_PORTS.filter((port) => getListeningPids(port).length > 0);
  return orphans.length + blockedPorts.length;
}
