/**
 * Remove Cursor workspaceStorage folders whose workspace path no longer exists on disk.
 * Safe: never touches the current phonara-gb workspace.
 *
 * Dry-run (default): bun run cursor:clean-stale-workspaces
 * Apply:            bun run cursor:clean-stale-workspaces -- --apply
 */
import { execSync } from 'node:child_process';
import {
  listStaleWorkspaceStorage,
  removeStaleWorkspaceStorage,
} from './lib/cursor-stale-workspaces';

const apply = process.argv.includes('--apply');

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

const stale = listStaleWorkspaceStorage();
const totalMb = stale.reduce((sum, entry) => sum + entry.mb, 0);

process.stdout.write('[cursor:clean-stale-workspaces] scan complete\n');
process.stdout.write(`  stale folders: ${stale.length} · reclaimable ~${totalMb.toFixed(1)}MB\n`);

if (stale.length === 0) {
  process.stdout.write('[cursor:clean-stale-workspaces] nothing to remove\n');
  process.exit(0);
}

for (const entry of stale.slice(0, 8)) {
  process.stdout.write(`  ${entry.mb.toFixed(1)}MB · ${entry.label}\n`);
}
if (stale.length > 8) {
  process.stdout.write(`  … +${stale.length - 8} more\n`);
}

if (!apply) {
  process.stdout.write(
    '[cursor:clean-stale-workspaces] dry-run — rerun with --apply to delete (Cursor quit recommended)\n',
  );
  process.exit(0);
}

if (isCursorRunning()) {
  process.stderr.write(
    '[cursor:clean-stale-workspaces] WARN — Cursor is running; some folders may be locked.\n' +
      '  Fully quit Cursor (tray) for best results, then rerun with --apply\n',
  );
}

const result = removeStaleWorkspaceStorage({ apply: true });
process.stdout.write(
  `[cursor:clean-stale-workspaces] removed ${result.removed}/${stale.length} folder(s) · ~${result.reclaimedMb.toFixed(1)}MB\n`,
);
