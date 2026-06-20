#!/usr/bin/env tsx
/**
 * Ground-truth vs legacy-regex blind-spot report (live DB only).
 */
import { findSupabaseDbContainer } from '../lib/db-connect.ts';
import { sqlExec } from '../pentest/lib/sql-rpc.ts';
import {
  BALANCE_CALLEE_HELPERS,
  buildDetectionContext,
  hasSystemLiveGuard,
  isBalanceMoving,
  isGuardedByCalleeOrSelf,
  type RpcDefRow,
} from './guard-coverage-detect.ts';
import { isAllowlisted } from './guard-coverage-allowlist.ts';

const LEGACY_BALANCE_RE =
  /_credit_wallet|_debit_wallet|_lock_wallet|_unlock_wallet|_debit_locked/i;

interface RpcRow extends RpcDefRow {
  authenticated: boolean;
}

function loadRpcRows(): RpcRow[] {
  const raw = sqlExec(`
    SELECT json_agg(row_to_json(t) ORDER BY t.name, t.args)
    FROM (
      SELECT p.proname AS name,
             pg_get_function_identity_arguments(p.oid) AS args,
             pg_get_functiondef(p.oid) AS def,
             has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname LIKE 'rpc_%'
    ) t;
  `);
  if (!raw.ok) throw new Error(raw.error);
  return JSON.parse(raw.stdout.trim() || '[]') as RpcRow[];
}

function loadHelperRows(): RpcDefRow[] {
  const names = BALANCE_CALLEE_HELPERS.map((n) => `'${n}'`).join(', ');
  const raw = sqlExec(`
    SELECT json_agg(row_to_json(t) ORDER BY t.name, t.args)
    FROM (
      SELECT p.proname AS name,
             pg_get_function_identity_arguments(p.oid) AS args,
             pg_get_functiondef(p.oid) AS def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname IN (${names})
    ) t;
  `);
  if (!raw.ok) return [];
  return JSON.parse(raw.stdout.trim() || '[]') as RpcDefRow[];
}

function classify(row: RpcRow, ctx: ReturnType<typeof buildDetectionContext>): string {
  if (!isBalanceMoving(row.def, ctx)) return '-';
  if (isGuardedByCalleeOrSelf(row.def, row.name, ctx)) return 'C';
  if (isAllowlisted(row.name, row.args, 'system-live-exempt')) return 'C';
  return 'B';
}

function main(): void {
  if (!findSupabaseDbContainer() && !process.env.SUPABASE_DB_URL) {
    console.error('[guard-coverage-report] no live DB');
    process.exit(1);
  }

  const rows = loadRpcRows();
  const helpers = loadHelperRows();
  const ctx = buildDetectionContext(rows, helpers);

  const truth = rows.filter((r) => isBalanceMoving(r.def, ctx));
  const legacy = rows.filter((r) => LEGACY_BALANCE_RE.test(r.def));
  const legacySet = new Set(legacy.map((r) => `${r.name}::${r.args}`));
  const newlyDetected = truth.filter((r) => !legacySet.has(`${r.name}::${r.args}`));

  console.log(`[guard-coverage-report] rpc_* total: ${rows.length}`);
  console.log(`[guard-coverage-report] ground-truth balance-moving: ${truth.length}`);
  console.log(`[guard-coverage-report] legacy regex balance-moving: ${legacy.length}`);
  console.log(`[guard-coverage-report] newly detected (blind-spot fixes): ${newlyDetected.length}`);
  console.log('');

  console.log('| 함수 | balance-moving | system_live(self) | 분류 | 근거 |');
  console.log('|------|----------------|---------------------|------|------|');
  for (const r of newlyDetected.sort((a, b) => a.name.localeCompare(b.name))) {
    const selfGuard = hasSystemLiveGuard(r.def) ? 'Y' : 'N';
    const cls = classify(r, ctx);
    const reason =
      cls === 'C'
        ? isAllowlisted(r.name, r.args, 'system-live-exempt')
          ? 'allowlist'
          : 'self/callee guard'
        : 'missing guard';
    console.log(`| ${r.name}(${r.args || '∅'}) | true | ${selfGuard} | ${cls} | ${reason} |`);
  }
}

main();
