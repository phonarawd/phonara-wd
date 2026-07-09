import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { bytesToMb, cursorWorkspaceStorageDir, dirSizeBytes } from './cursor-metadata-sizes';

export type StaleWorkspaceEntry = {
  id: string;
  mb: number;
  label: string;
  diskPath: string;
  storagePath: string;
};

function decodeWorkspaceFolderUri(folderUri: string): string | null {
  if (!folderUri.startsWith('file:///')) return null;
  const decoded = decodeURIComponent(folderUri.replace('file:///', ''));
  return decoded.replace(/\//g, path.sep);
}

export function listStaleWorkspaceStorage(): StaleWorkspaceEntry[] {
  const root = cursorWorkspaceStorageDir();
  if (!existsSync(root)) return [];

  const stale: StaleWorkspaceEntry[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const storagePath = path.join(root, entry.name);
    const wsJson = path.join(storagePath, 'workspace.json');
    if (!existsSync(wsJson)) continue;

    let folderUri: string;
    try {
      const parsed = JSON.parse(readFileSync(wsJson, 'utf8')) as { folder?: string };
      folderUri = parsed.folder ?? '';
    } catch {
      continue;
    }

    const diskPath = decodeWorkspaceFolderUri(folderUri);
    if (!diskPath || existsSync(diskPath)) continue;

    const mb = bytesToMb(dirSizeBytes(storagePath));
    const label = diskPath.length > 70 ? `…${diskPath.slice(-67)}` : diskPath;
    stale.push({ id: entry.name, mb, label, diskPath, storagePath });
  }

  return stale.sort((a, b) => b.mb - a.mb);
}

export function removeStaleWorkspaceStorage(options: { apply?: boolean } = {}): {
  removed: number;
  reclaimedMb: number;
  entries: StaleWorkspaceEntry[];
} {
  const entries = listStaleWorkspaceStorage();
  if (!options.apply) {
    return { removed: 0, reclaimedMb: entries.reduce((sum, e) => sum + e.mb, 0), entries };
  }

  let removed = 0;
  let reclaimedMb = 0;
  for (const entry of entries) {
    try {
      rmSync(entry.storagePath, { recursive: true, force: true });
      removed += 1;
      reclaimedMb += entry.mb;
    } catch {
      // Skip locked or unreadable paths.
    }
  }
  return { removed, reclaimedMb, entries };
}
