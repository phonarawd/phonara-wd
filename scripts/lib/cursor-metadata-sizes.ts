import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export function dirSizeBytes(dirPath: string): number {
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

/** Bounded-depth size — fast enough for sessionStart / cursor:status (default). */
export function shallowDirSizeBytes(dirPath: string, maxDepth = 2): number {
  if (!existsSync(dirPath) || maxDepth < 0) return 0;

  let total = 0;
  const walk = (current: string, depth: number): void => {
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      try {
        if (entry.isDirectory()) {
          if (depth < maxDepth) walk(full, depth + 1);
          continue;
        }
        if (entry.isFile()) {
          total += statSync(full).size;
        }
      } catch {
        // Skip unreadable paths.
      }
    }
  };

  walk(dirPath, 0);
  return total;
}

export function fileSizeBytes(filePath: string): number {
  if (!existsSync(filePath)) return 0;
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}

export function cursorAppDataRoot(): string {
  return path.join(process.env.APPDATA ?? path.join(homedir(), 'AppData', 'Roaming'), 'Cursor');
}

export function cursorGlobalStateDbPath(): string {
  return path.join(cursorAppDataRoot(), 'User', 'globalStorage', 'state.vscdb');
}

export function cursorLogsDir(): string {
  return path.join(cursorAppDataRoot(), 'logs');
}

export function cursorSnapshotsDir(): string {
  return path.join(cursorAppDataRoot(), 'snapshots');
}

export function cursorAiTrackingDir(): string {
  return path.join(homedir(), '.cursor', 'ai-tracking');
}

export function cursorWorkspaceStorageDir(): string {
  return path.join(cursorAppDataRoot(), 'User', 'workspaceStorage');
}

export function cursorUserDir(): string {
  return path.join(cursorAppDataRoot(), 'User');
}

/** Top-level User/ dirs measured explicitly — not recursive User walk. */
const KNOWN_USER_TOP_LEVEL = new Set(['globalStorage', 'workspaceStorage', 'History', 'snippets']);

export const OTHER_USER_DIR_WARN_MB = 200;

export type CursorUserStateBreakdown = {
  trackedMb: number;
  otherMb: number;
  otherDirs: { name: string; mb: number }[];
  totalMb: number;
};

export function globalStorageVscdbBytes(): number {
  const base = path.join(cursorUserDir(), 'globalStorage');
  let total = 0;
  for (const name of ['state.vscdb', 'state.vscdb-wal', 'state.vscdb-shm']) {
    total += fileSizeBytes(path.join(base, name));
  }
  return total;
}

/** Fast User size: known paths + 1-depth untracked dirs (no full User recurse). */
export function measureCursorUserState(): CursorUserStateBreakdown {
  const userDir = cursorUserDir();
  if (!existsSync(userDir)) {
    return { trackedMb: 0, otherMb: 0, otherDirs: [], totalMb: 0 };
  }

  let trackedBytes = globalStorageVscdbBytes();
  trackedBytes += dirSizeBytes(cursorWorkspaceStorageDir());
  const historyDir = path.join(userDir, 'History');
  if (existsSync(historyDir)) {
    trackedBytes += dirSizeBytes(historyDir);
  }

  const otherDirs: { name: string; mb: number }[] = [];
  let otherBytes = 0;
  for (const entry of readdirSync(userDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (KNOWN_USER_TOP_LEVEL.has(entry.name)) continue;
    const dirBytes = dirSizeBytes(path.join(userDir, entry.name));
    const mb = bytesToMb(dirBytes);
    if (mb > 0) {
      otherDirs.push({ name: entry.name, mb });
      otherBytes += dirBytes;
    }
  }
  otherDirs.sort((a, b) => b.mb - a.mb);

  const trackedMb = bytesToMb(trackedBytes);
  const otherMb = bytesToMb(otherBytes);
  return {
    trackedMb,
    otherMb,
    otherDirs,
    totalMb: trackedMb + otherMb,
  };
}

export function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024);
}
