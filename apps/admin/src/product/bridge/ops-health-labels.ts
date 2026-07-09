import type { CheckId } from '@/hooks/admin/useAdminOverview';
import type { MessageKey } from '@phonara/i18n';

const CHECK_LABEL_KEYS: Record<CheckId, MessageKey> = {
  system_mode: 'admin.opsHealth.check.system_mode.label',
  reconciliation_latest: 'admin.opsHealth.check.reconciliation_latest.label',
  cron_liquidation_liveness: 'admin.opsHealth.check.cron_liquidation_liveness.label',
  liquidation_recent_error: 'admin.opsHealth.check.liquidation_recent_error.label',
  treasury_freshness: 'admin.opsHealth.check.treasury_freshness.label',
  operator_high_risk_actions: 'admin.opsHealth.check.operator_high_risk_actions.label',
  hash_chain_integrity: 'admin.opsHealth.check.hash_chain_integrity.label',
  pending_exceptions: 'admin.opsHealth.check.pending_exceptions.label',
  treasury_solvency: 'admin.opsHealth.check.treasury_solvency.label',
};

const CHECK_DESC_KEYS: Record<CheckId, MessageKey> = {
  system_mode: 'admin.opsHealth.check.system_mode.desc',
  reconciliation_latest: 'admin.opsHealth.check.reconciliation_latest.desc',
  cron_liquidation_liveness: 'admin.opsHealth.check.cron_liquidation_liveness.desc',
  liquidation_recent_error: 'admin.opsHealth.check.liquidation_recent_error.desc',
  treasury_freshness: 'admin.opsHealth.check.treasury_freshness.desc',
  operator_high_risk_actions: 'admin.opsHealth.check.operator_high_risk_actions.desc',
  hash_chain_integrity: 'admin.opsHealth.check.hash_chain_integrity.desc',
  pending_exceptions: 'admin.opsHealth.check.pending_exceptions.desc',
  treasury_solvency: 'admin.opsHealth.check.treasury_solvency.desc',
};

const QUEUE_TYPE_KEYS: Record<string, MessageKey> = {
  deposit: 'admin.overview.queueType.deposit',
  deposit_exception: 'admin.overview.queueType.deposit',
  kyc: 'admin.overview.queueType.kyc',
  kyc_review: 'admin.overview.queueType.kyc',
  aml: 'admin.overview.queueType.aml',
  sanctions: 'admin.overview.queueType.sanctions',
  sanctions_screening: 'admin.overview.queueType.sanctions',
  withdrawal: 'admin.overview.queueType.withdrawal',
  affiliate: 'admin.overview.queueType.affiliate',
};

export function healthCheckLabelKey(id: CheckId): MessageKey {
  return CHECK_LABEL_KEYS[id];
}

export function healthCheckDescKey(id: CheckId): MessageKey {
  return CHECK_DESC_KEYS[id];
}

export function queueTypeLabelKey(queueType: string): MessageKey {
  return QUEUE_TYPE_KEYS[queueType] ?? 'admin.overview.queueType.generic';
}
