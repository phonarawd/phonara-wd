import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { E2E_PORTS, getListeningPids } from './e2e-lifecycle';
import { PROCESS_CACHE_TTL_MS, withProcessCache } from './win-process-cache';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Match repo path on Windows (case-insensitive) and POSIX. */
const REPO_PATH_PATTERN = REPO_ROOT.replace(/\\/g, '\\\\');
const REPO_SLUG = 'phonara-gb';

/** Playwright/vitest/E2E runners — argv may omit repo slug (DRIFT source at L145). */
const E2E_TOOL_PATTERNS = [/playwright/i, /vitest/i, /test:e2e/i, /run-e2e\.ts/i] as const;

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
  /cursor-gate-diagnosis/i,
  /cursor-high-remediation/i,
  /cursor-perf-rollout/i,
  /cursor-standby-test/i,
  /perf-rollout-core/i,
  /empty-standby-core/i,
  /cursor-tsserver-observe/i,
  /tsserver-observe-core/i,
  /high-remediation-core/i,
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

export function isRepoScopedCommandLine(commandLine: string): boolean {
  const normalized = commandLine.toLowerCase();
  const repoLower = REPO_ROOT.toLowerCase();
  return (
    normalized.includes(REPO_SLUG) ||
    normalized.includes(repoLower) ||
    new RegExp(REPO_PATH_PATTERN, 'i').test(commandLine)
  );
}

export function isE2eToolCommandLine(commandLine: string): boolean {
  return E2E_TOOL_PATTERNS.some((pattern) => pattern.test(commandLine));
}

export function isOrphanPatternCommandLine(commandLine: string): boolean {
  if (PROTECTED_PATTERNS.some((pattern) => pattern.test(commandLine))) {
    return false;
  }
  return ORPHAN_PATTERNS.some((pattern) => pattern.test(commandLine));
}

export function collectE2ePortPids(
  ports: readonly number[] = E2E_PORTS,
  getPids: (port: number) => number[] = getListeningPids,
): Set<number> {
  const pids = new Set<number>();
  for (const port of ports) {
    for (const pid of getPids(port)) {
      pids.add(pid);
    }
  }
  return pids;
}

export function isInProcessTreeOf(
  pid: number,
  rootPids: ReadonlySet<number>,
  resolveParent: (pid: number) => number | null = parentPid,
): boolean {
  if (rootPids.has(pid)) return true;
  let cursor: number | null = pid;
  for (let depth = 0; depth < 24 && cursor; depth += 1) {
    const parent = resolveParent(cursor);
    if (!parent) return false;
    if (rootPids.has(parent)) return true;
    cursor = parent;
  }
  return false;
}

/** E2E tool without repo slug — only when tied to an E2E port listener tree. */
export function qualifiesE2eToolOrphanWithoutRepoSlug(
  commandLine: string,
  pid: number,
  e2ePortPids: ReadonlySet<number>,
  resolveParent: (pid: number) => number | null = parentPid,
): boolean {
  if (!isE2eToolCommandLine(commandLine) || !isOrphanPatternCommandLine(commandLine)) {
    return false;
  }
  return e2ePortPids.has(pid) || isInProcessTreeOf(pid, e2ePortPids, resolveParent);
}

export function shouldIncludeWindowsProcessRow(
  commandLine: string,
  pid: number,
  e2ePortPids: ReadonlySet<number>,
  resolveParent: (pid: number) => number | null = parentPid,
): boolean {
  if (!commandLine) return false;
  if (isRepoScopedCommandLine(commandLine)) return true;
  return qualifiesE2eToolOrphanWithoutRepoSlug(commandLine, pid, e2ePortPids, resolveParent);
}

export interface OrphanListingDriftReport {
  drift_detected: boolean;
  missed_pids: number[];
}

/** Flags orphan=0 while Playwright/vitest PIDs remain on E2E ports (listing DRIFT). */
export function detectOrphanListingDrift(
  orphanCount: number,
  e2eToolPidsOnPorts: readonly number[],
  listedOrphanPids: ReadonlySet<number>,
): OrphanListingDriftReport {
  const missed = e2eToolPidsOnPorts.filter((pid) => !listedOrphanPids.has(pid));
  const drift_detected = missed.length > 0 || (orphanCount === 0 && e2eToolPidsOnPorts.length > 0);
  return { drift_detected, missed_pids: missed };
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
  const e2ePortPids = collectE2ePortPids();
  // Win32_Process -Filter does not support OR — query node/bun separately (low-spec safe).
  // Broaden beyond *phonara-gb* — Playwright/vitest argv often omits repo slug (DRIFT fix).
  const ps = [
    '$rows = @()',
    "foreach ($name in @('node.exe','bun.exe')) {",
    '  Get-CimInstance Win32_Process -Filter ("Name=\'" + $name + "\'")',
    `  | Where-Object { $_.CommandLine -like '*${repoFilter}*' -or $_.CommandLine -like '*playwright*' -or $_.CommandLine -like '*vitest*' -or $_.CommandLine -like '*test:e2e*' -or $_.CommandLine -like '*run-e2e*' }`,
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
      .filter(
        (row) =>
          row.CommandLine &&
          shouldIncludeWindowsProcessRow(row.CommandLine, row.ProcessId, e2ePortPids),
      )
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
  const e2ePortPids = collectE2ePortPids();

  for (const port of E2E_PORTS) {
    for (const pid of getListeningPids(port)) {
      if (seen.has(pid)) continue;
      seen.add(pid);

      const commandLine = process.platform === 'win32' ? windowsCommandLine(pid) : '';
      if (commandLine) {
        const repoOrE2eTool =
          isRepoScopedCommandLine(commandLine) ||
          qualifiesE2eToolOrphanWithoutRepoSlug(commandLine, pid, e2ePortPids);
        if (!repoOrE2eTool) continue;
        if (!isOrphanPatternCommandLine(commandLine)) continue;
      }

      results.push({
        pid,
        name: process.platform === 'win32' ? 'node.exe' : 'process',
        commandLine: commandLine || `LISTEN :${port} pid=${pid}`,
      });
    }
  }

  return results;
}

/** Explicit Playwright/vitest scan — repo slug optional when E2E ports are busy. */
function listWindowsE2eToolOrphans(): RepoDevProcess[] {
  if (process.platform !== 'win32') return [];

  const e2ePortPids = collectE2ePortPids();
  if (e2ePortPids.size === 0) return [];

  const ps = [
    '$rows = @()',
    "foreach ($name in @('node.exe','bun.exe')) {",
    '  Get-CimInstance Win32_Process -Filter ("Name=\'" + $name + "\'")',
    "  | Where-Object { $_.CommandLine -match 'playwright|vitest|test:e2e|run-e2e' }",
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
      .filter((row) => {
        if (!row.CommandLine || !isOrphanPatternCommandLine(row.CommandLine)) return false;
        return (
          isRepoScopedCommandLine(row.CommandLine) ||
          qualifiesE2eToolOrphanWithoutRepoSlug(row.CommandLine, row.ProcessId, e2ePortPids)
        );
      })
      .map((row) => ({
        pid: row.ProcessId,
        name: row.Name,
        commandLine: row.CommandLine ?? '',
      }));
  } catch {
    return [];
  }
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
      if (!Number.isFinite(pid) || !isRepoScopedCommandLine(commandLine)) continue;
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
    if (isOrphanPatternCommandLine(proc.commandLine)) {
      byPid.set(proc.pid, proc);
    }
  }

  for (const proc of listRepoE2ePortListeners()) {
    if (!byPid.has(proc.pid)) {
      byPid.set(proc.pid, proc);
    }
  }

  for (const proc of listWindowsE2eToolOrphans()) {
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
