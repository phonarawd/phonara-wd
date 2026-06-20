/**
 * Balance-moving detection for guard-coverage — single source of truth.
 * Used by check:guard-coverage and guard-audit.
 */

export interface RpcDefRow {
  name: string;
  args: string;
  def: string;
}

export interface DetectionContext {
  rpcByName: Map<string, string[]>;
  rpcByKey: Map<string, string>;
  helperByName: Map<string, string>;
}

/** Wallet / ledger / settlement helpers invoked by rpc_* bodies. */
export const BALANCE_HELPER_RE =
  /_credit_wallet|_debit_wallet|_lock_wallet|_unlock_wallet|_debit_locked|_credit_system_account|_debit_system_account|_credit_krw_deposit_internal|_credit_crypto_deposit_internal|_settle_futures_position|_partial_settle_futures_position|_place_open_order_common|_grant_mission|_grant_viral_mission|_try_match_krw_deposit|_try_match_crypto_deposit|_pay_affiliate_settlement/i;

/** Direct balance-table mutation without going through named wallet helpers. */
export const TABLE_MUTATE_RE =
  /UPDATE\s+wallets\s+SET|INSERT\s+INTO\s+wallet_ledger|UPDATE\s+margin_accounts\s+SET|UPDATE\s+system_accounts\s+SET|UPDATE\s+treasury_reserves\s+SET/i;

/** Internal helpers whose defs are loaded for callee guard resolution. */
export const BALANCE_CALLEE_HELPERS = [
  '_place_open_order_common',
  '_settle_futures_position',
  '_partial_settle_futures_position',
  '_try_match_krw_deposit',
  '_try_match_crypto_deposit',
  '_grant_mission',
  '_grant_viral_mission',
  '_fill_house_order',
] as const;

export function rpcKey(name: string, args: string): string {
  return `${name}::${args}`;
}

export function buildDetectionContext(
  rpcRows: RpcDefRow[],
  helperRows: RpcDefRow[] = [],
): DetectionContext {
  const rpcByName = new Map<string, string[]>();
  const rpcByKey = new Map<string, string>();
  const helperByName = new Map<string, string>();

  for (const row of rpcRows) {
    const list = rpcByName.get(row.name) ?? [];
    list.push(row.def);
    rpcByName.set(row.name, list);
    rpcByKey.set(rpcKey(row.name, row.args), row.def);
  }

  for (const row of helperRows) {
    helperByName.set(row.name, row.def);
  }

  return { rpcByName, rpcByKey, helperByName };
}

export function extractFunctionBody(def: string): string {
  return def
    .replace(/^[\s\S]*?\$function\$\s*/i, '')
    .replace(/\s*\$function\$[\s\S]*$/, '')
    .replace(/^[\s\S]*?\$\$\s*/i, '')
    .replace(/\s*\$\$[\s\S]*$/, '');
}

export function hasDirectBalanceSignal(def: string): boolean {
  return BALANCE_HELPER_RE.test(def) || TABLE_MUTATE_RE.test(def);
}

export function extractRpcCalls(body: string): string[] {
  const found = new Set<string>();
  for (const m of body.matchAll(/\brpc_\w+\s*\(/g)) {
    found.add(m[0]!.replace(/\s*\($/, ''));
  }
  return [...found];
}

export function extractStatements(body: string): string[] {
  return body
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^BEGIN\s+/i, '')
    .replace(/\s*END\s*;?\s*$/i, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

const THIN_WRAPPER_PREAMBLE_RE =
  /^(IF\s+auth\.uid\(\)\s+IS\s+NULL|PERFORM\s+_enforce_rate_limit\s*\(|PERFORM\s+_assert_system_live\s*\(\s*\))/i;

export function extractThinWrapperCallee(body: string): string | null {
  const statements = extractStatements(body);
  let returnCallee: string | null = null;

  for (const statement of statements) {
    const returnMatch = statement.match(/^RETURN\s+((?:rpc_|_)\w+)\s*\(/i);
    if (returnMatch) {
      if (returnCallee) return null;
      returnCallee = returnMatch[1]!;
      continue;
    }
    if (THIN_WRAPPER_PREAMBLE_RE.test(statement)) continue;
    return null;
  }

  return returnCallee;
}

export function extractBalanceHelperInvocations(body: string): string[] {
  const found = new Set<string>();
  for (const m of body.matchAll(/\b(?:RETURN|PERFORM)\s+(_\w+)\s*\(/g)) {
    const name = m[1]!;
    if (
      (BALANCE_CALLEE_HELPERS as readonly string[]).includes(name) ||
      BALANCE_HELPER_RE.test(name)
    ) {
      found.add(name);
    }
  }
  return [...found];
}

export function resolveCalleeDef(callee: string, ctx: DetectionContext): string | null {
  if (callee.startsWith('rpc_')) {
    const defs = ctx.rpcByName.get(callee);
    if (!defs?.length) return null;
    return defs[0]!;
  }
  return ctx.helperByName.get(callee) ?? null;
}

export function isBalanceMoving(def: string, ctx?: DetectionContext): boolean {
  if (hasDirectBalanceSignal(def)) return true;

  const body = extractFunctionBody(def);
  for (const callee of extractRpcCalls(body)) {
    const calleeDefs = ctx?.rpcByName.get(callee);
    if (!calleeDefs?.length) continue;
    if (calleeDefs.some((cdef) => isBalanceMoving(cdef, ctx))) return true;
  }

  return false;
}

export function hasSystemLiveGuard(def: string): boolean {
  return def.includes('_assert_system_live()');
}

export function isGuardedByCalleeOrSelf(
  def: string,
  _name: string,
  ctx: DetectionContext,
  depth = 0,
): boolean {
  if (hasSystemLiveGuard(def)) return true;
  if (depth > 3) return false;

  const body = extractFunctionBody(def);
  const thinCallee = extractThinWrapperCallee(body);
  if (thinCallee) {
    const calleeDef = resolveCalleeDef(thinCallee, ctx);
    if (!calleeDef) return false;
    return (
      hasSystemLiveGuard(calleeDef) ||
      isGuardedByCalleeOrSelf(calleeDef, thinCallee, ctx, depth + 1)
    );
  }

  const helperCalls = extractBalanceHelperInvocations(body);
  if (helperCalls.length > 0) {
    return helperCalls.every((helper) => {
      const helperDef = resolveCalleeDef(helper, ctx);
      if (!helperDef) return false;
      return (
        hasSystemLiveGuard(helperDef) ||
        isGuardedByCalleeOrSelf(helperDef, helper, ctx, depth + 1)
      );
    });
  }

  const rpcCalls = extractRpcCalls(body);
  if (rpcCalls.length > 0) {
    return rpcCalls.every((callee) => {
      const defs = ctx.rpcByName.get(callee) ?? [];
      if (!defs.length) return false;
      return defs.some(
        (cdef) =>
          hasSystemLiveGuard(cdef) || isGuardedByCalleeOrSelf(cdef, callee, ctx, depth + 1),
      );
    });
  }

  return false;
}

/** Legacy thin-wrapper check — RETURN rpc_* only, no direct balance signal in wrapper body. */
export function isThinRpcWrapper(def: string): boolean {
  const body = extractFunctionBody(def);
  const trimmed = body.replace(/\s+/g, ' ').trim();
  return /^RETURN\s+rpc_/i.test(trimmed) && !hasDirectBalanceSignal(body);
}

export function isThinWrapper(def: string, ctx?: DetectionContext): boolean {
  const body = extractFunctionBody(def);
  const thinCallee = extractThinWrapperCallee(body);
  if (!thinCallee) return false;
  if (thinCallee.startsWith('rpc_')) return isThinRpcWrapper(def);
  return BALANCE_HELPER_RE.test(thinCallee) && !hasDirectBalanceSignal(body);
}

/** SQL ~* pattern for guard-audit matrix (superset of direct signals). */
export function balanceMovingSqlPattern(): string {
  return BALANCE_HELPER_RE.source.replace(/^\//, '').replace(/\/i$/, '');
}
