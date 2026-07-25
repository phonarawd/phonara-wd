import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { RefreshCw } from 'lucide-react';

import { format } from '@phonara/money';

import type { Currency } from '@phonara/shared-types';

import type { MessageKey } from '@phonara/i18n';

import { useAdminCompliance } from '@/hooks/admin/useAdminCompliance';

import type { AdminKycRow, AdminRiskRgRow, AdminStrRow } from '@/hooks/admin/useAdminCompliance';

import { useAdminExceptionQueueSummary } from '@/hooks/admin/useAdminExceptionQueueSummary';

import { useAdminReviewQueue } from '@/hooks/admin/useAdminReviewQueue';

import type { AdminReviewQueueItem } from '@/hooks/admin/useAdminReviewQueue';

import { useAdminWalletDesk } from '@/hooks/admin/useAdminWalletDesk';

import type { AdminWithdrawRow } from '@/hooks/admin/useAdminWalletDesk';

import { isKycOverdue } from '@/hooks/admin/useAdminCompliance';
import { isOverdueSla } from '@/hooks/admin/useAdminWalletDesk';

import { useAdminOperatorRbac } from '@/hooks/admin/useAdminOperatorRbac';

import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';

import { ADMIN_RBAC_DENIED_KEY, adminRbacActionProps } from '@/product/surfaces/admin-rbac-action';

import { HowItWorks } from '@/product/primitives/how-it-works';

import { Button } from '@/product/primitives/button';

import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';

import { EmptyState } from '@/product/primitives/empty-state';

import { Input } from '@/product/primitives/input';

import { AdminTable } from '@/product/primitives/admin-table';

import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';

import { cn } from '@/product/primitives/lib/cn';

import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

type QueueTab = 'withdraw' | 'kyc' | 'str' | 'risk' | 'review';

type QueueActionKind =
  | 'approveWithdraw'
  | 'rejectWithdraw'
  | 'markSent'
  | 'approveKyc'
  | 'rejectKyc'
  | 'reviewStr'
  | 'fileStr'
  | 'dismissStr'
  | 'clearRisk'
  | 'resolveReview';

type QueueTableRow = {
  id: string;
  cells: ReactNode[];
};

interface QueueActionTarget {
  kind: QueueActionKind;

  id: string;

  titleKey: MessageKey;

  confirmKey: MessageKey;

  destructive?: boolean;

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

function formatMoney(amount: string, currency: string): string {
  try {
    return format({ amount, currency: currency as Currency });
  } catch {
    return `${amount} ${currency}`;
  }
}

function withdrawStatusState(status: AdminWithdrawRow['status']): MoneyStatusState {
  if (status === 'approved') return 'reviewing';

  if (status === 'sent') return 'settled';

  if (status === 'rejected') return 'rejected';

  return 'pending';
}

function kycStatusState(status: AdminKycRow['status']): MoneyStatusState {
  if (status === 'in_review') return 'reviewing';

  if (status === 'approved') return 'settled';

  if (status === 'rejected') return 'rejected';

  return 'pending';
}

function strStatusState(status: AdminStrRow['status']): MoneyStatusState {
  if (status === 'reviewing') return 'reviewing';

  if (status === 'filed' || status === 'dismissed') return 'settled';

  return 'pending';
}

function reviewQueueTypeKey(itemType: string): MessageKey {
  const map: Record<string, MessageKey> = {
    deposit_exception: 'admin.queues.type.depositException',

    kyc_review: 'admin.queues.type.kycReview',

    sanctions_screening: 'admin.queues.type.sanctionsScreening',

    rg_self_exclusion_release: 'admin.queues.type.rgSelfExclusionRelease',

    affiliate_commission_approval: 'admin.queues.type.affiliateCommissionApproval',
  };

  return map[itemType] ?? 'admin.overview.queueType.generic';
}

function pendingWithdrawals(rows: AdminWithdrawRow[]): AdminWithdrawRow[] {
  return rows.filter((row) => row.status === 'pending' || row.status === 'approved');
}

function pendingKyc(rows: AdminKycRow[]): AdminKycRow[] {
  return rows.filter((row) => row.status === 'pending' || row.status === 'in_review');
}

function pendingStr(rows: AdminStrRow[]): AdminStrRow[] {
  return rows.filter((row) => row.status === 'open' || row.status === 'reviewing');
}

function activeRisk(rows: AdminRiskRgRow[]): AdminRiskRgRow[] {
  return rows.filter((row) => row.status === 'active');
}

/** Admin exception queue desk (`/queues`) — `useAdminExceptionQueueSummary` + tabbed worklists. */

export function AdminQueuesPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const { can } = useAdminOperatorRbac();
  const canApproveWithdraw = can('queues.withdraw.approve');
  const canRejectWithdraw = can('queues.withdraw.reject');
  const canReviewKyc = can('queues.kyc.review');
  const canManageStr = can('queues.str.manage');
  const canClearRisk = can('queues.risk.clear');
  const rbacDenied = t(ADMIN_RBAC_DENIED_KEY);

  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const summary = useAdminExceptionQueueSummary();

  const { items: reviewItems, isLoading: reviewLoading, resolveItem } = useAdminReviewQueue();

  const {
    withdrawals,

    approveWithdraw,

    rejectWithdraw,

    markSent,

    withdrawFilters,

    setWithdrawFilters,
  } = useAdminWalletDesk();

  const {
    kyc,

    str,

    risk,

    approveKyc,

    rejectKyc,

    flagStr: reviewStr,

    fileStr,

    dismissStr,

    clearRiskFlag,

    kycFilters,

    setKycFilters,

    strFilters,

    setStrFilters,

    riskFilters,

    setRiskFilters,
  } = useAdminCompliance();

  const [activeTab, setActiveTab] = useState<QueueTab>('withdraw');

  const [refreshing, setRefreshing] = useState(false);

  const [actionTarget, setActionTarget] = useState<QueueActionTarget | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const withdrawRows = useMemo(() => pendingWithdrawals(withdrawals), [withdrawals]);

  const kycRows = useMemo(() => pendingKyc(kyc), [kyc]);

  const strRows = useMemo(() => pendingStr(str), [str]);

  const riskRows = useMemo(() => activeRisk(risk), [risk]);

  const filteredWithdrawRows = useMemo(() => {
    const q = withdrawFilters.search.trim().toLowerCase();

    if (!q) return withdrawRows;

    return withdrawRows.filter(
      (row) =>
        row.id.toLowerCase().includes(q) ||
        row.userId.toLowerCase().includes(q) ||
        row.destinationSummary.toLowerCase().includes(q),
    );
  }, [withdrawFilters.search, withdrawRows]);

  const filteredKycRows = useMemo(() => {
    const q = kycFilters.search.trim().toLowerCase();

    if (!q) return kycRows;

    return kycRows.filter(
      (row) =>
        row.id.toLowerCase().includes(q) ||
        row.userId.toLowerCase().includes(q) ||
        row.documentSummary.toLowerCase().includes(q),
    );
  }, [kycFilters.search, kycRows]);

  const filteredStrRows = useMemo(() => {
    const q = strFilters.search.trim().toLowerCase();

    if (!q) return strRows;

    return strRows.filter(
      (row) =>
        row.id.toLowerCase().includes(q) ||
        row.userId.toLowerCase().includes(q) ||
        row.detailsSummary.toLowerCase().includes(q),
    );
  }, [strFilters.search, strRows]);

  const filteredRiskRows = useMemo(() => {
    const q = riskFilters.search.trim().toLowerCase();

    if (!q) return riskRows;

    return riskRows.filter(
      (row) =>
        row.id.toLowerCase().includes(q) ||
        row.userId.toLowerCase().includes(q) ||
        row.detailsSummary.toLowerCase().includes(q),
    );
  }, [riskFilters.search, riskRows]);

  const isLoading = reviewLoading;

  const openAction = (target: QueueActionTarget) => {
    setActionTarget(target);
  };

  const handleActionSubmit = async (reason: string): Promise<boolean> => {
    if (!actionTarget) return false;

    const { kind, id } = actionTarget;
    if ((kind === 'reviewStr' || kind === 'fileStr' || kind === 'dismissStr') && !canManageStr) {
      return false;
    }
    if (kind === 'clearRisk' && !canClearRisk) return false;

    setActionLoading(true);

    try {
      switch (kind) {
        case 'approveWithdraw':
          return await approveWithdraw(id, reason);

        case 'rejectWithdraw':
          return await rejectWithdraw(id, reason);

        case 'markSent':
          return await markSent(id, reason);

        case 'approveKyc':
          return await approveKyc(id, reason);

        case 'rejectKyc':
          return await rejectKyc(id, reason);

        case 'reviewStr':
          return await reviewStr(id, reason);

        case 'fileStr':
          return await fileStr(id, reason);

        case 'dismissStr':
          return await dismissStr(id, reason);

        case 'clearRisk':
          return await clearRiskFlag(id, reason);

        case 'resolveReview':
          return await resolveItem(id, reason);

        default:
          return false;
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);

    window.setTimeout(() => setRefreshing(false), 600);
  };

  const tabCounts: Record<QueueTab, number> = {
    withdraw: filteredWithdrawRows.length,

    kyc: filteredKycRows.length,

    str: filteredStrRows.length,

    risk: filteredRiskRows.length,

    review: reviewItems.length,
  };

  const showGlobalEmpty =
    !isLoading &&
    tabCounts.withdraw === 0 &&
    tabCounts.kyc === 0 &&
    tabCounts.str === 0 &&
    tabCounts.risk === 0 &&
    tabCounts.review === 0 &&
    Number(summary.supportOpen ?? 0) === 0;

  return (
    <div className="flex flex-col gap-ds-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.queues')}
          </h2>

          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {Number(summary.totalExceptions) > 0
              ? t('admin.queues.summary.pending', { count: summary.totalExceptions })
              : t('admin.today.summaryClear')}
          </p>

          <p className="text-foreground-muted m-0 text-sm">{t('admin.queues.description')}</p>
        </div>

        <Button
          variant="outline"
          size="md"
          loading={refreshing}
          onClick={handleRefresh}
          className="shrink-0"
        >
          <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />

          {t('admin.overview.action.refresh')}
        </Button>
      </section>

      <HowItWorks
        persistenceId="admin-queues"
        titleKey="admin.help.queues.title"
        stepKeys={['admin.help.queues.step1', 'admin.help.queues.step2', 'admin.help.queues.step3']}
      />

      <section aria-labelledby="admin-queue-metrics-heading">
        <h3 id="admin-queue-metrics-heading" className="sr-only">
          {t('admin.ops.exception.title')}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label={t('admin.ops.exception.manualRequired')}
            value={summary.manualRequired}
            emphasis={Number(summary.manualRequired) > 0}
          />

          <MetricCard
            label={t('admin.ops.exception.onHold')}
            value={summary.onHold}
            emphasis={Number(summary.onHold) > 0}
          />

          <MetricCard
            label={t('admin.ops.exception.retryFailed')}
            value={summary.retryFailed}
            emphasis={Number(summary.retryFailed) > 0}
          />

          <MetricCard label={t('admin.ops.exception.autoOk')} value={summary.autoOk} />
        </div>
      </section>

      {Number(summary.supportOpen ?? 0) > 0 ? (
        <section
          className="border-line bg-surface-raised flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          data-testid="admin-queues-support-convergence"
        >
          <div className="space-y-1">
            <p className="text-foreground m-0 text-sm font-semibold">
              {t('admin.queues.support.title')}
            </p>
            <p className="text-foreground-muted m-0 text-sm">
              {t('admin.queues.support.pending', { count: summary.supportOpen })}
            </p>
          </div>
          <Button
            size="md"
            variant="outline"
            onClick={() => {
              goTo('/support');
            }}
            data-testid="admin-queues-to-support"
          >
            {t('admin.queues.support.cta')}
          </Button>
        </section>
      ) : null}

      {showGlobalEmpty ? (
        <EmptyState
          title={t('admin.overview.empty.title')}
          description={t('admin.queues.empty')}
          actionLabel={t('admin.queues.empty.cta')}
          onAction={() => {
            goTo('/');
          }}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as QueueTab)}>
          <TabsList className="w-full flex-wrap justify-start">
            <TabsTrigger value="withdraw">
              {t('admin.queues.tab.withdraw')} ({tabCounts.withdraw})
            </TabsTrigger>

            <TabsTrigger value="kyc">
              {t('admin.queues.tab.kyc')} ({tabCounts.kyc})
            </TabsTrigger>

            <TabsTrigger value="str">
              {t('admin.queues.tab.str')} ({tabCounts.str})
            </TabsTrigger>

            <TabsTrigger value="risk">
              {t('admin.queues.tab.risk')} ({tabCounts.risk})
            </TabsTrigger>

            <TabsTrigger value="review">
              {t('admin.queues.metric.review')} ({tabCounts.review})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="withdraw">
            <QueueSection
              title={t('admin.queues.withdrawals.title')}
              columns={[
                'admin.queues.col.details',
                'admin.queues.col.amount',
                'admin.queues.col.destination',
                'admin.queues.col.status',
                'admin.queues.col.created',
                'admin.queues.col.action',
              ]}
              search={withdrawFilters.search}
              onSearchChange={(value) => setWithdrawFilters((prev) => ({ ...prev, search: value }))}
              searchLabel={t('admin.queues.col.destination')}
              isLoading={isLoading}
              emptyTitle={t('admin.overview.empty.title')}
              emptyDescription={t('admin.queues.empty')}
            >
              {filteredWithdrawRows.map((row) => (
                <tr key={row.id} className="border-line border-t">
                  <td className="text-foreground-muted px-4 py-3 tabular-nums">{row.userId}</td>

                  <td className="text-foreground px-4 py-3 tabular-nums">
                    {formatMoney(row.amount, row.currency)}
                  </td>

                  <td className="text-foreground-muted max-w-48 truncate px-4 py-3">
                    {row.destinationSummary}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge state={withdrawStatusState(row.status)} />
                  </td>

                  <td className="text-foreground-muted px-4 py-3 tabular-nums">
                    {formatWhen(row.createdAt, locale)}

                    {isOverdueSla(row.slaDueAt) ? (
                      <span className="text-danger ml-2 text-xs">{t('admin.queues.col.sla')}</span>
                    ) : null}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.status === 'pending' ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            {...adminRbacActionProps(canApproveWithdraw, rbacDenied)}
                            onClick={() => {
                              if (!canApproveWithdraw) return;
                              openAction({
                                kind: 'approveWithdraw',

                                id: row.id,

                                titleKey: 'admin.queues.dialog.approveWithdrawal',

                                confirmKey: 'admin.queues.action.approve',

                                summary: `${row.userId} · ${formatMoney(row.amount, row.currency)}`,
                              });
                            }}
                          >
                            {t('admin.queues.action.approve')}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            {...adminRbacActionProps(canRejectWithdraw, rbacDenied)}
                            onClick={() => {
                              if (!canRejectWithdraw) return;
                              openAction({
                                kind: 'rejectWithdraw',

                                id: row.id,

                                titleKey: 'admin.queues.dialog.rejectWithdrawal',

                                confirmKey: 'admin.queues.action.reject',

                                destructive: true,

                                summary: `${row.userId} · ${formatMoney(row.amount, row.currency)}`,
                              });
                            }}
                          >
                            {t('admin.queues.action.reject')}
                          </Button>
                        </>
                      ) : null}

                      {row.status === 'approved' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          {...adminRbacActionProps(canApproveWithdraw, rbacDenied)}
                          onClick={() => {
                            if (!canApproveWithdraw) return;
                            openAction({
                              kind: 'markSent',

                              id: row.id,

                              titleKey: 'admin.queues.dialog.markSent',

                              confirmKey: 'admin.queues.action.markSent',

                              summary: `${row.userId} · ${formatMoney(row.amount, row.currency)}`,
                            });
                          }}
                        >
                          {t('admin.queues.action.markSent')}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </QueueSection>
          </TabsContent>

          <TabsContent value="kyc">
            <QueueSection
              title={t('admin.queues.type.kycReview')}
              columns={[
                'admin.queues.col.details',
                'admin.queues.col.payload',
                'admin.queues.col.status',
                'admin.queues.col.created',
                'admin.queues.col.action',
              ]}
              search={kycFilters.search}
              onSearchChange={(value) => setKycFilters((prev) => ({ ...prev, search: value }))}
              searchLabel={t('admin.queues.col.details')}
              isLoading={isLoading}
              emptyTitle={t('admin.overview.empty.title')}
              emptyDescription={t('admin.queues.empty')}
            >
              {filteredKycRows.map((row) => (
                <tr key={row.id} className="border-line border-t">
                  <td className="text-foreground-muted px-4 py-3">{row.userId}</td>

                  <td className="text-foreground-muted px-4 py-3">{row.documentSummary}</td>

                  <td className="px-4 py-3">
                    <StatusBadge state={kycStatusState(row.status)} />
                  </td>

                  <td className="text-foreground-muted px-4 py-3 tabular-nums">
                    {formatWhen(row.submittedAt, locale)}

                    {isKycOverdue(row.slaDueAt) ? (
                      <span className="text-danger ml-2 text-xs">{t('admin.queues.col.sla')}</span>
                    ) : null}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        {...adminRbacActionProps(canReviewKyc, rbacDenied)}
                        onClick={() => {
                          if (!canReviewKyc) return;
                          openAction({
                            kind: 'approveKyc',

                            id: row.id,

                            titleKey: 'admin.queues.dialog.approveKyc',

                            confirmKey: 'admin.queues.action.approve',

                            summary: `${row.userId} · ${row.documentSummary}`,
                          });
                        }}
                      >
                        {t('admin.queues.action.approve')}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        {...adminRbacActionProps(canReviewKyc, rbacDenied)}
                        onClick={() => {
                          if (!canReviewKyc) return;
                          openAction({
                            kind: 'rejectKyc',

                            id: row.id,

                            titleKey: 'admin.queues.dialog.rejectKyc',

                            confirmKey: 'admin.queues.action.reject',

                            destructive: true,

                            summary: `${row.userId} · ${row.documentSummary}`,
                          });
                        }}
                      >
                        {t('admin.queues.action.reject')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </QueueSection>
          </TabsContent>

          <TabsContent value="str">
            <QueueSection
              title={t('admin.queues.str.title')}
              columns={[
                'admin.queues.col.details',
                'admin.queues.col.payload',
                'admin.queues.col.status',
                'admin.queues.col.created',
                'admin.queues.col.action',
              ]}
              search={strFilters.search}
              onSearchChange={(value) => setStrFilters((prev) => ({ ...prev, search: value }))}
              searchLabel={t('admin.queues.col.trigger')}
              isLoading={isLoading}
              emptyTitle={t('admin.overview.empty.title')}
              emptyDescription={t('admin.queues.empty')}
            >
              {filteredStrRows.map((row) => (
                <tr key={row.id} className="border-line border-t">
                  <td className="text-foreground-muted px-4 py-3">{row.userId}</td>

                  <td className="text-foreground-muted px-4 py-3">{row.detailsSummary}</td>

                  <td className="px-4 py-3">
                    <StatusBadge state={strStatusState(row.status)} />
                  </td>

                  <td className="text-foreground-muted px-4 py-3 tabular-nums">
                    {formatWhen(row.createdAt, locale)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.status === 'open' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          {...adminRbacActionProps(canManageStr, rbacDenied)}
                          onClick={() => {
                            if (!canManageStr) return;
                            openAction({
                              kind: 'reviewStr',

                              id: row.id,

                              titleKey: 'admin.queues.dialog.reviewStr',

                              confirmKey: 'admin.queues.action.review',

                              summary: `${row.userId} · ${row.detailsSummary}`,
                            });
                          }}
                        >
                          {t('admin.queues.action.review')}
                        </Button>
                      ) : null}

                      <Button
                        variant="primary"
                        size="sm"
                        {...adminRbacActionProps(canManageStr, rbacDenied)}
                        onClick={() => {
                          if (!canManageStr) return;
                          openAction({
                            kind: 'fileStr',

                            id: row.id,

                            titleKey: 'admin.queues.dialog.fileStr',

                            confirmKey: 'admin.queues.action.file',

                            summary: `${row.userId} · ${row.detailsSummary}`,
                          });
                        }}
                      >
                        {t('admin.queues.action.file')}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        {...adminRbacActionProps(canManageStr, rbacDenied)}
                        onClick={() => {
                          if (!canManageStr) return;
                          openAction({
                            kind: 'dismissStr',

                            id: row.id,

                            titleKey: 'admin.queues.dialog.dismissStr',

                            confirmKey: 'admin.queues.action.dismiss',

                            summary: `${row.userId} · ${row.detailsSummary}`,
                          });
                        }}
                      >
                        {t('admin.queues.action.dismiss')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </QueueSection>
          </TabsContent>

          <TabsContent value="risk">
            <QueueSection
              title={t('admin.queues.risk.title')}
              columns={[
                'admin.queues.col.details',
                'admin.queues.col.payload',
                'admin.queues.col.status',
                'admin.queues.col.created',
                'admin.queues.col.action',
              ]}
              search={riskFilters.search}
              onSearchChange={(value) => setRiskFilters((prev) => ({ ...prev, search: value }))}
              searchLabel={t('admin.queues.col.details')}
              isLoading={isLoading}
              emptyTitle={t('admin.overview.empty.title')}
              emptyDescription={t('admin.queues.empty')}
            >
              {filteredRiskRows.map((row) => (
                <tr key={row.id} className="border-line border-t">
                  <td className="text-foreground-muted px-4 py-3">{row.userId}</td>

                  <td className="text-foreground-muted px-4 py-3">{row.detailsSummary}</td>

                  <td className="px-4 py-3">
                    <StatusBadge state="pending" />
                  </td>

                  <td className="text-foreground-muted px-4 py-3 tabular-nums">
                    {formatWhen(row.createdAt, locale)}
                  </td>

                  <td className="px-4 py-3">
                    <Button
                      variant="primary"
                      size="sm"
                      {...adminRbacActionProps(canClearRisk, rbacDenied)}
                      onClick={() => {
                        if (!canClearRisk) return;
                        openAction({
                          kind: 'clearRisk',

                          id: row.id,

                          titleKey: 'admin.queues.dialog.clearRisk',

                          confirmKey: 'admin.queues.action.clear',

                          summary: `${row.userId} · ${row.detailsSummary}`,
                        });
                      }}
                    >
                      {t('admin.queues.action.clear')}
                    </Button>
                  </td>
                </tr>
              ))}
            </QueueSection>
          </TabsContent>

          <TabsContent value="review">
            <QueueSection
              title={t('admin.queues.review.title')}
              columns={[
                'admin.queues.col.type',
                'admin.queues.col.details',
                'admin.queues.col.reason',
                'admin.queues.col.sla',
                'admin.queues.col.action',
              ]}
              isLoading={reviewLoading}
              emptyTitle={t('admin.overview.empty.title')}
              emptyDescription={t('admin.queues.empty')}
            >
              {reviewItems.map((row: AdminReviewQueueItem) => (
                <tr key={row.id} className="border-line border-t">
                  <td className="text-foreground px-4 py-3">
                    {t(reviewQueueTypeKey(row.itemType))}
                  </td>

                  <td className="text-foreground-muted px-4 py-3">{row.userId}</td>

                  <td className="text-foreground-muted px-4 py-3">{row.reason ?? '—'}</td>

                  <td className="text-foreground-muted px-4 py-3 tabular-nums">
                    {formatWhen(row.slaDueAt, locale)}
                  </td>

                  <td className="px-4 py-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        openAction({
                          kind: 'resolveReview',

                          id: row.id,

                          titleKey: 'admin.queues.dialog.resolve',

                          confirmKey: 'admin.queues.action.resolve',

                          summary: `${t(reviewQueueTypeKey(row.itemType))} · ${row.userId}`,
                        })
                      }
                    >
                      {t('admin.queues.action.resolve')}
                    </Button>
                  </td>
                </tr>
              ))}
            </QueueSection>
          </TabsContent>
        </Tabs>
      )}

      <p className="text-foreground-muted m-0 text-xs">
        <a href="/" className="text-accent underline-offset-2 hover:underline">
          {t('admin.queues.empty.cta')}
        </a>
      </p>

      <AdminQueueActionDialog
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
        titleKey={actionTarget?.titleKey ?? 'admin.queues.dialog.resolve'}
        confirmKey={actionTarget?.confirmKey ?? 'admin.queues.action.resolve'}
        destructive={actionTarget?.destructive}
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

function QueueSection({
  title,
  columns,
  search,
  onSearchChange,
  searchLabel,
  isLoading,
  emptyTitle,
  emptyDescription,
  children,
}: {
  title: string;
  columns: MessageKey[];
  search?: string;
  onSearchChange?: (value: string) => void;
  searchLabel?: string;
  isLoading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
}) {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const rows: QueueTableRow[] = Children.toArray(children)
    .filter((child): child is ReactElement<{ children?: ReactNode }> =>
      isValidElement<{ children?: ReactNode }>(child),
    )
    .map((child, rowIndex) => ({
      id: String(child.key ?? rowIndex),
      cells: Children.toArray(child.props.children),
    }));

  return (
    <section className="space-y-3">
      <h4 className="text-foreground m-0 text-lg font-semibold">{title}</h4>
      {onSearchChange ? (
        <Input
          value={search ?? ''}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchLabel}
          aria-label={searchLabel}
          className="max-w-md"
        />
      ) : null}
      <AdminTable<QueueTableRow>
        columns={columns.map((key, columnIndex) => ({
          id: key,
          header: t(key),
          cell: ({ row }) => {
            const cell = row.cells[columnIndex];
            return isValidElement<{ children?: ReactNode }>(cell) ? cell.props.children : cell;
          },
        }))}
        rows={rows}
        getRowId={(row) => row.id}
        loading={isLoading}
        loadingRowCount={5}
        minWidth={640}
        empty={
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={t('admin.queues.empty.cta')}
            onAction={() => {
              goTo('/');
            }}
          />
        }
      />
    </section>
  );
}
