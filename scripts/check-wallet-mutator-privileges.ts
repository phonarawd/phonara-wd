/**
 * Phase 0 — read-only wallet mutator EXECUTE privilege audit.
 * FAIL if rpc_credit/debit/lock/unlock_wallet end granted to anon or authenticated
 * after the P0 lockdown migration, or if lockdown revoke is missing.
 *
 * Historical GRANT after lockdown is allowed only when a later migration REVOKE
 * restores the locked-down final state (H-02 / R3-a).
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

type ClientRole = 'anon' | 'authenticated';

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const violations: string[] = [];
let sawLockdown = false;

/** Final net client EXECUTE grant state after lockdown (true = granted). */
const clientGrant = new Map<string, Set<ClientRole>>();

for (const fn of MUTATORS) {
  clientGrant.set(fn, new Set());
}

const grantPattern = (fn: string) =>
  new RegExp(
    `GRANT\\s+(?:ALL|EXECUTE)\\s+ON\\s+FUNCTION\\s+(?:public\\.)?${fn}\\b[^;]*\\s+TO\\s+([^;]+)`,
    'gi',
  );

const revokePattern = (fn: string) =>
  new RegExp(
    `REVOKE\\s+(?:ALL|EXECUTE)\\s+ON\\s+FUNCTION\\s+(?:public\\.)?${fn}\\b[^;]*\\s+FROM\\s+([^;]+)`,
    'gi',
  );

function parseRoles(clause: string): ClientRole[] {
  const roles: ClientRole[] = [];
  if (/\banon\b/i.test(clause)) roles.push('anon');
  if (/\bauthenticated\b/i.test(clause)) roles.push('authenticated');
  return roles;
}

for (const name of files) {
  const text = readFileSync(join(MIGRATIONS_DIR, name), 'utf8');
  if (name === LOCKDOWN_FILE) {
    sawLockdown = true;
    continue;
  }
  if (!sawLockdown) continue;

  for (const fn of MUTATORS) {
    const grants = clientGrant.get(fn)!;
    for (const match of text.matchAll(grantPattern(fn))) {
      for (const role of parseRoles(match[1] ?? '')) {
        grants.add(role);
      }
    }
    for (const match of text.matchAll(revokePattern(fn))) {
      const from = match[1] ?? '';
      for (const role of parseRoles(from)) {
        grants.delete(role);
      }
      // REVOKE ALL ... FROM PUBLIC also clears default PUBLIC grants; treat as
      // client lockdown when anon/authenticated are listed or ALL FROM PUBLIC.
      if (/\bPUBLIC\b/i.test(from) && !/\bauthenticated\b/i.test(from) && !/\banon\b/i.test(from)) {
        // PUBLIC alone does not remove role-specific GRANTs in Postgres.
      }
    }
  }
}

if (!sawLockdown) {
  violations.push(`missing ${LOCKDOWN_FILE}`);
}

const lockdownText = readFileSync(join(MIGRATIONS_DIR, LOCKDOWN_FILE), 'utf8');
for (const fn of MUTATORS) {
  if (!lockdownText.includes(`'${fn}'`)) {
    violations.push(`${fn} missing from ${LOCKDOWN_FILE} revoke list`);
  }

  const leftover = clientGrant.get(fn)!;
  if (leftover.size > 0) {
    violations.push(
      `${fn} still EXECUTE-granted to ${[...leftover].sort().join(',')} after final migration state`,
    );
  }
}

if (violations.length > 0) {
  console.error('check:wallet-mutators FAIL:');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

process.stdout.write(
  `check:wallet-mutators OK — ${MUTATORS.length} generic mutators locked down (final state after ${LOCKDOWN_FILE})\n`,
);
