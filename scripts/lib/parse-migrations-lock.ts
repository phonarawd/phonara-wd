/**
 * Single SOT for migrations.lock.json parity — gate-phase0 · migrations-index-ready · check:migrations.
 * Do not duplicate lock parsing elsewhere; import this module only.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type MigrationsLockStatus = 'ok' | 'drift' | 'missing_lock' | 'parse_error';

export interface MigrationsLockParseResult {
  status: MigrationsLockStatus;
  locked_count: number;
  current_count: number;
  violation_count: number;
  violations: string[];
  unlocked_count: number;
  unlocked: string[];
  parse_error: string | null;
}

interface LockFile {
  algorithm: string;
  migrations: Record<string, string>;
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/** Match .gitattributes `eol=lf` — hash git-normalized content on all platforms. */
function normalizeMigrationText(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

function readCurrentMigrations(migrationsDir: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(migrationsDir)) return map;
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  for (const name of files) {
    const raw = readFileSync(path.join(migrationsDir, name), 'utf8');
    map.set(name, sha256(normalizeMigrationText(raw)));
  }
  return map;
}

export function parseMigrationsLock(options?: { repoRoot?: string }): MigrationsLockParseResult {
  const repoRoot = options?.repoRoot ?? REPO_ROOT;
  const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
  const lockPath = path.join(repoRoot, 'supabase', 'migrations.lock.json');

  let lock: LockFile | null;
  try {
    if (!existsSync(lockPath)) {
      return {
        status: 'missing_lock',
        locked_count: 0,
        current_count: 0,
        violation_count: 0,
        violations: [],
        unlocked_count: 0,
        unlocked: [],
        parse_error: 'migrations.lock.json missing',
      };
    }
    lock = JSON.parse(readFileSync(lockPath, 'utf8')) as LockFile;
    if (!lock?.migrations || typeof lock.migrations !== 'object') {
      return {
        status: 'parse_error',
        locked_count: 0,
        current_count: 0,
        violation_count: 0,
        violations: [],
        unlocked_count: 0,
        unlocked: [],
        parse_error: 'migrations.lock.json invalid shape',
      };
    }
  } catch (error) {
    return {
      status: 'parse_error',
      locked_count: 0,
      current_count: 0,
      violation_count: 0,
      violations: [],
      unlocked_count: 0,
      unlocked: [],
      parse_error: error instanceof Error ? error.message : 'migrations.lock.json parse failed',
    };
  }

  const current = readCurrentMigrations(migrationsDir);
  const locked = lock.migrations ?? {};
  const violations: string[] = [];

  for (const [name, hash] of Object.entries(locked)) {
    const cur = current.get(name);
    if (cur === undefined) {
      violations.push(`deleted applied migration: ${name}`);
    } else if (cur !== hash) {
      violations.push(`modified applied migration (append-only violation): ${name}`);
    }
  }

  const unlocked = [...current.keys()].filter((name) => !(name in locked));
  for (const name of unlocked) {
    violations.push(`unlocked migration (run lock:migrations): ${name}`);
  }

  if (violations.length > 0) {
    return {
      status: 'drift',
      locked_count: Object.keys(locked).length,
      current_count: current.size,
      violation_count: violations.length,
      violations,
      unlocked_count: unlocked.length,
      unlocked,
      parse_error: null,
    };
  }

  return {
    status: 'ok',
    locked_count: Object.keys(locked).length,
    current_count: current.size,
    violation_count: 0,
    violations: [],
    unlocked_count: 0,
    unlocked: [],
    parse_error: null,
  };
}

export const PARSE_MIGRATIONS_LOCK_REPO_ROOT = REPO_ROOT;
