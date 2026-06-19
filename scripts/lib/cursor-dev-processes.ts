import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

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
  /e2e-dev-server/i,
  /dev:web/i,
  /dev:admin/i,
  /\bvite\b/i,
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

function listWindowsProcesses(): RepoDevProcess[] {
  const repoFilter = REPO_SLUG.replace(/'/g, "''");
  const ps = [
    "Get-CimInstance Win32_Process -Filter \"Name='node.exe' OR Name='bun.exe'\"",
    `| Where-Object { $_.CommandLine -like '*${repoFilter}*' }`,
    '| ForEach-Object { [PSCustomObject]@{',
    '  ProcessId = $_.ProcessId;',
    '  Name = $_.Name;',
    '  CommandLine = $_.CommandLine',
    '} }',
    '| ConvertTo-Json -Compress',
  ].join(' ');

  try {
    const raw = execSync(`powershell -NoProfile -Command "${ps}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000,
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
  return process.platform === 'win32'
    ? listWindowsProcesses()
    : listUnixProcesses();
}

export function listOrphanRepoDevProcesses(): RepoDevProcess[] {
  return listRepoDevProcesses().filter((proc) =>
    isOrphanCandidate(proc.commandLine),
  );
}

/** Stop hung vitest/playwright/E2E workers tied to this repo. Never touches Cursor tsserver. */
export function killOrphanRepoDevProcesses(): number {
  const orphans = listOrphanRepoDevProcesses();
  for (const orphan of orphans) {
    killPidTree(orphan.pid);
  }
  return orphans.length;
}

export function countActiveHeavyRepoShells(): number {
  return listOrphanRepoDevProcesses().length;
}
