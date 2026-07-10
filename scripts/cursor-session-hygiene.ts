import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditCursorArgv } from './lib/cursor-argv';
import { shallowDirSizeBytes, cursorSnapshotsDir } from './lib/cursor-metadata-sizes';
import { killOrphanRepoDevProcesses } from './lib/cursor-dev-processes';
import { maybeRunEmptyStandby } from './lib/empty-standby-core';
import { stopIdleDockerIfSafe } from './lib/docker-idle-stop';
import { getBlockedE2ePorts, killE2ePortListeners } from './lib/e2e-lifecycle';
import { spawnSyncSafe } from './lib/spawn-safe';
import { SESSION_RESIDUE_DIRS } from './lib/workspace-artifacts';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type HygieneMode = 'start' | 'end' | 'work-end' | 'after-heavy' | 'before-heavy' | 'agent-stop';

/** Low-spec PCs: clean Cursor logs/ai-tracking earlier (preflight warns at 50MB). */
const METADATA_AUTO_APPLY_MB = 50;
/** Editor snapshots bloat cold boot — purge earlier than cursor:purge full threshold. */
const SNAPSHOTS_AUTO_APPLY_MB = 100;
/** Skip render-fix re-merge when argv contract was OK within this window. */
const RENDER_FIX_SKIP_MS = 24 * 60 * 60 * 1000;

const RENDER_FIX_MARKER = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.cursor',
  '.phonara-render-fix-at',
);

function run(label: string, command: string, args: string[]): void {
  const result = spawnSyncSafe(command, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.stdout?.trim()) {
    process.stdout.write(result.stdout);
  }
  if (result.status !== 0 && result.stderr?.trim()) {
    process.stderr.write(`[cursor:hygiene] ${label} warning: ${result.stderr.trim()}\n`);
  }
}

function maybeAutoCleanSnapshots(): void {
  const snapshotsDir = cursorSnapshotsDir();
  const mb = shallowDirSizeBytes(snapshotsDir, 2) / (1024 * 1024);
  if (mb < SNAPSHOTS_AUTO_APPLY_MB) {
    process.stdout.write(
      `[cursor:hygiene] snapshots ${mb.toFixed(1)}MB — below ${SNAPSHOTS_AUTO_APPLY_MB}MB threshold\n`,
    );
    return;
  }

  process.stdout.write(
    `[cursor:hygiene] snapshots ${mb.toFixed(1)}MB — auto-purge (cold-start I/O)\n`,
  );
  run('clean-snapshots', 'powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    'scripts/cursor-clean-metadata.ps1',
    '--apply',
    '--include-snapshots',
    '--skip-transcripts',
  ]);
}

function maybeRenderFix(): void {
  if (auditCursorArgv().ok && existsSync(RENDER_FIX_MARKER)) {
    try {
      const ageMs = Date.now() - Number.parseInt(readFileSyncMarker(), 10);
      if (Number.isFinite(ageMs) && ageMs >= 0 && ageMs < RENDER_FIX_SKIP_MS) {
        process.stdout.write('[cursor:hygiene] render-fix skipped — argv OK (recent)\n');
        return;
      }
    } catch {
      // Fall through to merge.
    }
  }
  run('render-fix', 'bun', ['run', 'cursor:render-fix', '--quiet']);
  writeRenderFixMarker();
}

function readFileSyncMarker(): string {
  return readFileSync(RENDER_FIX_MARKER, 'utf8').trim();
}

function writeRenderFixMarker(): void {
  const dir = path.dirname(RENDER_FIX_MARKER);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(RENDER_FIX_MARKER, String(Date.now()), 'utf8');
}

function maybeAutoCleanCursorLogs(): void {
  const logsDir = path.join(
    process.env.APPDATA ?? path.join(homedir(), 'AppData', 'Roaming'),
    'Cursor',
    'logs',
  );
  const trackingDir = path.join(homedir(), '.cursor', 'ai-tracking');
  const totalMb = (shallowDirSizeBytes(logsDir) + shallowDirSizeBytes(trackingDir)) / (1024 * 1024);

  if (totalMb < METADATA_AUTO_APPLY_MB) {
    process.stdout.write(
      `[cursor:hygiene] Cursor logs/cache ${totalMb.toFixed(1)}MB — below ${METADATA_AUTO_APPLY_MB}MB threshold\n`,
    );
    return;
  }

  process.stdout.write(
    `[cursor:hygiene] Cursor logs/cache ${totalMb.toFixed(1)}MB — auto-clean (logs only, transcripts kept)\n`,
  );
  run('clean-metadata', 'powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    'scripts/cursor-clean-metadata.ps1',
    '--apply',
    '--include-cursor-logs',
    '--skip-transcripts',
  ]);
}

function coreHygiene(options: {
  killOrphans: boolean;
  killPorts: boolean;
  cleanArtifacts: boolean;
}): void {
  if (options.killOrphans) {
    const killed = killOrphanRepoDevProcesses();
    process.stdout.write(
      killed > 0
        ? `[cursor:hygiene] killed ${killed} orphan dev process(es)\n`
        : '[cursor:hygiene] no orphan dev processes\n',
    );
  }

  if (options.killPorts) {
    const stopped = killE2ePortListeners();
    process.stdout.write(
      stopped > 0
        ? `[cursor:hygiene] freed ${stopped} E2E port listener(s)\n`
        : '[cursor:hygiene] E2E ports 3000-3002 free\n',
    );
  }

  if (options.cleanArtifacts) {
    run('clean:artifacts', 'bun', ['run', 'clean:artifacts']);
  }
}

/** Post-work / post-test teardown — Docker OFF · ports free · hygiene green. */
function workEndTeardown(): void {
  run('stack:stop', 'bun', ['run', 'stack:stop', '--quiet']);
  stopIdleDockerIfSafe({ quiet: true });
  const hygiene = spawnSyncSafe('bun', ['run', 'check:hygiene'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (hygiene.stdout?.trim()) process.stdout.write(hygiene.stdout);
  if (hygiene.status === 0) {
    process.stdout.write('[cursor:hygiene] check:hygiene OK — session clean\n');
  } else if (hygiene.stderr?.trim()) {
    process.stderr.write(`[cursor:hygiene] check:hygiene warning: ${hygiene.stderr.trim()}\n`);
  }
  const blocked = getBlockedE2ePorts();
  if (blocked.length === 0) {
    process.stdout.write('[cursor:hygiene] E2E ports 3000-3002 free — no terminal conflict\n');
  } else {
    process.stderr.write(
      `[cursor:hygiene] ports still blocked: ${blocked.join(', ')} — run bun run e2e:kill\n`,
    );
  }
}

const mode = (process.argv[2] ?? 'end') as HygieneMode;

process.stdout.write(`[cursor:hygiene] mode=${mode}\n`);

switch (mode) {
  case 'start': {
    const hasResidue = SESSION_RESIDUE_DIRS.some((dir) => existsSync(dir));
    const blockedPorts = getBlockedE2ePorts();

    // Fast path: Win32 CIM orphan scan ~5s on 8GB PCs — skip when ports free + no residue.
    if (!hasResidue && blockedPorts.length === 0) {
      process.stdout.write('[cursor:hygiene] start fast-path — ports free, no residue\n');
      maybeAutoCleanSnapshots();
      maybeAutoCleanCursorLogs();
      maybeRenderFix();
      run('sync-excludes', 'bun', ['run', 'cursor:sync-excludes']);
      run('git-hooks', 'bun', ['run', 'git:hooks:install']);
      stopIdleDockerIfSafe({ quiet: true });
      break;
    }

    coreHygiene({ killOrphans: true, killPorts: true, cleanArtifacts: hasResidue });
    maybeAutoCleanSnapshots();
    maybeAutoCleanCursorLogs();
    maybeRenderFix();
    run('sync-excludes', 'bun', ['run', 'cursor:sync-excludes']);
    // stack:ensure는 E2E/SQL pretest에서만 — sessionStart마다 Docker 깨우면 저사양 PC 렉 유발
    // idle Docker OFF만 허용 — Supabase/E2E 포트 busy면 skip (84-docker-on-demand)
    stopIdleDockerIfSafe({ quiet: true });
    break;
  }
  case 'end':
  case 'work-end':
    coreHygiene({ killOrphans: true, killPorts: true, cleanArtifacts: true });
    maybeRunEmptyStandby();
    workEndTeardown();
    process.stdout.write('[cursor:hygiene] work-end complete — Cursor ready (low-spec idle)\n');
    break;
  case 'agent-stop': {
    // Cursor `stop` hook — runs after every agent turn; skip work when idle.
    const hasResidue = SESSION_RESIDUE_DIRS.some((dir) => existsSync(dir));
    const blockedPorts = getBlockedE2ePorts();
    if (!hasResidue && blockedPorts.length === 0) {
      process.stdout.write('[cursor:hygiene] agent-stop — idle, skip\n');
      break;
    }
    coreHygiene({ killOrphans: false, killPorts: true, cleanArtifacts: hasResidue });
    if (blockedPorts.length > 0 || hasResidue) {
      run('stack:stop', 'bun', ['run', 'stack:stop', '--quiet']);
      stopIdleDockerIfSafe({ quiet: true });
    }
    break;
  }
  case 'after-heavy':
    coreHygiene({ killOrphans: true, killPorts: true, cleanArtifacts: true });
    maybeRunEmptyStandby();
    workEndTeardown();
    break;
  case 'before-heavy':
    coreHygiene({ killOrphans: true, killPorts: true, cleanArtifacts: false });
    break;
  default:
    process.stderr.write(`[cursor:hygiene] unknown mode: ${mode}\n`);
    process.exit(1);
}
