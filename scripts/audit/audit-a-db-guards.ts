#!/usr/bin/env tsx
/**
 * Section A — live DB guard/GRANT audit (read-only). Writes JSON report to scripts/audit/.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BALANCE_CALLEE_HELPERS,
  buildDetectionContext,
  isBalanceMoving,
  isGuardedByCalleeOrSelf,
  type RpcDefRow,
} from '../check/guard-coverage-allowlist.ts';
import { isAllowlisted } from '../check/guard-coverage-allowlist.ts';
import { findSupabaseDbContainer } from '../lib/db-connect.ts';
import { sqlExec } from '../pentest/lib/sql-rpc.ts';

interface RpcRow {
  name: string;
  args: string;
  def: string;
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

function scalar(sql: string): string {
  const r = sqlExec(sql);
  if (!r.ok) throw new Error(r.error);
  return r.stdout.trim();
}

function main(): void {
  if (!findSupabaseDbContainer() && !process.env.SUPABASE_DB_URL) {
    console.error('[audit-a-db-guards] no live DB');
    process.exit(1);
  }

  const rows = loadRpcRows();
  const helpers = loadHelperRows();
  const ctx = buildDetectionContext(rows, helpers);

  const balanceMoving = rows.filter((r) => isBalanceMoving(r.def, ctx));
  const aal2Gaps = rows.filter(
    (r) =>
      r.def.includes('_is_admin()') &&
      r.authenticated &&
      !r.def.includes('_assert_admin_aal2()') &&
      !isAllowlisted(r.name, r.args, 'aal2-exempt'),
  );
  const systemLiveGaps = rows.filter(
    (r) =>
      isBalanceMoving(r.def, ctx) &&
      !isGuardedByCalleeOrSelf(r.def, r.name, ctx) &&
      !isAllowlisted(r.name, r.args, 'system-live-exempt'),
  );

  const authUidGaps = rows.filter(
    (r) =>
      r.authenticated &&
      isBalanceMoving(r.def, ctx) &&
      !r.def.includes('auth.uid()') &&
      !r.def.includes('_is_admin()'),
  );

  const rateLimitGaps = rows.filter(
    (r) =>
      r.authenticated &&
      isBalanceMoving(r.def, ctx) &&
      !r.def.includes('_enforce_rate_limit') &&
      !r.def.includes('_is_admin()'),
  );

  const internalExposed = sqlExec(`
    SELECT json_agg(row_to_json(t) ORDER BY t.name, t.args)
    FROM (
      SELECT p.proname AS name,
             pg_get_function_identity_arguments(p.oid) AS args,
             has_function_privilege('anon', p.oid, 'EXECUTE') AS anon,
             has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth,
             prosecdef AS security_definer
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname LIKE '\\_%' ESCAPE '\\'
        AND (has_function_privilege('anon', p.oid, 'EXECUTE')
          OR has_function_privilege('authenticated', p.oid, 'EXECUTE'))
    ) t;
  `);

  const appConfig = sqlExec(
    `SELECT json_agg(row_to_json(t) ORDER BY t.key) FROM (SELECT key, value, updated_at FROM app_config WHERE key IN ('system_halt','system_readonly')) t;`,
  );
  const recon = sqlExec(`
    SELECT json_agg(row_to_json(t) ORDER BY t.run_at DESC)
    FROM (
      SELECT run_at, currency, is_match, delta, triggered_halt, check_type, broken_count
      FROM reconciliation_log
      ORDER BY run_at DESC
      LIMIT 10
    ) t;
  `);

  const report = {
    ranAt: new Date().toISOString(),
    scope: 'A — live DB guards / GRANT / REVOKE (read-only)',
    rpcTotal: rows.length,
    rpcAuthenticatedExec: rows.filter((r) => r.authenticated).length,
    rpcAnonExec: scalar(`
      SELECT COUNT(*)::text FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname LIKE 'rpc_%'
        AND has_function_privilege('anon', p.oid, 'EXECUTE')
    `),
    internalHelperTotal: scalar(`
      SELECT COUNT(*)::text FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname LIKE '\\_%' ESCAPE '\\'
    `),
    balanceMovingCount: balanceMoving.length,
    guardGaps: {
      aal2: aal2Gaps.map((r) => ({ name: r.name, args: r.args })),
      systemLive: systemLiveGaps.map((r) => ({ name: r.name, args: r.args })),
      authUid: authUidGaps.map((r) => ({ name: r.name, args: r.args })),
      rateLimit: rateLimitGaps.map((r) => ({ name: r.name, args: r.args })),
    },
    internalExposedToClient: internalExposed.ok
      ? (JSON.parse(internalExposed.stdout.trim() || '[]') as unknown[])
      : [],
    appConfig: appConfig.ok ? JSON.parse(appConfig.stdout.trim() || '[]') : [],
    reconciliationRecent: recon.ok ? JSON.parse(recon.stdout.trim() || '[]') : [],
    verdict: {
      guardCoveragePass: aal2Gaps.length === 0 && systemLiveGaps.length === 0,
      p0Blockers: aal2Gaps.length + systemLiveGaps.length + authUidGaps.length,
    },
  };

  const outPath = join(process.cwd(), 'scripts', 'audit', 'last-a-db-guards-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ outPath, ...report.verdict, rpcTotal: report.rpcTotal }, null, 2));
}

main();
