#!/usr/bin/env tsx
/**
 * Static guard coverage gate — fails when rpc_* lacks required AAL2/system_live guards.
 * Source: live pg_get_functiondef (preferred) or supabase/functions-sql/current mirror.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findSupabaseDbContainer } from '../lib/db-connect.ts';
import { sqlExec } from '../pentest/lib/sql-rpc.ts';
import {
  BALANCE_CALLEE_HELPERS,
  buildDetectionContext,
  isAllowlisted,
  isBalanceMoving,
  isGuardedByCalleeOrSelf,
  type RpcDefRow,
} from './guard-coverage-allowlist.ts';

interface RpcRow extends RpcDefRow {
  authenticated: boolean;
}

interface Violation {
  rule: 'missing-aal2' | 'missing-system-live';
  name: string;
  args: string;
  detail: string;
}

const MIRROR_DIR = join(process.cwd(), 'supabase', 'functions-sql', 'current');
const selfTest = process.argv.includes('--self-test');
const strict = process.env.PHONARA_GUARD_COVERAGE_STRICT === '1';

function loadHelpersFromLiveDb(): RpcDefRow[] {
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

function loadFromLiveDb(): RpcRow[] | null {
  if (!findSupabaseDbContainer() && !process.env.SUPABASE_DB_URL) return null;

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

  if (!raw.ok) return null;
  return JSON.parse(raw.stdout.trim() || '[]') as RpcRow[];
}

function loadFromMirror(): RpcRow[] | null {
  if (!existsSync(MIRROR_DIR)) return null;

  const rows: RpcRow[] = [];
  for (const file of readdirSync(MIRROR_DIR).filter(
    (f) => f.startsWith('rpc_') && f.endsWith('.sql'),
  )) {
    const def = readFileSync(join(MIRROR_DIR, file), 'utf8');
    const header = def.match(/^CREATE OR REPLACE FUNCTION (rpc_\w+)\(([^)]*)\)/i);
    if (!header) continue;
    const name = header[1]!;
    const args = header[2]!
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const tokens = part.split(/\s+/);
        return tokens.length >= 2 ? `${tokens[0]} ${tokens[tokens.length - 1]}` : part;
      })
      .join(', ');
    const authenticated = /GRANT EXECUTE[\s\S]*TO authenticated/i.test(def);
    rows.push({ name, args, def, authenticated });
  }
  return rows.length ? rows.sort((a, b) => a.name.localeCompare(b.name)) : null;
}

function scanRows(rows: RpcRow[], helperRows: RpcDefRow[] = []): Violation[] {
  const ctx = buildDetectionContext(rows, helperRows);
  const violations: Violation[] = [];

  for (const row of rows) {
    const { name, args, def, authenticated } = row;

    if (def.includes('_is_admin()') && authenticated && !def.includes('_assert_admin_aal2()')) {
      if (!isAllowlisted(name, args, 'aal2-exempt')) {
        violations.push({
          rule: 'missing-aal2',
          name,
          args,
          detail: 'admin RPC callable by authenticated lacks _assert_admin_aal2()',
        });
      }
    }

    if (isBalanceMoving(def, ctx) && !isGuardedByCalleeOrSelf(def, name, ctx)) {
      if (!isAllowlisted(name, args, 'system-live-exempt')) {
        violations.push({
          rule: 'missing-system-live',
          name,
          args,
          detail: 'balance-moving RPC lacks _assert_system_live() (self or guarded callee)',
        });
      }
    }
  }

  return violations;
}

function runSelfTest(): void {
  const unguardedStakeDef = `
CREATE OR REPLACE FUNCTION rpc_stake(text, text, text, text, text)
RETURNS jsonb LANGUAGE plpgsql AS $function$
BEGIN
  PERFORM _lock_wallet_internal(auth.uid(), 'PHON'::currency, '1', 'staking_lock', 'x');
  RETURN '{}'::jsonb;
END;
$function$;`;

  const synthetic: RpcRow[] = [
    {
      name: 'rpc_synthetic_missing_aal2',
      args: 'p_id uuid',
      def: `
CREATE OR REPLACE FUNCTION rpc_synthetic_missing_aal2(p_id uuid)
RETURNS void LANGUAGE plpgsql AS $function$
BEGIN
  IF NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
END;
$function$;`,
      authenticated: true,
    },
    {
      name: 'rpc_synthetic_settle_delegate',
      args: 'p_position_id uuid',
      def: `
CREATE OR REPLACE FUNCTION rpc_synthetic_settle_delegate(p_position_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $function$
BEGIN
  RETURN _settle_futures_position(p_position_id, 1, 'closed', 'close');
END;
$function$;`,
      authenticated: true,
    },
    {
      name: 'rpc_synthetic_system_account',
      args: 'p_amount text',
      def: `
CREATE OR REPLACE FUNCTION rpc_synthetic_system_account(p_amount text)
RETURNS void LANGUAGE plpgsql AS $function$
BEGIN
  PERFORM _credit_system_account('house_liquidity_usdt', p_amount, 'test', auth.uid(), 'k', gen_random_uuid());
END;
$function$;`,
      authenticated: true,
    },
    {
      name: 'rpc_synthetic_direct_wallet',
      args: 'p_amount text',
      def: `
CREATE OR REPLACE FUNCTION rpc_synthetic_direct_wallet(p_amount text)
RETURNS void LANGUAGE plpgsql AS $function$
BEGIN
  UPDATE wallets SET phon_available = p_amount WHERE user_id = auth.uid();
END;
$function$;`,
      authenticated: true,
    },
    {
      name: 'rpc_synthetic_unguarded_wrapper',
      args: 'p_term text, p_amount text',
      def: `
CREATE OR REPLACE FUNCTION rpc_synthetic_unguarded_wrapper(p_term text, p_amount text)
RETURNS jsonb LANGUAGE plpgsql AS $function$
BEGIN
  RETURN rpc_stake('PHON', 'PHON', p_term, p_amount, NULL);
END;
$function$;`,
      authenticated: true,
    },
    {
      name: 'rpc_stake',
      args: 'p_reference_asset text, p_stake_currency text, p_term text, p_amount text, p_client_request_id text',
      def: unguardedStakeDef,
      authenticated: true,
    },
  ];

  const helperRows: RpcDefRow[] = [
    {
      name: '_settle_futures_position',
      args: 'p_position_id uuid, p_exit numeric, p_status position_status, p_reason text',
      def: `
CREATE OR REPLACE FUNCTION _settle_futures_position(uuid, numeric, position_status, text)
RETURNS jsonb LANGUAGE plpgsql AS $function$
BEGIN
  PERFORM _unlock_wallet_internal(auth.uid(), 'USDT'::currency, '1', 'x', 'y');
  RETURN '{}'::jsonb;
END;
$function$;`,
    },
  ];

  const violations = scanRows(synthetic, helperRows);
  const rules = new Set(violations.map((v) => v.rule));
  const names = new Set(violations.map((v) => v.name));

  const expectedSystemLive = [
    'rpc_synthetic_settle_delegate',
    'rpc_synthetic_system_account',
    'rpc_synthetic_direct_wallet',
    'rpc_synthetic_unguarded_wrapper',
  ];
  const missingSystemLive = expectedSystemLive.filter((n) => !names.has(n));

  if (!rules.has('missing-aal2') || missingSystemLive.length > 0) {
    console.error('[check:guard-coverage] --self-test FAIL: synthetic gaps not fully detected');
    if (!rules.has('missing-aal2')) {
      console.error('  - missing-aal2 not detected');
    }
    for (const n of missingSystemLive) {
      console.error(`  - missing-system-live not detected for ${n}`);
    }
    process.exit(1);
  }

  console.log(
    `[check:guard-coverage] --self-test OK — ${violations.length} synthetic gaps detected (aal2 + ${expectedSystemLive.length} system_live patterns)`,
  );
}

function main(): void {
  if (selfTest) {
    runSelfTest();
    return;
  }

  const rows = loadFromLiveDb() ?? loadFromMirror();
  if (!rows) {
    const msg =
      '[check:guard-coverage] skipped — no live DB or functions-sql/current mirror (set PHONARA_GUARD_COVERAGE_STRICT=1 to fail)';
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    console.log(msg);
    return;
  }

  const helperRows = loadHelpersFromLiveDb();
  const violations = scanRows(rows, helperRows);
  if (violations.length > 0) {
    console.error('[check:guard-coverage] FAIL — guard gaps detected:');
    for (const v of violations) {
      console.error(`  - [${v.rule}] ${v.name}(${v.args}): ${v.detail}`);
    }
    process.exit(1);
  }

  console.log(`[check:guard-coverage] OK — ${rows.length} rpc_* scanned, 0 actionable gaps`);
}

main();
