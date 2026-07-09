/**
 * Delete accumulated state.vscdb.bak.* files (safe while Cursor is running).
 */
import { pruneStateVscdbBackups, stateVscdbBackupBytes } from './lib/cursor-vscdb-backup-prune';
import { bytesToMb } from './lib/cursor-metadata-sizes';

const dryRun = process.argv.includes('--dry-run');
const beforeMb = bytesToMb(stateVscdbBackupBytes());

process.stdout.write(
  `[cursor:prune-vscdb-backups] before: ${beforeMb.toFixed(1)}MB backup file(s)\n`,
);

if (beforeMb < 1) {
  process.stdout.write('[cursor:prune-vscdb-backups] nothing to prune\n');
  process.exit(0);
}

const result = pruneStateVscdbBackups({ dryRun });
if (dryRun) {
  process.stdout.write(
    `[cursor:prune-vscdb-backups] dry-run — would reclaim ~${result.reclaimedMb.toFixed(0)}MB\n`,
  );
} else {
  process.stdout.write(
    `[cursor:prune-vscdb-backups] removed ${result.removedFiles} file(s), reclaimed ~${result.reclaimedMb.toFixed(0)}MB disk\n`,
  );
}
