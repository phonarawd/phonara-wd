/**
 * Fast read-only snapshot — no kills, no cleans. Safe during lag spikes.
 *
 * Default: fast (~2–3s) — no recursive User/metadata walk, no docker info when OFF.
 * Full:    `bun run cursor:status -- --full` — deep metadata + stale workspace scan.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listOrphanRepoDevProcesses, listRepoDevProcesses } from './lib/cursor-dev-processes';
import { getDockerDesktopState } from './lib/docker-desktop-lifecycle';
import { readDockerDiskSnapshot } from './lib/docker-clean';
import { isLocalSupabaseRunning } from './lib/supabase-local';
import { E2E_PORTS, getListeningPids } from './lib/e2e-lifecycle';
import { SESSION_RESIDUE_DIRS } from './lib/workspace-artifacts';
import { auditCursorArgv, formatCursorArgvStatusLine } from './lib/cursor-argv';
import {
  bytesToMb,
  cursorAiTrackingDir,
  cursorLogsDir,
  cursorSnapshotsDir,
  cursorWorkspaceStorageDir,
  dirSizeBytes,
  globalStorageVscdbBytes,
  measureCursorUserState,
  OTHER_USER_DIR_WARN_MB,
  shallowDirSizeBytes,
} from './lib/cursor-metadata-sizes';
import { listStaleWorkspaceStorage } from './lib/cursor-stale-workspaces';

const GLOBAL_STATE_WARN_MB = 500;
const AI_TRACKING_WARN_MB = 80;
const TSSERVER_WARN_MB = 400;
const CURSOR_RAM_WARN_MB = 1800;
const RAM_FREE_CRITICAL_MB = 1024;
const RAM_FREE_WARN_MB = 1536;

const fullScan = process.argv.includes('--full');

function parseRuntimeStats(raw: string): {
  cursorCount: string;
  cursorMb: number;
  tsSemanticMb: number;
  tsPartialMb: number;
  ramTotalMb: number;
  ramFreeMb: number;
} {
  const parts = raw.split('|');
  const after = (key: string): number => {
    const i = parts.indexOf(key);
    return i >= 0 ? Number(parts[i + 1] ?? 0) : 0;
  };
  return {
    cursorCount: parts[1] ?? '?',
    cursorMb: Number(parts[2] ?? 0),
    tsSemanticMb: after('TSSEM'),
    tsPartialMb: after('TSPART'),
    ramTotalMb: after('RAMTOTAL'),
    ramFreeMb: after('RAMFREE'),
  };
}

function measureDirMb(dirPath: string): number {
  const bytes = fullScan ? dirSizeBytes(dirPath) : shallowDirSizeBytes(dirPath);
  return bytesToMb(bytes);
}

const orphans = listOrphanRepoDevProcesses();
const repoProcs = listRepoDevProcesses();
const residue = SESSION_RESIDUE_DIRS.filter((dir) => existsSync(dir));

process.stdout.write(`${formatCursorArgvStatusLine(auditCursorArgv())}\n`);
if (!fullScan) {
  process.stdout.write('[cursor:status] mode=fast (deep scan: bun run cursor:status -- --full)\n');
}

process.stdout.write(`[cursor:status] repo node/bun processes: ${repoProcs.length}\n`);
process.stdout.write(`[cursor:status] orphan candidates: ${orphans.length}\n`);
for (const orphan of orphans.slice(0, 6)) {
  process.stdout.write(`  pid=${orphan.pid} ${orphan.name} ${orphan.commandLine.slice(0, 100)}\n`);
}

process.stdout.write('[cursor:status] E2E ports:\n');
for (const port of E2E_PORTS) {
  const pids = getListeningPids(port);
  if (pids.length === 0) {
    process.stdout.write(`  ${port}: free\n`);
  } else {
    process.stdout.write(`  ${port}: BUSY pid=${pids.join(',')} — run: bun run e2e:kill\n`);
  }
}

if (residue.length > 0) {
  process.stdout.write(`[cursor:status] session residue: ${residue.join(', ')}\n`);
} else {
  process.stdout.write('[cursor:status] session residue: none\n');
}

process.stdout.write('[cursor:status] Docker / Supabase:\n');
const dockerState = getDockerDesktopState();
const dockerReady = dockerState === 'engine_ready';
const dockerLabel =
  dockerState === 'engine_ready'
    ? 'ready'
    : dockerState === 'zombie_ui'
      ? 'ZOMBIE (UI open, engine N/A — run: bun run stack:docker:recover)'
      : dockerState === 'not_installed'
        ? 'not installed'
        : 'OFF (on-demand — starts on pretest:e2e/sql)';
process.stdout.write(`  docker daemon: ${dockerLabel}\n`);
process.stdout.write(
  `  supabase local: ${
    dockerReady
      ? isLocalSupabaseRunning()
        ? 'RUNNING (~15 containers — run stack:stop when idle)'
        : 'stopped'
      : 'stopped (docker off)'
  }\n`,
);
if (fullScan) {
  const dockerDf = dockerReady ? readDockerDiskSnapshot() : null;
  if (dockerDf) {
    process.stdout.write('[cursor:status] docker disk (reclaimable):\n');
    for (const line of dockerDf.split('\n')) {
      process.stdout.write(`  ${line}\n`);
    }
    process.stdout.write(
      '  tip: bun run stack:docker-clean --cache · on-demand: 84-docker-on-demand.mdc\n',
    );
  } else if (dockerReady) {
    process.stdout.write('  docker disk: (unable to read — run stack:docker-clean manually)\n');
  }
}

const logsMb = measureDirMb(cursorLogsDir());
const trackingMb = measureDirMb(cursorAiTrackingDir());
const snapshotsMb = measureDirMb(cursorSnapshotsDir());
const globalStateMb = bytesToMb(globalStorageVscdbBytes());
const workspaceStorageMb = fullScan
  ? bytesToMb(dirSizeBytes(cursorWorkspaceStorageDir()))
  : bytesToMb(shallowDirSizeBytes(cursorWorkspaceStorageDir(), 1));
const userState = fullScan
  ? measureCursorUserState()
  : {
      trackedMb: globalStateMb + workspaceStorageMb,
      otherMb: 0,
      otherDirs: [],
      totalMb: globalStateMb + workspaceStorageMb,
    };

process.stdout.write('[cursor:status] Cursor metadata (outside repo):\n');
const approx = fullScan ? '' : '~';
process.stdout.write(
  `  logs: ${approx}${logsMb.toFixed(1)}MB · ai-tracking: ${approx}${trackingMb.toFixed(1)}MB · snapshots: ${approx}${snapshotsMb.toFixed(1)}MB\n`,
);
const otherLabel = userState.otherMb > 0 ? ` · other: ${userState.otherMb.toFixed(1)}MB` : '';
process.stdout.write(
  `  User state: ~${userState.totalMb.toFixed(0)}MB tracked+other${otherLabel} · globalStorage state.vscdb: ${globalStateMb.toFixed(1)}MB · workspaceStorage: ${approx}${workspaceStorageMb.toFixed(1)}MB\n`,
);
if (fullScan && userState.otherMb >= OTHER_USER_DIR_WARN_MB) {
  const top = userState.otherDirs
    .slice(0, 3)
    .map((d) => `${d.name} ${d.mb.toFixed(0)}MB`)
    .join(', ');
  process.stdout.write(
    `  warn: User/untracked dirs ${userState.otherMb.toFixed(0)}MB (${top}) — inspect %APPDATA%\\Cursor\\User\n`,
  );
}

let cursorMb = 0;
let ramFreeMb = 0;

if (process.platform === 'win32') {
  try {
    const ps1 = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      'lib',
      'cursor-runtime-stats.ps1',
    );
    const raw = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: fullScan ? 15_000 : 8_000,
    }).trim();
    const stats = parseRuntimeStats(raw);
    cursorMb = stats.cursorMb;
    ramFreeMb = stats.ramFreeMb;
    const ramTotalMb = stats.ramTotalMb;
    process.stdout.write('[cursor:status] Runtime (this PC):\n');
    process.stdout.write(
      `  System RAM: ${ramFreeMb}MB free / ${ramTotalMb}MB total · Cursor: ${stats.cursorCount} procs · ${cursorMb}MB · tsserver semantic ${stats.tsSemanticMb}MB · partial ${stats.tsPartialMb}MB\n`,
    );
    if (cursorMb >= CURSOR_RAM_WARN_MB) {
      process.stdout.write(
        '  warn: Cursor RAM high — quit unused Cursor windows (compact does NOT free RAM)\n',
      );
    }
    if (stats.tsSemanticMb >= TSSERVER_WARN_MB) {
      process.stdout.write('  warn: tsserver semantic high — Reload Window or restart Cursor\n');
    }
  } catch {
    process.stdout.write('[cursor:status] Runtime: (unable to read process stats)\n');
  }
}

const staleWorkspaces = fullScan ? listStaleWorkspaceStorage() : [];
if (staleWorkspaces.length > 0) {
  process.stdout.write('[cursor:status] Stale workspaceStorage (folder missing on disk):\n');
  for (const entry of staleWorkspaces.slice(0, 4)) {
    process.stdout.write(`  ${entry.mb.toFixed(1)}MB · ${entry.label}\n`);
  }
  if (staleWorkspaces.length > 4) {
    process.stdout.write(`  … +${staleWorkspaces.length - 4} more\n`);
  }
}

const tips: string[] = [];

if (ramFreeMb > 0 && ramFreeMb < RAM_FREE_CRITICAL_MB) {
  tips.push(
    `RAM critical (${ramFreeMb}MB free) — close Claude Desktop / browser / extra Electron apps; compact does NOT free RAM`,
  );
} else if (ramFreeMb > 0 && ramFreeMb < RAM_FREE_WARN_MB) {
  tips.push(
    `RAM low (${ramFreeMb}MB free) — close unused apps before heavy gates; compact does NOT free RAM`,
  );
}

if (cursorMb >= CURSOR_RAM_WARN_MB) {
  tips.push('Cursor RAM high — quit unused Cursor windows / workspaces');
}

if (orphans.length > 0) {
  tips.push('orphan dev processes — bun run cursor:purge or cursor:emergency-reset');
}

for (const port of E2E_PORTS) {
  if (getListeningPids(port).length > 0) {
    tips.push(`E2E port ${port} busy — bun run e2e:kill`);
    break;
  }
}

const argvAudit = auditCursorArgv();
if (!argvAudit.ok) {
  tips.push(
    'argv render drift — bun run cursor:render-fix (then restart Cursor if keys were missing)',
  );
}

if (globalStateMb >= GLOBAL_STATE_WARN_MB) {
  tips.push(
    `Disk/I/O track (RAM unchanged): state.vscdb ${globalStateMb.toFixed(0)}MB — quit Cursor (tray), then: bun run cursor:compact-global-state`,
  );
}

if (trackingMb >= AI_TRACKING_WARN_MB) {
  tips.push(
    `ai-tracking ${trackingMb.toFixed(0)}MB — purge after quitting Cursor (file locked while IDE runs)`,
  );
}

if (logsMb + trackingMb >= 50 && globalStateMb < GLOBAL_STATE_WARN_MB) {
  tips.push('bun run cursor:purge — cleans logs/snapshots when thresholds exceeded');
}

if (snapshotsMb >= 100) {
  tips.push('snapshots bloated — bun run cursor:cold-start or cursor:purge');
}

if (fullScan && staleWorkspaces.reduce((sum, w) => sum + w.mb, 0) >= 30) {
  tips.push('bun run cursor:clean-stale-workspaces -- --apply (quit Cursor first)');
}

if (fullScan && userState.otherMb >= OTHER_USER_DIR_WARN_MB) {
  tips.push(
    `User/untracked dirs ${userState.otherMb.toFixed(0)}MB — inspect %APPDATA%\\Cursor\\User (${userState.otherDirs[0]?.name ?? 'unknown'})`,
  );
}

if (tips.length > 0) {
  process.stdout.write('[cursor:status] tips:\n');
  for (const tip of tips) {
    process.stdout.write(`  · ${tip}\n`);
  }
}
