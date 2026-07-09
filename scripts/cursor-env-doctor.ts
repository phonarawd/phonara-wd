/**
 * One-shot dev environment health report — read-only diagnostics + optional auto-fix.
 *
 *   bun run cursor:env-doctor           # report only
 *   bun run cursor:env-doctor -- --fix  # purge orphans/ports/artifacts + stack:stop
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditCursorArgv, formatCursorArgvStatusLine } from './lib/cursor-argv';
import { listOrphanRepoDevProcesses, listRepoDevProcesses } from './lib/cursor-dev-processes';
import { getDockerDesktopState } from './lib/docker-desktop-lifecycle';
import { E2E_PORTS, getListeningPids } from './lib/e2e-lifecycle';
import { isLocalSupabaseRunning } from './lib/supabase-local';
import {
  bytesToMb,
  cursorAiTrackingDir,
  cursorLogsDir,
  cursorSnapshotsDir,
  dirSizeBytes,
  globalStorageVscdbBytes,
  measureCursorUserState,
} from './lib/cursor-metadata-sizes';
import { listStaleWorkspaceStorage } from './lib/cursor-stale-workspaces';
import { stateVscdbBackupBytes } from './lib/cursor-vscdb-backup-prune';
import { SESSION_RESIDUE_DIRS } from './lib/workspace-artifacts';
import { spawnSyncSafe } from './lib/spawn-safe';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fix = process.argv.includes('--fix');
const projectSlug = 'c-Users-PC-Desktop-phonara-gb';
const terminalsDir = path.join(
  process.env.USERPROFILE ?? '',
  '.cursor',
  'projects',
  projectSlug,
  'terminals',
);

type Issue = { severity: 'critical' | 'warn' | 'info'; message: string; action?: string };

const issues: Issue[] = [];

function push(severity: Issue['severity'], message: string, action?: string): void {
  issues.push({ severity, message, action });
}

function readRamFreeMb(): number {
  if (process.platform !== 'win32') return 0;
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024,0)"',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10_000 },
    ).trim();
    return Number.parseInt(raw, 10) || 0;
  } catch {
    return 0;
  }
}

function scanTerminals(): { active: number; failed: number; hung: number } {
  if (!existsSync(terminalsDir)) return { active: 0, failed: 0, hung: 0 };
  let active = 0;
  let failed = 0;
  let hung = 0;
  for (const file of readdirSync(terminalsDir)) {
    if (!file.endsWith('.txt')) continue;
    let content: string;
    try {
      content = readFileSync(path.join(terminalsDir, file), 'utf8');
    } catch {
      continue;
    }
    const hasEnd = /exit_code:\s*\d+/m.test(content) || /ended_at:/m.test(content);
    if (!hasEnd && /running_for_ms:/m.test(content)) {
      active += 1;
      const msMatch = content.match(/running_for_ms:\s*(\d+)/);
      const ms = msMatch ? Number.parseInt(msMatch[1], 10) : 0;
      if (ms > 120_000) hung += 1;
    }
    if (/exit code 1|exited with code 1|FAIL|error:/i.test(content) && hasEnd) {
      failed += 1;
    }
  }
  return { active, failed, hung };
}

process.stdout.write('=== PHONARA cursor:env-doctor ===\n\n');

// 1) argv / render
const argvLine = formatCursorArgvStatusLine(auditCursorArgv());
process.stdout.write(`${argvLine}\n`);
if (!auditCursorArgv().ok) {
  push('warn', 'Cursor argv render contract drift', 'bun run cursor:render-fix → restart Cursor');
}

// 2) RAM
const ramFree = readRamFreeMb();
process.stdout.write(`System RAM free: ${ramFree}MB / ~7920MB\n`);
const RAM_CRITICAL_MB = 1024;
const RAM_WARN_MB = 1228;

if (ramFree > 0 && ramFree < RAM_CRITICAL_MB) {
  push(
    'critical',
    `RAM critical (${ramFree}MB free) — STOP code work; Cursor/Chrome/Claude/Docker compete for 8GB`,
    'Close Claude Desktop + extra browser tabs; bun run stack:stop — resume only after env-doctor ≥1.0GB',
  );
} else if (ramFree > 0 && ramFree < RAM_WARN_MB) {
  push(
    'warn',
    `RAM low (${ramFree}MB free, warn below ${RAM_WARN_MB}MB)`,
    'Close unused Electron apps; no Composer/heavy gates until ≥1.2GB free',
  );
}

// 3) Repo processes / orphans / ports
const repoProcs = listRepoDevProcesses();
const orphans = listOrphanRepoDevProcesses();
process.stdout.write(`Repo bun/node: ${repoProcs.length} · orphans: ${orphans.length}\n`);
if (orphans.length > 0) {
  push('warn', `${orphans.length} orphan dev process(es)`, 'bun run cursor:purge');
}
for (const port of E2E_PORTS) {
  const pids = getListeningPids(port);
  if (pids.length > 0) {
    push('critical', `E2E port ${port} busy (pid ${pids.join(',')})`, 'bun run e2e:kill');
  }
}

// 4) Session residue
const residue = SESSION_RESIDUE_DIRS.filter((dir) => existsSync(path.join(REPO_ROOT, dir)));
if (residue.length > 0) {
  push('warn', `Session residue: ${residue.join(', ')}`, 'bun run clean:artifacts');
}

// 5) Docker / Supabase
const dockerState = getDockerDesktopState();
const dockerReady = dockerState === 'engine_ready';
process.stdout.write(
  `Docker: ${dockerState} · Supabase local: ${dockerReady && isLocalSupabaseRunning() ? 'RUNNING' : 'stopped'}\n`,
);
if (dockerState === 'zombie_ui') {
  push(
    'critical',
    'Docker Desktop zombie UI — tray open but Linux engine pipe missing (UI shows N/A)',
    'bun run stack:docker:recover',
  );
} else if (dockerReady && !isLocalSupabaseRunning()) {
  push(
    'warn',
    'Docker Desktop ON but Supabase stopped — vmmem still consumes ~600–900MB RAM',
    'bun run stack:stop (quits Docker when PHONARA_DOCKER_AUTO_QUIT=1)',
  );
}

// 6) Cursor metadata
const globalStateMb = bytesToMb(globalStorageVscdbBytes());
const logsMb = bytesToMb(dirSizeBytes(cursorLogsDir()));
const trackingMb = bytesToMb(dirSizeBytes(cursorAiTrackingDir()));
const snapshotsMb = bytesToMb(dirSizeBytes(cursorSnapshotsDir()));
const userState = measureCursorUserState();
process.stdout.write(
  `Cursor disk: state.vscdb ${globalStateMb.toFixed(0)}MB · workspaceStorage ${userState.trackedMb.toFixed(0)}MB tracked · logs ${logsMb.toFixed(0)}MB · ai-tracking ${trackingMb.toFixed(0)}MB · snapshots ${snapshotsMb.toFixed(0)}MB\n`,
);
if (globalStateMb >= 500) {
  push(
    'warn',
    `state.vscdb bloated (${globalStateMb.toFixed(0)}MB) — disk/I/O lag`,
    'Quit Cursor (tray) → bun run cursor:compact-after-quit',
  );
}
const backupMb = bytesToMb(stateVscdbBackupBytes());
if (backupMb >= 500) {
  push(
    'warn',
    `state.vscdb backups bloated (${backupMb.toFixed(0)}MB) — disk/I/O lag on chat save`,
    'bun run cursor:purge (safe while Cursor open — deletes .bak only)',
  );
}
if (snapshotsMb >= 200) {
  push(
    'info',
    `snapshots ${snapshotsMb.toFixed(0)}MB`,
    'bun run cursor:purge (includes snapshots when >200MB)',
  );
}

const stale = listStaleWorkspaceStorage();
const staleMb = stale.reduce((sum, e) => sum + e.mb, 0);
if (staleMb >= 30) {
  push(
    'info',
    `Stale workspaceStorage ~${staleMb.toFixed(0)}MB (${stale.length} old projects)`,
    'Quit Cursor → bun run cursor:clean-stale-workspaces -- --apply',
  );
}

// 7) Terminal session logs
const terminals = scanTerminals();
process.stdout.write(
  `Terminal logs: ${terminals.active} active · ${terminals.hung} possibly hung · ${terminals.failed} ended with errors\n`,
);
if (terminals.hung > 0) {
  push(
    'warn',
    `${terminals.hung} terminal session(s) running >2min — may hold shell state`,
    'Cancel hung commands in IDE terminals or close orphan terminal tabs',
  );
}

// 8) MCP
const mcpPath = path.join(REPO_ROOT, '.cursor', 'mcp.json');
if (existsSync(mcpPath)) {
  try {
    const mcp = JSON.parse(readFileSync(mcpPath, 'utf8')) as {
      mcpServers?: Record<string, unknown>;
    };
    const count = Object.keys(mcp.mcpServers ?? {}).length;
    process.stdout.write(`MCP servers in .cursor/mcp.json: ${count}\n`);
    if (count > 2) {
      push(
        'warn',
        `${count} MCP servers — duplicate Supabase plugin+stdio causes races on Windows`,
        'Keep .cursor/mcp.json minimal',
      );
    }
  } catch {
    push('warn', 'Invalid .cursor/mcp.json', 'bun run mcp:fix');
  }
}

// 9) Hygiene gate
const hygiene = spawnSyncSafe('bun', ['run', 'check:hygiene'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});
if (hygiene.status !== 0) {
  push('warn', 'check:hygiene failed', 'bun run check:hygiene (read output)');
} else {
  process.stdout.write('check:hygiene: OK\n');
}

// Summary
process.stdout.write('\n--- Issues ---\n');
if (issues.length === 0) {
  process.stdout.write('No issues — environment ready for lightweight work (typecheck/lint/UI).\n');
} else {
  for (const issue of issues) {
    const tag = issue.severity.toUpperCase();
    process.stdout.write(`[${tag}] ${issue.message}\n`);
    if (issue.action) process.stdout.write(`        → ${issue.action}\n`);
  }
}

process.stdout.write('\n--- Daily workflow (low-spec) ---\n');
process.stdout.write('  Start:  bun run cursor:status (once per session)\n');
process.stdout.write('  UI:     typecheck · lint · check:i18n · check:ui-architecture\n');
process.stdout.write('  E2E:    operator 「gate 실행」 only — pretest starts Docker on-demand\n');
process.stdout.write('  End:    bun run stack:stop · bun run cursor:session-end\n');
process.stdout.write(
  '  Lag:    RAM → close apps · Disk → cursor:compact-after-quit (Cursor quit first)\n',
);

if (fix) {
  process.stdout.write('\n--- Auto-fix (--fix) ---\n');
  spawnSyncSafe('bun', ['run', 'cursor:purge'], { cwd: REPO_ROOT, stdio: 'inherit' });
  spawnSyncSafe('bun', ['run', 'stack:stop'], { cwd: REPO_ROOT, stdio: 'inherit' });
  process.stdout.write('[cursor:env-doctor] auto-fix done — rerun without --fix to verify\n');
}

const criticalCount = issues.filter((i) => i.severity === 'critical').length;
process.exit(criticalCount > 0 && !fix ? 1 : 0);
