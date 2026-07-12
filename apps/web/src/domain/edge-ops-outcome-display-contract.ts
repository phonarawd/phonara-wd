/**
 * Domain-local mirror of Edge `classifyEdgeOpsOutcome` (H-04).
 * Edge Deno modules are not imported into vitest — keep this contract in sync
 * with `supabase/functions/_shared/edge-observability.ts`.
 */

export type EdgeOpsOutcomeStatus =
  | 'ok'
  | 'error'
  | 'partial'
  | 'circuit_open'
  | 'rpc_failed'
  | 'rejected'
  | 'missing_config';

export interface EdgeOpsOutcomeCounts {
  applied: number;
  rejected: number;
  circuitOpen: number;
  rpcFailed: number;
  total: number;
  missingConfig?: number;
}

export function classifyEdgeOpsOutcome(
  counts: EdgeOpsOutcomeCounts,
): { status: EdgeOpsOutcomeStatus; errorCode: string | null } {
  const missing = counts.missingConfig ?? 0;
  if (counts.total <= 0 && missing > 0) {
    return { status: 'missing_config', errorCode: 'missing_config' };
  }
  if (counts.total <= 0) {
    return { status: 'error', errorCode: 'no_sources' };
  }

  const allApplied =
    counts.applied === counts.total &&
    counts.rejected === 0 &&
    counts.circuitOpen === 0 &&
    counts.rpcFailed === 0 &&
    missing === 0;

  if (allApplied) {
    return { status: 'ok', errorCode: null };
  }

  if (counts.applied === 0) {
    if (missing > 0 && counts.circuitOpen === 0 && counts.rpcFailed === 0) {
      return { status: 'missing_config', errorCode: 'missing_config' };
    }
    if (counts.circuitOpen === counts.total) {
      return { status: 'circuit_open', errorCode: 'circuit_open' };
    }
    if (counts.rpcFailed > 0 && counts.rejected === 0 && counts.circuitOpen === 0) {
      return { status: 'rpc_failed', errorCode: 'rpc_failed' };
    }
    if (counts.rejected === counts.total) {
      return { status: 'rejected', errorCode: 'all_rejected' };
    }
    return { status: 'error', errorCode: 'all_sources_failed' };
  }

  return { status: 'partial', errorCode: 'partial_apply' };
}
