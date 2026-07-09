import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { bytesToMb, cursorGlobalStateDbPath } from './cursor-metadata-sizes';

const BACKUP_NAME_RE = /^state\.vscdb(?:-wal|-shm)?\.bak\./;
const LEGACY_BACKUP = 'state.vscdb.backup';

export type VscdbBackupPruneResult = {
  removedFiles: number;
  reclaimedMb: number;
  remainingMb: number;
};

function globalStorageDir(): string {
  return path.dirname(cursorGlobalStateDbPath());
}

/** Old compact backups — safe to delete while Cursor is running (active DB untouched). */
export function listStateVscdbBackupFiles(): { name: string; bytes: number }[] {
  const dir = globalStorageDir();
  if (!existsSync(dir)) return [];

  const entries: { name: string; bytes: number }[] = [];
  for (const name of readdirSync(dir)) {
    if (!BACKUP_NAME_RE.test(name) && name !== LEGACY_BACKUP) continue;
    const full = path.join(dir, name);
    try {
      const stat = statSync(full);
      if (stat.isFile()) entries.push({ name, bytes: stat.size });
    } catch {
      // Skip unreadable paths.
    }
  }
  return entries.sort((a, b) => b.bytes - a.bytes);
}

export function stateVscdbBackupBytes(): number {
  return listStateVscdbBackupFiles().reduce((sum, e) => sum + e.bytes, 0);
}

export function pruneStateVscdbBackups(options?: { dryRun?: boolean }): VscdbBackupPruneResult {
  const dryRun = options?.dryRun ?? false;
  const backups = listStateVscdbBackupFiles();
  let reclaimedBytes = 0;
  let removedFiles = 0;

  for (const entry of backups) {
    reclaimedBytes += entry.bytes;
    if (dryRun) continue;
    try {
      rmSync(path.join(globalStorageDir(), entry.name), { force: true });
      removedFiles += 1;
    } catch {
      // Skip locked/unreadable files.
    }
  }

  return {
    removedFiles: dryRun ? 0 : removedFiles,
    reclaimedMb: bytesToMb(reclaimedBytes),
    remainingMb: bytesToMb(stateVscdbBackupBytes()),
  };
}
