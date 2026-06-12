import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Enforces the append-only migration invariant (see .cursor/rules/25-postgres).
// Every applied migration is frozen by content hash in supabase/migrations.lock.json.
// After that, editing or deleting a frozen migration fails the check: changes must
// go into a NEW migration file instead. New files are frozen via `bun run lock:migrations`.
//
// Modes:
//   (default)  verify current migrations match the lock; fail on drift or unlocked files
//   --write    freeze any new migration files into the lock (never rewrites frozen ones)

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const LOCK_PATH = join(process.cwd(), 'supabase', 'migrations.lock.json');
const writeMode = process.argv.includes('--write');

interface Lock {
  algorithm: string;
  migrations: Record<string, string>;
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function readMigrations(): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(MIGRATIONS_DIR)) return map;
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const name of files) {
    map.set(name, sha256(readFileSync(join(MIGRATIONS_DIR, name), 'utf8')));
  }
  return map;
}

function readLock(): Lock {
  if (!existsSync(LOCK_PATH)) return { algorithm: 'sha256', migrations: {} };
  return JSON.parse(readFileSync(LOCK_PATH, 'utf8')) as Lock;
}

function writeLock(migrations: Record<string, string>): void {
  const sorted = Object.fromEntries(
    Object.entries(migrations).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(
    LOCK_PATH,
    `${JSON.stringify({ algorithm: 'sha256', migrations: sorted }, null, 2)}\n`,
    'utf8',
  );
}

const current = readMigrations();
const locked = readLock().migrations ?? {};

const violations: string[] = [];
for (const [name, hash] of Object.entries(locked)) {
  const cur = current.get(name);
  if (cur === undefined) {
    violations.push(`deleted applied migration: ${name}`);
  } else if (cur !== hash) {
    violations.push(`modified applied migration (append-only violation): ${name}`);
  }
}

const newFiles = [...current.keys()].filter((name) => !(name in locked));

if (writeMode) {
  if (violations.length > 0) {
    console.error('lock:migrations refused — append-only violations must be reverted first:');
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
  }
  const merged: Record<string, string> = { ...locked };
  for (const name of newFiles) {
    const hash = current.get(name);
    if (hash) merged[name] = hash;
  }
  writeLock(merged);
  console.log(
    `lock:migrations: froze ${newFiles.length} new migration(s); ${Object.keys(merged).length} total locked.`,
  );
  process.exit(0);
}

const problems = [...violations];
for (const name of newFiles) {
  problems.push(`unlocked migration (run \`bun run lock:migrations\`): ${name}`);
}

if (problems.length > 0) {
  console.error('check:migrations: append-only integrity check failed:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`check:migrations: OK (${current.size} migrations match the append-only lock).`);
