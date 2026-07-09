import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  useAdminReferralsDesk,
  type AdminReferralApprovalRow,
} from '@/hooks/admin/useAdminReferralsDesk';
import { formatAmountString } from '@/hooks/admin/useAdminWalletDesk';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { cn } from '@/product/primitives/lib/cn';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

type ReferralActionKind = 'approveCommission' | 'runSettlements';

interface ReferralActionTarget {
  kind: ReferralActionKind;
  id?: string;
  titleKey: MessageKey;
  confirmKey: MessageKey;
  summary: string;
}

function formatWhen(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function approvalStatusState(state: AdminReferralApprovalRow['state']): MoneyStatusState {
  if (state === 'approved') return 'settled';
  if (state === 'rejected') return 'rejected';
  return 'pending';
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Admin referrals desk (`/earn/referrals`) — approve commissions · run settlements (§29.2). */
export function AdminEarnReferralsPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    pendingApprovals,
    filteredApprovals,
    filters,
    setFilters,
    approveCommission,
    runSettlements,
    refresh,
  } = useAdminReferralsDesk();

  const [refreshing, setRefreshing] = useState(false);
  const [actionTarget, setActionTarget] = useState<ReferralActionTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const metrics = useMemo(() => {
    const phon = pendingApprovals.filter((row) => row.currency === 'PHON').length;
    const usdt = pendingApprovals.filter((row) => row.currency === 'USDT').length;
    return { total: pendingApprovals.length, phon, usdt };
  }, [pendingApprovals]);

  const formatRowSummary = (row: AdminReferralApprovalRow) =>
    `${row.affiliateMask} · ${formatAmountString(row.amount, row.currency)} · ${row.periodKey}`;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleActionSubmit = async (reason: string): Promise<boolean> => {
    if (!actionTarget) return false;
    setActionLoading(true);
    try {
      if (actionTarget.kind === 'approveCommission' && actionTarget.id) {
        return await approveCommission(actionTarget.id, reason);
      }
      if (actionTarget.kind === 'runSettlements') {
        return await runSettlements(todayIsoDate(), reason);
      }
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.referrals')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {metrics.total > 0
              ? t('admin.referrals.summary.pending', { count: metrics.total })
              : t('admin.overview.empty.title')}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.referrals.description')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="md"
            loading={refreshing}
            onClick={() => void handleRefresh()}
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />
            {t('admin.overview.action.refresh')}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              setActionTarget({
                kind: 'runSettlements',
                titleKey: 'admin.referrals.dialog.runSettlements',
                confirmKey: 'admin.referrals.action.runSettlements',
                summary: t('admin.referrals.runSettlements.summary', { date: todayIsoDate() }),
              })
            }
          >
            {t('admin.referrals.action.runSettlements')}
          </Button>
        </div>
      </section>

      <HowItWorks
        persistenceId="admin-earn-referrals"
        titleKey="admin.help.referrals.title"
        stepKeys={[
          'admin.help.referrals.step1',
          'admin.help.referrals.step2',
          'admin.help.referrals.step3',
        ]}
      />

      <section aria-labelledby="admin-referrals-metrics-heading">
        <h3 id="admin-referrals-metrics-heading" className="sr-only">
          {t('admin.nav.referrals')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label={t('admin.referrals.metric.pending')}
            value={String(metrics.total)}
            emphasis={metrics.total > 0}
          />
          <MetricCard label={t('admin.referrals.metric.phon')} value={String(metrics.phon)} />
          <MetricCard label={t('admin.referrals.metric.usdt')} value={String(metrics.usdt)} />
        </div>
      </section>

      {pendingApprovals.length === 0 ? (
        <EmptyState
          title={t('admin.overview.empty.title')}
          description={t('admin.referrals.empty')}
          actionLabel={t('admin.referrals.empty.cta')}
          onAction={() => {
            goTo('/ops');
          }}
        />
      ) : (
        <section className="space-y-3">
          <Input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder={t('admin.referrals.search.placeholder')}
            aria-label={t('admin.referrals.search.placeholder')}
            className="max-w-md"
          />

          {filteredApprovals.length === 0 ? (
            <EmptyState
              title={t('admin.overview.empty.title')}
              description={t('admin.referrals.empty.filtered')}
              actionLabel={t('admin.referrals.empty.clearSearch')}
              onAction={() => setFilters({ search: '' })}
            />
          ) : (
            <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-surface-raised text-foreground-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('admin.referrals.col.affiliate')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.referrals.col.period')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.referrals.col.amount')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.referrals.col.status')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.referrals.col.requested')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.referrals.col.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovals.map((row) => (
                    <tr key={row.id} className="border-line border-t">
                      <td className="text-foreground-muted px-4 py-3 tabular-nums">
                        {row.affiliateMask}
                      </td>
                      <td className="text-foreground-muted px-4 py-3 tabular-nums">
                        {row.periodKey}
                      </td>
                      <td className="text-foreground px-4 py-3 tabular-nums">
                        {formatAmountString(row.amount, row.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge state={approvalStatusState(row.state)} />
                      </td>
                      <td className="text-foreground-muted px-4 py-3 tabular-nums">
                        {formatWhen(row.requestedAt, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            setActionTarget({
                              kind: 'approveCommission',
                              id: row.id,
                              titleKey: 'admin.referrals.dialog.approve',
                              confirmKey: 'admin.referrals.action.approve',
                              summary: formatRowSummary(row),
                            })
                          }
                        >
                          {t('admin.referrals.action.approve')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <AdminQueueActionDialog
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
        titleKey={actionTarget?.titleKey ?? 'admin.referrals.dialog.approve'}
        confirmKey={actionTarget?.confirmKey ?? 'admin.referrals.action.approve'}
        loading={actionLoading}
        summary={actionTarget ? <p className="m-0">{actionTarget.summary}</p> : undefined}
        onSubmit={handleActionSubmit}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <Card className={emphasis ? 'border-warning/40' : undefined}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="tabular-nums text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
