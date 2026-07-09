/**
 * One-shot cold-start fix — snapshots/agent cache bloat, user settings, render argv.
 * Safe while Cursor is open for snapshots/logs; agent-worker prune needs quit first.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditCursorArgv, formatCursorArgvStatusLine, mergeCursorArgv } from './lib/cursor-argv';
import {
  applyColdStartUserSettings,
  PHONARA_COLD_START_WORKSPACE_SETTINGS,
} from './lib/cursor-cold-start-settings';
import {
  bytesToMb,
  cursorAiTrackingDir,
  cursorLogsDir,
  cursorSnapshotsDir,
  dirSizeBytes,
  shallowDirSizeBytes,
} from './lib/cursor-metadata-sizes';
import { spawnSyncSafe } from './lib/spawn-safe';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOTS_PURGE_THRESHOLD_MB = 100;
const LOGS_PURGE_THRESHOLD_MB = 50;

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

function agentWorkerMb(): number {
  const agentWorker = path.join(
    process.env.APPDATA ?? '',
    'Cursor',
    'User',
    'globalStorage',
    'anysphere.cursor-agent-worker',
  );
  return bytesToMb(shallowDirSizeBytes(agentWorker, 3));
}

function purgeSnapshots(): boolean {
  const mb = bytesToMb(dirSizeBytes(cursorSnapshotsDir()));
  if (mb < SNAPSHOTS_PURGE_THRESHOLD_MB) {
    process.stdout.write(
      `[cursor:cold-start] snapshots ${mb.toFixed(1)}MB — below ${SNAPSHOTS_PURGE_THRESHOLD_MB}MB threshold\n`,
    );
    return false;
  }

  process.stdout.write(
    `[cursor:cold-start] snapshots ${mb.toFixed(1)}MB — purging editor snapshot cache\n`,
  );
  spawnSyncSafe(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      path.join(REPO_ROOT, 'scripts', 'cursor-clean-metadata.ps1'),
      '--apply',
      '--include-snapshots',
      '--skip-transcripts',
    ],
    { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return true;
}

function purgeLogsIfNeeded(): boolean {
  const mb = (dirSizeBytes(cursorLogsDir()) + dirSizeBytes(cursorAiTrackingDir())) / (1024 * 1024);
  if (mb < LOGS_PURGE_THRESHOLD_MB) {
    process.stdout.write(
      `[cursor:cold-start] logs/cache ${mb.toFixed(1)}MB — below ${LOGS_PURGE_THRESHOLD_MB}MB threshold\n`,
    );
    return false;
  }

  process.stdout.write(`[cursor:cold-start] logs/cache ${mb.toFixed(1)}MB — purging\n`);
  spawnSyncSafe(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      path.join(REPO_ROOT, 'scripts', 'cursor-clean-metadata.ps1'),
      '--apply',
      '--include-cursor-logs',
      '--skip-transcripts',
    ],
    { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return true;
}

function applyWorkspaceColdStartSettings(): number {
  const settingsPath = path.join(REPO_ROOT, '.vscode', 'settings.json');
  if (!existsSync(settingsPath)) return 0;

  const raw = readFileSync(settingsPath, 'utf8');
  const settings = JSON.parse(raw) as Record<string, unknown>;
  let changed = 0;

  for (const [key, value] of Object.entries(PHONARA_COLD_START_WORKSPACE_SETTINGS)) {
    if (settings[key] === undefined) {
      settings[key] = value;
      changed += 1;
    }
  }

  if (changed === 0) return 0;
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  return changed;
}

function main(): void {
  process.stdout.write('=== PHONARA cursor:cold-start-fix ===\n\n');

  const ramFree = readRamFreeMb();
  const snapshotsBefore = bytesToMb(dirSizeBytes(cursorSnapshotsDir()));
  const agentWorkerBefore = agentWorkerMb();

  process.stdout.write(`System RAM free: ${ramFree}MB\n`);
  process.stdout.write(
    `Before: snapshots ${snapshotsBefore.toFixed(1)}MB · agent-worker ~${agentWorkerBefore.toFixed(1)}MB\n`,
  );
  process.stdout.write(`${formatCursorArgvStatusLine(auditCursorArgv())}\n\n`);

  const userSettings = applyColdStartUserSettings();
  process.stdout.write(
    `[cursor:cold-start] user settings: ${userSettings.changed} key(s) merged → ${userSettings.path}\n`,
  );

  const workspaceChanged = applyWorkspaceColdStartSettings();
  process.stdout.write(
    `[cursor:cold-start] workspace settings: ${workspaceChanged} key(s) added → .vscode/settings.json\n`,
  );

  const render = mergeCursorArgv({ apply: true });
  process.stdout.write(`${formatCursorArgvStatusLine(render)}\n`);

  const purgedSnapshots = purgeSnapshots();
  const purgedLogs = purgeLogsIfNeeded();

  const snapshotsAfter = bytesToMb(dirSizeBytes(cursorSnapshotsDir()));
  process.stdout.write(
    `\nAfter: snapshots ${snapshotsAfter.toFixed(1)}MB (reclaimed ~${Math.max(0, snapshotsBefore - snapshotsAfter).toFixed(1)}MB)\n`,
  );

  process.stdout.write('\n--- Root causes addressed ---\n');
  process.stdout.write('  1. Editor snapshots cache bloat (cold-boot disk I/O)\n');
  process.stdout.write('  2. Missing window.restoreWindows / startupEditor (tab restore lag)\n');
  process.stdout.write('  3. sessionStart hook fast-path (see cursor-session-hygiene.ts)\n');

  if (agentWorkerBefore >= 80) {
    process.stdout.write(
      `\n[cursor:cold-start] agent-worker cache ~${agentWorkerBefore.toFixed(0)}MB — Cursor가 실행 중이면 자동 삭제 불가\n`,
    );
    process.stdout.write(
      '  완전 종료(트레이 포함) 후 재실행하면 캐시가 재생성되며, 스냅샷 정리만으로도 체감 개선됩니다.\n',
    );
  }

  process.stdout.write('\n--- Next step (필수) ---\n');
  process.stdout.write('  1. Cursor 완전 종료 (트레이 아이콘 우클릭 → Quit)\n');
  process.stdout.write('  2. Cursor 다시 실행\n');
  if (purgedSnapshots || purgedLogs || userSettings.changed > 0 || workspaceChanged > 0) {
    process.stdout.write('  3. 첫 실행 후: bun run cursor:status (한 번만)\n');
  }

  if (ramFree > 0 && ramFree < 1536) {
    process.stdout.write(
      `\n[cursor:cold-start] RAM ${ramFree}MB free — Chrome/Claude Desktop 등 추가 앱 종료 권장\n`,
    );
  }
}

main();
