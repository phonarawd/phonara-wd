import { Badge, Card } from '@phonara/ui';
import type { MessageKey } from '@phonara/i18n';
import type { useT } from '../../lib/i18n';
import type { QueueAction } from '../../domain/queues';

export function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-fg tabular-nums">{value}</p>
    </Card>
  );
}

export function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useT> }) {
  const tone = status === 'pending' || status === 'open'
    ? 'warning'
    : status === 'active'
      ? 'down'
      : status === 'approved' || status === 'reviewing'
        ? 'primary'
        : 'neutral';
  return <Badge tone={tone}>{labelFor(status, STATUS_LABELS, t)}</Badge>;
}

export function SlaBadge({ dueAt }: { dueAt: string }) {
  const overdue = new Date(dueAt).getTime() < Date.now();
  return (
    <Badge tone={overdue ? 'down' : 'warning'}>
      {formatDate(dueAt)}
    </Badge>
  );
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function summarizeJson(value: unknown) {
  if (!value || typeof value !== 'object') return '—';
  const text = JSON.stringify(maskSensitiveJson(value));
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

export const STATUS_LABELS: Record<string, MessageKey> = {
  pending: 'admin.status.pending',
  in_review: 'admin.status.inReview',
  resolved: 'admin.status.resolved',
  approved: 'admin.status.approved',
  processing: 'admin.status.processing',
  completed: 'admin.status.completed',
  sent: 'admin.status.sent',
  rejected: 'admin.status.rejected',
  cancelled: 'admin.status.cancelled',
  open: 'admin.status.open',
  reviewing: 'admin.status.reviewing',
  filed: 'admin.status.filed',
  dismissed: 'admin.status.dismissed',
  active: 'admin.status.active',
  cleared: 'admin.status.cleared',
};

export const QUEUE_TYPE_LABELS: Record<string, MessageKey> = {
  deposit_exception: 'admin.queues.type.depositException',
  kyc_review: 'admin.queues.type.kycReview',
  sanctions_screening: 'admin.queues.type.sanctionsScreening',
  rg_self_exclusion_release: 'admin.queues.type.rgSelfExclusionRelease',
  affiliate_commission_approval: 'admin.queues.type.affiliateCommissionApproval',
};

export const CASE_TYPE_LABELS: Record<string, MessageKey> = {
  sanctions_hit: 'admin.queues.case.sanctionsHit',
};

export const RISK_FLAG_LABELS: Record<string, MessageKey> = {
  sanctions_hit: 'admin.queues.risk.sanctionsHit',
  sanctions_pending: 'admin.queues.risk.sanctionsPending',
  account_activity_frozen: 'admin.queues.risk.accountActivityFrozen',
  rg_self_exclusion: 'admin.queues.risk.rgSelfExclusion',
};

export function labelFor(value: string, labels: Record<string, MessageKey>, t: ReturnType<typeof useT>) {
  const key = labels[value];
  return key ? t(key) : value;
}

export function maskSensitiveJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSensitiveJson);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      const normalized = key.toLowerCase();
      if (
        normalized.includes('legal_name') ||
        normalized.includes('document_last4') ||
        normalized.includes('birth') ||
        normalized.includes('address')
      ) {
        return [key, '***'];
      }
      return [key, maskSensitiveJson(entry)];
    }),
  );
}

export function actionTitle(action: QueueAction | null, t: ReturnType<typeof useT>) {
  if (!action) return '';
  switch (action.kind) {
    case 'resolveQueue':
      return t('admin.queues.dialog.resolve');
    case 'clearSanctionsScreening':
      return t('admin.queues.dialog.clearSanctions');
    case 'hitSanctionsScreening':
      return t('admin.queues.dialog.hitSanctions');
    case 'approveWithdrawal':
      return t('admin.queues.dialog.approveWithdrawal');
    case 'rejectWithdrawal':
      return t('admin.queues.dialog.rejectWithdrawal');
    case 'markWithdrawalSent':
      return t('admin.queues.dialog.markSent');
    case 'reviewStr':
      return t('admin.queues.dialog.reviewStr');
    case 'fileStr':
      return t('admin.queues.dialog.fileStr');
    case 'dismissStr':
      return t('admin.queues.dialog.dismissStr');
    case 'clearRiskFlag':
      return t('admin.queues.dialog.clearRisk');
    case 'approveKyc':
      return t('admin.queues.dialog.approveKyc');
    case 'rejectKyc':
      return t('admin.queues.dialog.rejectKyc');
  }
}

export function actionKey(action: QueueAction | null): string | null {
  return action ? `${action.kind}:${action.id}` : null;
}
