/**
 * Phase 0 — read-only wallet mutator EXECUTE privilege audit.
 * FAIL if rpc_credit/debit/lock/unlock_wallet are granted to anon or authenticated
 * after the P0 lockdown migration, or if lockdown revoke is missing.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const LOCKDOWN_FILE = '20260609000010_p0_lockdown_internal_funcs.sql';
const MUTATORS = [
  'rpc_credit_wallet',
  'rpc_debit_wallet',
  'rpc_lock_wallet',
  'rpc_unlock_wallet',
] as const;

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

let postLockdown = '';
let sawLockdown = false;

for (const name of files) {
  const text = readFileSync(join(MIGRATIONS_DIR, name), 'utf8');
  if (name === LOCKDOWN_FILE) {
    sawLockdown = true;
    continue;
  }
  if (sawLockdown) {
    postLockdown += text + '\n';
  }
}

const violations: string[] = [];

if (!sawLockdown) {
  violations.push(`missing ${LOCKDOWN_FILE}`);
}

const lockdownText = readFileSync(join(MIGRATIONS_DIR, LOCKDOWN_FILE), 'utf8');
for (const fn of MUTATORS) {
  if (!lockdownText.includes(`'${fn}'`)) {
    violations.push(`${fn} missing from ${LOCKDOWN_FILE} revoke list`);
  }

  const grantPattern = new RegExp(
    `GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+${fn}[^;]*\\s+TO\\s+(anon|authenticated)`,
    'gi',
  );
  if (grantPattern.test(postLockdown)) {
    violations.push(`${fn} re-granted EXECUTE to anon/authenticated after lockdown`);
  }
}

if (violations.length > 0) {
  console.error('check:wallet-mutators FAIL:');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

process.stdout.write(
  `check:wallet-mutators OK — ${MUTATORS.length} generic mutators locked down in ${LOCKDOWN_FILE}\n`,
);
