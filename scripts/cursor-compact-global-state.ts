/**
 * Rename bloated Cursor global state.vscdb after fully quitting Cursor (tray too).
 * Cursor recreates a fresh DB on next launch — extension global cache resets.
 */
import { execSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import { bytesToMb, cursorGlobalStateDbPath, fileSizeBytes } from './lib/cursor-metadata-sizes';
import { pruneStateVscdbBackups } from './lib/cursor-vscdb-backup-prune';

const GLOBAL_STATE_THRESHOLD_MB = 500;

function isCursorRunning(): boolean {
  try {
    if (process.platform === 'win32') {
      const out = execSync(
        'powershell -NoProfile -Command "(Get-Process Cursor -ErrorAction SilentlyContinue | Measure-Object).Count"',
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 8_000 },
      ).trim();
      return Number.parseInt(out, 10) > 0;
    }
    execSync('pgrep -x Cursor', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

const dbPath = cursorGlobalStateDbPath();
const sizeMb = bytesToMb(fileSizeBytes(dbPath));

process.stdout.write('[cursor:compact-global-state] read-only check\n');
process.stdout.write(`  path: ${dbPath}\n`);
process.stdout.write(`  size: ${sizeMb.toFixed(1)}MB (threshold ${GLOBAL_STATE_THRESHOLD_MB}MB)\n`);

if (!existsSync(dbPath)) {
  process.stdout.write('[cursor:compact-global-state] state.vscdb absent — nothing to do\n');
  process.exit(0);
}

if (sizeMb < GLOBAL_STATE_THRESHOLD_MB) {
  process.stdout.write('[cursor:compact-global-state] below threshold — skip\n');
  process.exit(0);
}

if (isCursorRunning()) {
  process.stderr.write(
    '[cursor:compact-global-state] FAIL — Cursor is still running.\n' +
      '  Fully quit Cursor (tray icon too), then rerun:\n' +
      '  bun run cursor:compact-global-state\n',
  );
  process.exit(1);
}

const globalDir = path.dirname(dbPath);
const suffix = `.bak.${stamp()}`;
for (const name of ['state.vscdb', 'state.vscdb-wal', 'state.vscdb-shm']) {
  const src = path.join(globalDir, name);
  if (!existsSync(src)) continue;
  const dest = `${src}${suffix}`;
  renameSync(src, dest);
  process.stdout.write(`  renamed ${name} → ${path.basename(dest)}\n`);
}

const pruned = pruneStateVscdbBackups();
if (pruned.removedFiles > 0) {
  process.stdout.write(
    `[cursor:compact-global-state] pruned ${pruned.removedFiles} old backup(s), reclaimed ~${pruned.reclaimedMb.toFixed(0)}MB disk\n`,
  );
}

process.stdout.write(
  `[cursor:compact-global-state] reclaimed ~${sizeMb.toFixed(0)}MB disk — reopen Cursor (fresh global state DB)\n`,
);
process.stdout.write(
  '[cursor:compact-global-state] disk only — does not reduce RAM; run only after freeing apps (Track C)\n',
);
