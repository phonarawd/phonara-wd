/**
 * One-shot session purge — orphans, E2E ports, repo artifacts, project metadata, hygiene gate.
 * Low-spec safe: sequential, no Docker, no nested heavy gates.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { killOrphanRepoDevProcesses, listOrphanRepoDevProcesses } from './lib/cursor-dev-processes';
import { E2E_PORTS, getListeningPids, killE2ePortListeners } from './lib/e2e-lifecycle';
import { spawnSyncSafe } from './lib/spawn-safe';
import {
  CURSOR_EPHEMERAL_PATHS,
  EPHEMERAL_AUTH_PATHS,
  ROOT_ARTIFACT_DIRS,
  ROOT_ARTIFACT_FILES,
  SESSION_RESIDUE_DIRS,
  WORKSPACE_ARTIFACT_NAMES,
  WORKSPACE_ROOTS,
} from './lib/workspace-artifacts';
import { pruneStateVscdbBackups, stateVscdbBackupBytes } from './lib/cursor-vscdb-backup-prune';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const METADATA_LOG_THRESHOLD_MB = 50;
const SNAPSHOTS_PURGE_THRESHOLD_MB = 100;
const VSCDB_BACKUP_PRUNE_THRESHOLD_MB = 100;

function dirSizeBytes(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;
  let total = 0;
  const stack = [dirPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) stack.push(full);
        else total += stat.size;
      } catch {
        // Skip unreadable paths.
      }
    }
  }
  return total;
}

function cleanRepoArtifacts(): number {
  let removed = 0;
  const targets: string[] = [
    ...ROOT_ARTIFACT_DIRS,
    ...ROOT_ARTIFACT_FILES,
    ...EPHEMERAL_AUTH_PATHS,
    ...CURSOR_EPHEMERAL_PATHS,
  ];

  for (const root of WORKSPACE_ROOTS) {
    const rootPath = path.join(REPO_ROOT, root);
    if (!existsSync(rootPath)) continue;
    for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const artifact of WORKSPACE_ARTIFACT_NAMES) {
        targets.push(path.join(rootPath, entry.name, artifact));
      }
    }
  }

  const testResults = path.join(REPO_ROOT, 'test-results');
  if (existsSync(testResults)) {
    for (const entry of readdirSync(testResults, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith('.playwright-artifacts')) {
        targets.push(path.join(testResults, entry.name));
      }
    }
  }

  for (const target of targets) {
    const absolute = path.isAbsolute(target) ? target : path.join(REPO_ROOT, target);
    if (!existsSync(absolute)) continue;
    rmSync(absolute, { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}

function cleanProjectMetadata(includeCursorLogs: boolean, includeSnapshots: boolean): void {
  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    path.join(REPO_ROOT, 'scripts', 'cursor-clean-metadata.ps1'),
    '--apply',
    '--skip-transcripts',
  ];
  if (includeCursorLogs) {
    args.push('--include-cursor-logs');
  }
  if (includeSnapshots) {
    args.push('--include-snapshots');
  }
  spawnSyncSafe('powershell.exe', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function cursorLogsMb(): number {
  const logsDir = path.join(
    process.env.APPDATA ?? path.join(homedir(), 'AppData', 'Roaming'),
    'Cursor',
    'logs',
  );
  const trackingDir = path.join(homedir(), '.cursor', 'ai-tracking');
  return (dirSizeBytes(logsDir) + dirSizeBytes(trackingDir)) / (1024 * 1024);
}

function snapshotsMb(): number {
  const snapshotsDir = path.join(
    process.env.APPDATA ?? path.join(homedir(), 'AppData', 'Roaming'),
    'Cursor',
    'snapshots',
  );
  return dirSizeBytes(snapshotsDir) / (1024 * 1024);
}

function printSummary(): void {
  const orphans = listOrphanRepoDevProcesses();
  const residue = SESSION_RESIDUE_DIRS.filter((dir) => existsSync(path.join(REPO_ROOT, dir)));

  process.stdout.write(`[cursor:purge] orphan candidates: ${orphans.length}\n`);
  process.stdout.write('[cursor:purge] E2E ports:\n');
  for (const port of E2E_PORTS) {
    const pids = getListeningPids(port);
    process.stdout.write(
      `  ${port}: ${pids.length === 0 ? 'free' : `BUSY pid=${pids.join(',')}`}\n`,
    );
  }
  process.stdout.write(
    `[cursor:purge] session residue: ${residue.length === 0 ? 'none' : residue.join(', ')}\n`,
  );
}

process.stdout.write('[cursor:purge] starting full session purge (low-spec sequential)\n');

const orphansBefore = listOrphanRepoDevProcesses().length;
process.stdout.write(`[cursor:purge] orphans before: ${orphansBefore}\n`);

const killed = killOrphanRepoDevProcesses();
const portsFreed = killE2ePortListeners();
const artifactsRemoved = cleanRepoArtifacts();

process.stdout.write(
  `[cursor:purge] killed ${killed} orphan(s), freed ${portsFreed} port listener(s), removed ${artifactsRemoved} artifact path(s)\n`,
);

const logsMb = cursorLogsMb();
const snapMb = snapshotsMb();
const includeLogs = logsMb >= METADATA_LOG_THRESHOLD_MB;
const includeSnapshots = snapMb >= SNAPSHOTS_PURGE_THRESHOLD_MB;
process.stdout.write(
  `[cursor:purge] Cursor logs/cache ${logsMb.toFixed(1)}MB, snapshots ${snapMb.toFixed(1)}MB — metadata cleanup (logs=${includeLogs ? 'yes' : 'no'}, snapshots=${includeSnapshots ? 'yes' : 'no'})\n`,
);
cleanProjectMetadata(includeLogs || includeSnapshots, includeSnapshots);

const backupMb = stateVscdbBackupBytes() / (1024 * 1024);
if (backupMb >= VSCDB_BACKUP_PRUNE_THRESHOLD_MB) {
  const pruned = pruneStateVscdbBackups();
  process.stdout.write(
    `[cursor:purge] pruned ${pruned.removedFiles} state.vscdb backup(s), reclaimed ~${pruned.reclaimedMb.toFixed(0)}MB disk\n`,
  );
}

const hygiene = spawnSyncSafe('bun', ['run', 'check:hygiene'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});
if (hygiene.stdout?.trim()) {
  process.stdout.write(hygiene.stdout);
}
if (hygiene.status !== 0) {
  process.stderr.write(hygiene.stderr ?? '[cursor:purge] check:hygiene failed\n');
  process.exit(hygiene.status ?? 1);
}

printSummary();

try {
  execSync('docker info', { stdio: 'ignore', timeout: 3_000 });
  process.stdout.write(
    '[cursor:purge] tip: quit Docker Desktop when not running E2E/SQL — frees RAM on low-spec PCs\n',
  );
} catch {
  // Docker off — expected when idle.
}

process.stdout.write('[cursor:purge] done — fully quit Cursor (tray too) if UI still lags\n');
