import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  useAdminWalletDesk,
  formatAmountString,
  isOverdueSla,
  type AdminWithdrawRow,
  type WithdrawMethod,
} from '@/hooks/admin/useAdminWalletDesk';

import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';

import { HowItWorks } from '@/product/primitives/how-it-works';

import { Button } from '@/product/primitives/button';

import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';

import { EmptyState } from '@/product/primitives/empty-state';

import { Input } from '@/product/primitives/input';

import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';

import { cn } from '@/product/primitives/lib/cn';

import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

type MethodTab = 'all' | WithdrawMethod;

type WithdrawActionKind = 'approveWithdraw' | 'rejectWithdraw' | 'markSent';

interface WithdrawActionTarget {
  kind: WithdrawActionKind;

  id: string;

  titleKey: MessageKey;

  confirmKey: MessageKey;

  destructive?: boolean;

  summary: string;
}

const METHOD_FILTER_KEYS: Record<WithdrawMethod, MessageKey> = {
  krw: 'admin.wallet.withdraw.filter.method.krw',

  crypto: 'admin.wallet.withdraw.filter.method.crypto',
};

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

function withdrawStatusState(status: AdminWithdrawRow['status']): MoneyStatusState {
  if (status === 'approved') return 'reviewing';

  if (status === 'sent') return 'settled';

  if (status === 'rejected') return 'rejected';

  return 'pending';
}

function actionableWithdrawals(rows: AdminWithdrawRow[]): AdminWithdrawRow[] {
  return rows.filter((row) => row.status === 'pending' || row.status === 'approved');
}

/** Admin withdraw desk (`/withdrawals`) — approve · reject · mark sent (§29.2). */

export function AdminWithdrawalsPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();

  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    withdrawals,

    filteredWithdrawals,

    withdrawFilters,

    setWithdrawFilters,

    approveWithdraw,

    rejectWithdraw,

    markSent,
  } = useAdminWalletDesk();

  const [methodTab, setMethodTab] = useState<MethodTab>('all');

  const [refreshing, setRefreshing] = useState(false);

  const [actionTarget, setActionTarget] = useState<WithdrawActionTarget | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const pendingRows = useMemo(() => actionableWithdrawals(withdrawals), [withdrawals]);

  const methodCounts = useMemo(() => {
    const counts: Record<MethodTab, number> = {
      all: pendingRows.length,

      krw: 0,

      crypto: 0,
    };

    for (const row of pendingRows) {
      counts[row.method] += 1;
    }

    return counts;
  }, [pendingRows]);

  const visibleRows = useMemo(() => {
    const base = filteredWithdrawals.filter(
      (row) => row.status === 'pending' || row.status === 'approved',
    );

    if (methodTab === 'all') return base;

    return base.filter((row) => row.method === methodTab);
  }, [filteredWithdrawals, methodTab]);

  const openAction = (target: WithdrawActionTarget) => {
    setActionTarget(target);
  };

  const handleActionSubmit = async (reason: string): Promise<boolean> => {
    if (!actionTarget) return false;

    setActionLoading(true);

    try {
      if (actionTarget.kind === 'approveWithdraw') {
        return await approveWithdraw(actionTarget.id, reason);
      }

      if (actionTarget.kind === 'rejectWithdraw') {
        return await rejectWithdraw(actionTarget.id, reason);
      }

      return await markSent(actionTarget.id, reason);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);

    window.setTimeout(() => setRefreshing(false), 600);
  };

  const formatRowSummary = (row: AdminWithdrawRow) =>
    `${row.userId} · ${formatAmountString(row.amount, row.currency)} · ${t(METHOD_FILTER_KEYS[row.method])}`;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.withdrawals')}
          </h2>

          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {pendingRows.length > 0
              ? t('admin.withdrawals.summary.pending', { count: pendingRows.length })
              : t('admin.overview.empty.title')}
          </p>

          <p className="text-foreground-muted m-0 text-sm">{t('admin.withdrawals.description')}</p>
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
        persistenceId="admin-withdrawals"
        titleKey="admin.help.withdrawals.title"
        stepKeys={[
          'admin.help.withdrawals.step1',

          'admin.help.withdrawals.step2',

          'admin.help.withdrawals.step3',
        ]}
      />

      <section aria-labelledby="admin-withdrawals-metrics-heading">
        <h3 id="admin-withdrawals-metrics-heading" className="sr-only">
          {t('admin.nav.withdrawals')}
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label={t('admin.withdrawals.filter.all')}
            value={String(methodCounts.all)}
            emphasis={methodCounts.all > 0}
          />

          <MetricCard
            label={t('admin.wallet.withdraw.filter.method.krw')}
            value={String(methodCounts.krw)}
            emphasis={methodCounts.krw > 0}
          />

          <MetricCard
            label={t('admin.wallet.withdraw.filter.method.crypto')}
            value={String(methodCounts.crypto)}
            emphasis={methodCounts.crypto > 0}
          />
        </div>
      </section>

      {pendingRows.length === 0 ? (
        <EmptyState
          title={t('admin.overview.empty.title')}
          description={t('admin.wallet.withdraw.empty')}
          actionLabel={t('admin.withdrawals.empty.cta')}
          onAction={() => {
            goTo('/queues');
          }}
        />
      ) : (
        <Tabs value={methodTab} onValueChange={(value: string) => setMethodTab(value as MethodTab)}>
          <TabsList className="w-full flex-wrap justify-start">
            <TabsTrigger value="all">
              {t('admin.withdrawals.filter.all')} ({methodCounts.all})
            </TabsTrigger>

            <TabsTrigger value="krw">
              {t('admin.wallet.withdraw.filter.method.krw')} ({methodCounts.krw})
            </TabsTrigger>

            <TabsTrigger value="crypto">
              {t('admin.wallet.withdraw.filter.method.crypto')} ({methodCounts.crypto})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={methodTab}>
            <section className="space-y-3">
              <Input
                value={withdrawFilters.search}
                onChange={(event) =>
                  setWithdrawFilters((prev) => ({ ...prev, search: event.target.value }))
                }
                placeholder={t('admin.wallet.withdraw.filter.search.placeholder')}
                aria-label={t('admin.wallet.withdraw.filter.search.placeholder')}
                className="max-w-md"
              />

              {visibleRows.length === 0 ? (
                <EmptyState
                  title={t('admin.overview.empty.title')}
                  description={t('admin.wallet.withdraw.empty')}
                  actionLabel={t('admin.withdrawals.empty.cta')}
                  onAction={() => {
                    goTo('/queues');
                  }}
                />
              ) : (
                <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                  <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                    <thead className="bg-surface-raised text-foreground-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          {t('admin.wallet.withdraw.col.user')}
                        </th>

                        <th className="px-4 py-3 font-medium">
                          {t('admin.wallet.withdraw.col.amount')}
                        </th>

                        <th className="px-4 py-3 font-medium">
                          {t('admin.withdrawals.col.method')}
                        </th>

                        <th className="px-4 py-3 font-medium">
                          {t('admin.wallet.withdraw.col.destination')}
                        </th>

                        <th className="px-4 py-3 font-medium">
                          {t('admin.wallet.withdraw.col.status')}
                        </th>

                        <th className="px-4 py-3 font-medium">
                          {t('admin.wallet.withdraw.col.created')}
                        </th>

                        <th className="px-4 py-3 font-medium">
                          {t('admin.wallet.withdraw.col.action')}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleRows.map((row) => (
                        <tr key={row.id} className="border-line border-t">
                          <td className="text-foreground-muted px-4 py-3 tabular-nums">
                            {row.userId}
                          </td>

                          <td className="text-foreground px-4 py-3 tabular-nums">
                            {formatAmountString(row.amount, row.currency)}
                          </td>

                          <td className="text-foreground-muted px-4 py-3">
                            {t(METHOD_FILTER_KEYS[row.method])}
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
                              <span className="text-danger ml-2 text-xs">
                                {t('admin.queues.col.sla')}
                              </span>
                            ) : null}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {row.status === 'pending' ? (
                                <>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() =>
                                      openAction({
                                        kind: 'approveWithdraw',

                                        id: row.id,

                                        titleKey: 'admin.withdrawals.dialog.approve',

                                        confirmKey: 'admin.withdrawals.action.approve',

                                        summary: formatRowSummary(row),
                                      })
                                    }
                                  >
                                    {t('admin.withdrawals.action.approve')}
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openAction({
                                        kind: 'rejectWithdraw',

                                        id: row.id,

                                        titleKey: 'admin.withdrawals.dialog.reject',

                                        confirmKey: 'admin.withdrawals.action.reject',

                                        destructive: true,

                                        summary: formatRowSummary(row),
                                      })
                                    }
                                  >
                                    {t('admin.withdrawals.action.reject')}
                                  </Button>
                                </>
                              ) : null}

                              {row.status === 'approved' ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() =>
                                    openAction({
                                      kind: 'markSent',

                                      id: row.id,

                                      titleKey: 'admin.withdrawals.dialog.markSent',

                                      confirmKey: 'admin.withdrawals.action.markSent',

                                      summary: formatRowSummary(row),
                                    })
                                  }
                                >
                                  {t('admin.withdrawals.action.markSent')}
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      )}

      <AdminQueueActionDialog
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
        titleKey={actionTarget?.titleKey ?? 'admin.withdrawals.dialog.approve'}
        confirmKey={actionTarget?.confirmKey ?? 'admin.withdrawals.action.approve'}
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
