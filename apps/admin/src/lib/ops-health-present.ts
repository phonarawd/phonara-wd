import type { CheckId } from '@/hooks/admin/useAdminOverview';
import { t } from '@/i18n';

/** Engine rpc_get_ops_health check ids — display-only; never sent to RPC. */
export const OPS_HEALTH_CHECK_IDS = [
  'system_mode',
  'reconciliation_latest',
  'cron_liquidation_liveness',
  'liquidation_recent_error',
  'treasury_freshness',
  'operator_high_risk_actions',
  'hash_chain_integrity',
  'pending_exceptions',
  'treasury_solvency',
] as const satisfies readonly CheckId[];

const LEGACY_OVERVIEW_CHECK_LABEL_KEYS: Partial<Record<CheckId, string>> = {
  cron_liquidation_liveness: 'admin.overview.check.cronLiveness',
  liquidation_recent_error: 'admin.overview.check.liquidationError',
  hash_chain_integrity: 'admin.overview.check.hashChainIntegrity',
  pending_exceptions: 'admin.overview.check.pendingExceptions',
  treasury_solvency: 'admin.overview.check.treasurySolvency',
};

export function isOpsHealthCheckId(id: string): id is CheckId {
  return (OPS_HEALTH_CHECK_IDS as readonly string[]).includes(id);
}

function opsHealthLabelKey(id: CheckId): string {
  return `admin.opsHealth.check.${id}.label`;
}

function opsHealthDescKey(id: CheckId): string {
  return `admin.opsHealth.check.${id}.desc`;
}

/** Human label for an engine health check id (falls back to raw id). */
export function getOpsHealthCheckLabel(id: string): string {
  if (!isOpsHealthCheckId(id)) return id;
  const primary = t(opsHealthLabelKey(id));
  if (primary !== opsHealthLabelKey(id)) return primary;
  const legacy = LEGACY_OVERVIEW_CHECK_LABEL_KEYS[id];
  if (legacy) {
    const legacyText = t(legacy);
    if (legacyText !== legacy) return legacyText;
  }
  return id;
}

/** One-line operator description for an engine health check id. */
export function getOpsHealthCheckDesc(id: string): string {
  if (!isOpsHealthCheckId(id)) return '';
  const text = t(opsHealthDescKey(id));
  return text !== opsHealthDescKey(id) ? text : '';
}
