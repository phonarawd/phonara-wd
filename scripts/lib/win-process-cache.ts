/**
 * Short TTL cache for expensive Win32 CIM / PowerShell process probes.
 * Low-spec PCs: cursor:status + hygiene + hooks share the same snapshot.
 */

const DEFAULT_TTL_MS = 4_000;

type CacheEntry<T> = { value: T; at: number };

let repoProcessCache: CacheEntry<unknown> | null = null;

export function withProcessCache<T>(ttlMs: number, loader: () => T): T {
  const now = Date.now();
  if (repoProcessCache && now - repoProcessCache.at < ttlMs) {
    return repoProcessCache.value as T;
  }
  const value = loader();
  repoProcessCache = { value, at: now };
  return value;
}

export function clearProcessCache(): void {
  repoProcessCache = null;
}

export const PROCESS_CACHE_TTL_MS = DEFAULT_TTL_MS;
