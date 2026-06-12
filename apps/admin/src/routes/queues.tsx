import { createRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Route as rootRoute } from './__root';
import { AdminLayout } from '../components/admin-layout';
import { AdminActionDialog } from '../components/admin-action-dialog';
import { supabase } from '../lib/supabase';
import { translateError } from '../lib/translate-error';
import { runQueueAction, type QueueAction } from '../domain/queues';
import { useT } from '../lib/i18n';
import { Button, DataTable, type ColumnDef } from '@phonara/ui';
import type { Tables } from '@phonara/shared-types';
import {
  MetricCard,
  StatusBadge,
  SlaBadge,
  formatDate,
  summarizeJson,
  labelFor,
  actionTitle,
  actionKey,
  QUEUE_TYPE_LABELS,
  CASE_TYPE_LABELS,
  RISK_FLAG_LABELS,
} from '../features/queues/presentation';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/queues',
  component: QueuesPage,
});

type ReviewQueueRow = Tables<'admin_review_queue'>;
type WithdrawalRow = Tables<'withdrawal_requests'>;
type StrCaseRow = Tables<'str_cases'>;
type RiskFlagRow = Tables<'risk_flags'>;

interface QueueData {
  reviewQueue: ReviewQueueRow[];
  withdrawals: WithdrawalRow[];
  strCases: StrCaseRow[];
  riskFlags: RiskFlagRow[];
}

export function QueuesPage() {
  const t = useT();
  const qc = useQueryClient();
  const [action, setAction] = useState<QueueAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-queues'],
    queryFn: fetchQueueData,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  const queueData: QueueData = data ?? {
    reviewQueue: [],
    withdrawals: [],
    strCases: [],
    riskFlags: [],
  };

  const reviewColumns = useMemo<ColumnDef<ReviewQueueRow>[]>(
    () => [
      { key: 'type', header: t('admin.queues.col.type'), cell: (row) => labelFor(row.queue_type, QUEUE_TYPE_LABELS, t) },
      { key: 'reason', header: t('admin.queues.col.reason'), cell: (row) => row.reason ?? '—' },
      {
        key: 'sla',
        header: t('admin.queues.col.sla'),
        cell: (row) => <SlaBadge dueAt={row.sla_due_at} />,
      },
      {
        key: 'payload',
        header: t('admin.queues.col.payload'),
        cell: (row) => <span className="text-muted">{summarizeJson(row.payload)}</span>,
      },
      {
        key: 'action',
        header: t('admin.queues.col.action'),
        align: 'right',
        cell: (row) => row.entity_type === 'kyc_submission' ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="primary"
              data-testid={`queue-kyc-approve-${row.entity_id}`}
              onClick={() => setAction({ kind: 'approveKyc', id: row.entity_id })}
            >
              {t('admin.queues.action.approve')}
            </Button>
            <Button
              size="sm"
              variant="danger"
              data-testid={`queue-kyc-reject-${row.entity_id}`}
              onClick={() => setAction({ kind: 'rejectKyc', id: row.entity_id })}
            >
              {t('admin.queues.action.reject')}
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            data-testid={`queue-resolve-${row.id}`}
            onClick={() => setAction({ kind: 'resolveQueue', id: row.id })}
          >
            {t('admin.queues.action.resolve')}
          </Button>
        ),
      },
    ],
    [t],
  );

  const withdrawalColumns = useMemo<ColumnDef<WithdrawalRow>[]>(
    () => [
      { key: 'amount', header: t('admin.queues.col.amount'), cell: (row) => `${row.amount} ${row.currency}` },
      {
        key: 'status',
        header: t('admin.queues.col.status'),
        cell: (row) => <StatusBadge status={row.status} t={t} />,
      },
      {
        key: 'created',
        header: t('admin.queues.col.created'),
        cell: (row) => formatDate(row.created_at),
      },
      {
        key: 'destination',
        header: t('admin.queues.col.destination'),
        cell: (row) => <span className="text-muted">{summarizeJson(row.destination)}</span>,
      },
      {
        key: 'action',
        header: t('admin.queues.col.action'),
        align: 'right',
        cell: (row) => (
          <div className="flex justify-end gap-2">
            {row.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  data-testid={`queue-withdraw-approve-${row.id}`}
                  onClick={() => setAction({ kind: 'approveWithdrawal', id: row.id })}
                >
                  {t('admin.queues.action.approve')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  data-testid={`queue-withdraw-reject-${row.id}`}
                  onClick={() => setAction({ kind: 'rejectWithdrawal', id: row.id })}
                >
                  {t('admin.queues.action.reject')}
                </Button>
              </>
            )}
            {row.status === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                data-testid={`queue-withdraw-sent-${row.id}`}
                onClick={() => setAction({ kind: 'markWithdrawalSent', id: row.id })}
              >
                {t('admin.queues.action.markSent')}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [t],
  );

  const strColumns = useMemo<ColumnDef<StrCaseRow>[]>(
    () => [
      { key: 'type', header: t('admin.queues.col.type'), cell: (row) => labelFor(row.case_type, CASE_TYPE_LABELS, t) },
      { key: 'status', header: t('admin.queues.col.status'), cell: (row) => <StatusBadge status={row.status} t={t} /> },
      { key: 'trigger', header: t('admin.queues.col.trigger'), cell: (row) => row.trigger_ref ?? '—' },
      {
        key: 'details',
        header: t('admin.queues.col.details'),
        cell: (row) => <span className="text-muted">{summarizeJson(row.details)}</span>,
      },
      {
        key: 'action',
        header: t('admin.queues.col.action'),
        align: 'right',
        cell: (row) => (
          <div className="flex justify-end gap-2">
            {row.status === 'open' && (
              <Button
                size="sm"
                variant="outline"
                data-testid={`queue-str-review-${row.id}`}
                onClick={() => setAction({ kind: 'reviewStr', id: row.id })}
              >
                {t('admin.queues.action.review')}
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              data-testid={`queue-str-file-${row.id}`}
              onClick={() => setAction({ kind: 'fileStr', id: row.id })}
            >
              {t('admin.queues.action.file')}
            </Button>
            <Button
              size="sm"
              variant="danger"
              data-testid={`queue-str-dismiss-${row.id}`}
              onClick={() => setAction({ kind: 'dismissStr', id: row.id })}
            >
              {t('admin.queues.action.dismiss')}
            </Button>
          </div>
        ),
      },
    ],
    [t],
  );

  const riskColumns = useMemo<ColumnDef<RiskFlagRow>[]>(
    () => [
      { key: 'type', header: t('admin.queues.col.type'), cell: (row) => labelFor(row.flag_type, RISK_FLAG_LABELS, t) },
      { key: 'status', header: t('admin.queues.col.status'), cell: (row) => <StatusBadge status={row.status} t={t} /> },
      {
        key: 'created',
        header: t('admin.queues.col.created'),
        cell: (row) => formatDate(row.created_at),
      },
      {
        key: 'details',
        header: t('admin.queues.col.details'),
        cell: (row) => <span className="text-muted">{summarizeJson(row.details)}</span>,
      },
      {
        key: 'action',
        header: t('admin.queues.col.action'),
        align: 'right',
        cell: (row) => (
          <Button
            size="sm"
            variant="outline"
            data-testid={`queue-risk-clear-${row.id}`}
            onClick={() => setAction({ kind: 'clearRiskFlag', id: row.id })}
          >
            {t('admin.queues.action.clear')}
          </Button>
        ),
      },
    ],
    [t],
  );

  async function handleConfirm(reason: string) {
    if (!action) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      await runQueueAction(action, reason);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin-queues'] }),
        qc.invalidateQueries({ queryKey: ['audit-logs'] }),
      ]);
      setAction(null);
    } catch (err) {
      setErrorMsg(t(translateError(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-queues-page">
        <div>
          <h1 className="text-2xl font-bold text-fg">{t('admin.queues.title')}</h1>
          <p className="text-muted mt-1">{t('admin.queues.description')}</p>
        </div>

        {errorMsg && (
          <p className="text-down text-sm" role="alert" data-testid="admin-queues-error">
            {errorMsg}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <MetricCard label={t('admin.queues.metric.review')} value={queueData.reviewQueue.length} />
          <MetricCard label={t('admin.queues.metric.withdrawals')} value={queueData.withdrawals.length} />
          <MetricCard label={t('admin.queues.metric.str')} value={queueData.strCases.length} />
          <MetricCard label={t('admin.queues.metric.risk')} value={queueData.riskFlags.length} />
        </div>

        <QueueSection
          title={t('admin.queues.review.title')}
          data={queueData.reviewQueue}
          columns={reviewColumns}
          loading={isLoading}
          empty={t('admin.queues.empty')}
          testId="admin-review-queue-table"
        />
        <QueueSection
          title={t('admin.queues.withdrawals.title')}
          data={queueData.withdrawals}
          columns={withdrawalColumns}
          loading={isLoading}
          empty={t('admin.queues.empty')}
          testId="admin-withdrawals-table"
        />
        <QueueSection
          title={t('admin.queues.str.title')}
          data={queueData.strCases}
          columns={strColumns}
          loading={isLoading}
          empty={t('admin.queues.empty')}
          testId="admin-str-table"
        />
        <QueueSection
          title={t('admin.queues.risk.title')}
          data={queueData.riskFlags}
          columns={riskColumns}
          loading={isLoading}
          empty={t('admin.queues.empty')}
          testId="admin-risk-table"
        />
      </div>

      <AdminActionDialog
        open={action !== null}
        title={actionTitle(action, t)}
        description={t('admin.action.auditNote')}
        confirmLabel={t('admin.action.confirmApply')}
        cancelLabel={t('common.cancel')}
        tone={action?.kind === 'rejectWithdrawal' || action?.kind === 'dismissStr' || action?.kind === 'rejectKyc' ? 'danger' : 'primary'}
        busy={busy}
        testId="admin-queue-action"
        resetKey={actionKey(action)}
        onConfirm={handleConfirm}
        onCancel={() => setAction(null)}
      />
    </AdminLayout>
  );
}

async function fetchQueueData(): Promise<QueueData> {
  const [reviewQueue, withdrawals, strCases, riskFlags] = await Promise.all([
    supabase
      .from('admin_review_queue')
      .select('*')
      .in('status', ['pending', 'in_review'])
      .order('sla_due_at', { ascending: true })
      .limit(50),
    supabase
      .from('withdrawal_requests')
      .select('*')
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('str_cases')
      .select('*')
      .in('status', ['open', 'reviewing'])
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('risk_flags')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(50),
  ]);

  for (const result of [reviewQueue, withdrawals, strCases, riskFlags]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    reviewQueue: (reviewQueue.data ?? []) as ReviewQueueRow[],
    withdrawals: (withdrawals.data ?? []) as WithdrawalRow[],
    strCases: (strCases.data ?? []) as StrCaseRow[],
    riskFlags: (riskFlags.data ?? []) as RiskFlagRow[],
  };
}


function QueueSection<T>({
  title,
  data,
  columns,
  loading,
  empty,
  testId,
}: {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  loading: boolean;
  empty: string;
  testId: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{title}</h2>
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row, i) => ('id' in (row as Record<string, unknown>) ? String((row as { id: string }).id) : i)}
        emptyState={empty}
        loading={loading}
        size="sm"
        data-testid={testId}
      />
    </section>
  );
}

