import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { killOrphanRepoDevProcesses } from './lib/cursor-dev-processes';
import { killE2ePortListeners } from './lib/e2e-lifecycle';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

type HygieneMode = 'start' | 'end' | 'after-heavy' | 'before-heavy';

/** Low-spec PCs: clean Cursor logs/ai-tracking earlier (preflight warns at 50MB). */
const METADATA_AUTO_APPLY_MB = 50;

function run(label: string, cmd: string): void {
  const result = spawnSync(cmd, {
    cwd: REPO_ROOT,
    shell: true,
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

function maybeAutoCleanCursorLogs(): void {
  const logsDir = path.join(
    process.env.APPDATA ?? path.join(homedir(), 'AppData', 'Roaming'),
    'Cursor',
    'logs',
  );
  const trackingDir = path.join(homedir(), '.cursor', 'ai-tracking');
  const totalMb =
    (dirSizeBytes(logsDir) + dirSizeBytes(trackingDir)) / (1024 * 1024);

  if (totalMb < METADATA_AUTO_APPLY_MB) {
    process.stdout.write(
      `[cursor:hygiene] Cursor logs/cache ${totalMb.toFixed(1)}MB — below ${METADATA_AUTO_APPLY_MB}MB threshold\n`,
    );
    return;
  }

  process.stdout.write(
    `[cursor:hygiene] Cursor logs/cache ${totalMb.toFixed(1)}MB — auto-clean (logs only, transcripts kept)\n`,
  );
  run(
    'clean-metadata',
    'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/cursor-clean-metadata.ps1 --apply --include-cursor-logs --skip-transcripts',
  );
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
    run('clean:artifacts', 'bun run clean:artifacts');
  }
}

const mode = (process.argv[2] ?? 'end') as HygieneMode;

process.stdout.write(`[cursor:hygiene] mode=${mode}\n`);

switch (mode) {
  case 'start':
    coreHygiene({ killOrphans: true, killPorts: true, cleanArtifacts: true });
    maybeAutoCleanCursorLogs();
    run('sync-excludes', 'bun run cursor:sync-excludes');
    // stack:ensure는 E2E/SQL pretest에서만 — sessionStart마다 Docker 깨우면 저사양 PC 렉 유발
    break;
  case 'end':
    coreHygiene({ killOrphans: true, killPorts: true, cleanArtifacts: true });
    break;
  case 'after-heavy':
    coreHygiene({ killOrphans: true, killPorts: true, cleanArtifacts: true });
    break;
  case 'before-heavy':
    coreHygiene({ killOrphans: true, killPorts: true, cleanArtifacts: false });
    break;
  default:
    process.stderr.write(`[cursor:hygiene] unknown mode: ${mode}\n`);
    process.exit(1);
}
