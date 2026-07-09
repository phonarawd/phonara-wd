#!/usr/bin/env tsx
/**
 * Read-only replay of grants_rls_inventory_test.sql privilege pins against live local DB.
 * No writes — SELECT / has_*_privilege only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findSupabaseDbContainer } from '../lib/db-connect.ts';
import { sqlExec } from '../pentest/lib/sql-rpc.ts';

interface Pin {
  negate: boolean;
  role: string;
  object: string;
  privilege: string;
  kind: 'table' | 'function';
}

function parseInventoryPins(sql: string): Pin[] {
  const re =
    /ASSERT (NOT )?has_(table|function)_privilege\('(\w+)',\s*'public\.([^']+)',\s*'(\w+)'\)/g;
  const pins: Pin[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    pins.push({
      negate: Boolean(m[1]),
      kind: m[2] as 'table' | 'function',
      role: m[3]!,
      object: m[4]!,
      privilege: m[5]!,
    });
  }
  return pins;
}

function checkPin(pin: Pin): { ok: boolean; actual: boolean | null; error: string } {
  const fn = pin.kind === 'function' ? 'has_function_privilege' : 'has_table_privilege';
  const q = `SELECT ${fn}('${pin.role}', 'public.${pin.object}', '${pin.privilege}') AS actual;`;
  const res = sqlExec(q);
  if (!res.ok) return { ok: false, actual: null, error: res.error || 'query failed' };
  const actual = res.stdout.trim() === 't';
  const expected = !pin.negate;
  return { ok: actual === expected, actual, error: '' };
}

function main(): void {
  if (!findSupabaseDbContainer() && !process.env.SUPABASE_DB_URL) {
    console.error('[replay-grants-inventory] no live DB');
    process.exit(1);
  }

  const sqlPath = join(process.cwd(), 'supabase', 'tests', 'grants_rls_inventory_test.sql');
  const pins = parseInventoryPins(readFileSync(sqlPath, 'utf8'));

  const mismatches: Array<{ pin: Pin; actual: boolean | null; error: string }> = [];
  for (const pin of pins) {
    const r = checkPin(pin);
    if (!r.ok) mismatches.push({ pin, actual: r.actual, error: r.error });
  }

  const tablePins = pins.filter((p) => p.kind === 'table').length;
  const fnPins = pins.filter((p) => p.kind === 'function').length;

  console.log(
    `[replay-grants-inventory] pins total=${pins.length} (table=${tablePins}, function=${fnPins})`,
  );
  console.log(`[replay-grants-inventory] mismatches=${mismatches.length}`);

  for (const m of mismatches) {
    const { pin, actual, error } = m;
    const expect = pin.negate ? 'deny' : 'allow';
    if (error) {
      console.log(`  - QUERY_FAIL ${pin.role} ${pin.privilege} ${pin.object}: ${error}`);
    } else {
      console.log(
        `  - ${pin.role} ${pin.privilege} ${pin.object} expected=${expect} actual=${actual ? 'allow' : 'deny'}`,
      );
    }
  }

  // Loop guards from inventory DO block (read-only equivalents)
  const loopChecks = [
    {
      name: 'rls_off_tables',
      sql: `SELECT COALESCE(string_agg(c.relname, ' ' ORDER BY c.relname), '') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity`,
    },
    {
      name: 'anon_write_tables',
      sql: `SELECT COALESCE(string_agg(c.relname, ' ' ORDER BY c.relname), '') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND (has_table_privilege('anon', c.oid, 'INSERT') OR has_table_privilege('anon', c.oid, 'UPDATE') OR has_table_privilege('anon', c.oid, 'DELETE') OR has_table_privilege('anon', c.oid, 'TRUNCATE'))`,
    },
    {
      name: 'auth_write_non_allowlist',
      sql: `SELECT COALESCE(string_agg(c.relname, ' ' ORDER BY c.relname), '') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname NOT IN ('profiles','push_subscriptions') AND (has_table_privilege('authenticated', c.oid, 'INSERT') OR has_table_privilege('authenticated', c.oid, 'UPDATE') OR has_table_privilege('authenticated', c.oid, 'DELETE') OR has_table_privilege('authenticated', c.oid, 'TRUNCATE'))`,
    },
  ];

  for (const lc of loopChecks) {
    const res = sqlExec(lc.sql);
    const val = res.ok ? res.stdout.trim() : `QUERY_FAIL:${res.error}`;
    const pass = res.ok && val === '';
    console.log(
      `[replay-grants-inventory] loop ${lc.name}: ${pass ? 'PASS (empty)' : `FAIL (${val || 'non-empty'})`}`,
    );
    if (!pass) process.exitCode = 1;
  }

  if (mismatches.length > 0) process.exit(1);
}

main();
