/**
 * PQA F4 (`pqa-fix-types-regen`) — committed `database.types.ts` contract.
 * Audit B §2.3: service/cron RPCs must still appear in generated types for drift detection.
 */
export const PQA_FIX_TYPES_REGEN_TODO = 'pqa-fix-types-regen' as const;

/** Public-schema RPC names that were missing from types before F4 (audit B P2-TYPES-01). */
export const DATABASE_TYPES_REQUIRED_RPCS = [
  'rpc_run_open_order_fills',
  'rpc_run_stop_orders',
] as const;

export type DatabaseTypesRequiredRpc = (typeof DATABASE_TYPES_REQUIRED_RPCS)[number];

export function parseRpcFunctionNamesFromDatabaseTypes(content: string): Set<string> {
  const publicIdx = content.indexOf('public: {');
  const functionsIdx = content.indexOf('Functions: {', publicIdx);
  if (functionsIdx < 0) return new Set();

  const slice = content.slice(functionsIdx);
  const names = new Set<string>();
  const fnRe = /^\s+(rpc_[a-z0-9_]+):/gm;
  let match: RegExpExecArray | null;
  while ((match = fnRe.exec(slice)) !== null) {
    names.add(match[1]!);
  }
  return names;
}

export function findMissingRequiredDatabaseTypeRpcs(content: string): DatabaseTypesRequiredRpc[] {
  const present = parseRpcFunctionNamesFromDatabaseTypes(content);
  return DATABASE_TYPES_REQUIRED_RPCS.filter((rpc) => !present.has(rpc));
}
