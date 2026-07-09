import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  useAdminWalletDesk,
  formatAmountString,
  type AdminDepositReconRow,
  type DepositMethod,
  type DepositStatus,
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

type MethodTab = 'all' | DepositMethod;

type DepositActionKind = 'matchKrw' | 'matchCrypto' | 'approveGiftcard' | 'flag';

interface DepositActionTarget {
  kind: DepositActionKind;
  id: string;
  titleKey: MessageKey;
  confirmKey: MessageKey;
  destructive?: boolean;
  summary: string;
}

const METHOD_FILTER_KEYS: Record<DepositMethod, MessageKey> = {
  krw: 'admin.wallet.depositRecon.filter.method.krw',
  crypto: 'admin.wallet.depositRecon.filter.method.crypto',
  giftcard: 'admin.wallet.depositRecon.filter.method.giftcard',
};

const MATCH_ACTION_KEYS: Record<
  DepositMethod,
  { action: MessageKey; dialog: MessageKey; kind: DepositActionKind }
> = {
  krw: {
    action: 'admin.deposits.action.matchKrw',
    dialog: 'admin.deposits.dialog.matchKrw',
    kind: 'matchKrw',
  },
  crypto: {
    action: 'admin.deposits.action.matchCrypto',
    dialog: 'admin.deposits.dialog.matchCrypto',
    kind: 'matchCrypto',
  },
  giftcard: {
    action: 'admin.deposits.action.approveGiftcard',
    dialog: 'admin.deposits.dialog.approveGiftcard',
    kind: 'approveGiftcard',
  },
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

function depositCurrency(method: DepositMethod): string {
  return method === 'crypto' ? 'USDT' : 'KRW';
}

function depositStatusState(status: DepositStatus): MoneyStatusState {
  if (status === 'confirming' || status === 'pending_review') return 'reviewing';
  if (status === 'complete') return 'settled';
  if (status === 'failed') return 'failed';
  return 'pending';
}

function isActionableDeposit(status: DepositStatus): boolean {
  return status === 'pending' || status === 'confirming' || status === 'pending_review';
}

function pendingDeposits(rows: AdminDepositReconRow[]): AdminDepositReconRow[] {
  return rows.filter((row) => isActionableDeposit(row.status));
}

/** Admin deposit recon desk (`/deposits`) — `useAdminWalletDesk` match/flag actions (§29.2). */
export function AdminDepositsPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    deposits,
    filteredDeposits,
    depositFilters,
    setDepositFilters,
    matchDeposit,
    flagDeposit,
  } = useAdminWalletDesk();

  const [methodTab, setMethodTab] = useState<MethodTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [actionTarget, setActionTarget] = useState<DepositActionTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const pendingRows = useMemo(() => pendingDeposits(deposits), [deposits]);

  const methodCounts = useMemo(() => {
    const counts: Record<MethodTab, number> = {
      all: pendingRows.length,
      krw: 0,
      crypto: 0,
      giftcard: 0,
    };
    for (const row of pendingRows) {
      counts[row.method] += 1;
    }
    return counts;
  }, [pendingRows]);

  const visibleRows = useMemo(() => {
    const base = filteredDeposits.filter((row) => isActionableDeposit(row.status));
    if (methodTab === 'all') return base;
    return base.filter((row) => row.method === methodTab);
  }, [filteredDeposits, methodTab]);

  const openAction = (target: DepositActionTarget) => {
    setActionTarget(target);
  };

  const handleActionSubmit = async (reason: string): Promise<boolean> => {
    if (!actionTarget) return false;
    setActionLoading(true);
    try {
      if (actionTarget.kind === 'flag') {
        return await flagDeposit(actionTarget.id, reason);
      }
      return await matchDeposit(actionTarget.id, reason);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 600);
  };

  const formatRowSummary = (row: AdminDepositReconRow) =>
    `${row.userId} · ${formatAmountString(row.amount, depositCurrency(row.method))} · ${t(METHOD_FILTER_KEYS[row.method])}`;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.deposits')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {pendingRows.length > 0
              ? t('admin.deposits.summary.pending', { count: pendingRows.length })
              : t('admin.overview.empty.title')}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.deposits.description')}</p>
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
        persistenceId="admin-deposits"
        titleKey="admin.help.deposits.title"
        stepKeys={[
          'admin.help.deposits.step1',
          'admin.help.deposits.step2',
          'admin.help.deposits.step3',
        ]}
      />

      <section aria-labelledby="admin-deposits-metrics-heading">
        <h3 id="admin-deposits-metrics-heading" className="sr-only">
          {t('admin.nav.deposits')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label={t('admin.deposits.filter.all')}
            value={String(methodCounts.all)}
            emphasis={methodCounts.all > 0}
          />
          <MetricCard
            label={t('admin.wallet.depositRecon.filter.method.krw')}
            value={String(methodCounts.krw)}
            emphasis={methodCounts.krw > 0}
          />
          <MetricCard
            label={t('admin.wallet.depositRecon.filter.method.crypto')}
            value={String(methodCounts.crypto)}
            emphasis={methodCounts.crypto > 0}
          />
          <MetricCard
            label={t('admin.wallet.depositRecon.filter.method.giftcard')}
            value={String(methodCounts.giftcard)}
            emphasis={methodCounts.giftcard > 0}
          />
        </div>
      </section>

      {pendingRows.length === 0 ? (
        <EmptyState
          title={t('admin.overview.empty.title')}
          description={t('admin.wallet.depositRecon.empty')}
          actionLabel={t('admin.deposits.empty.cta')}
          onAction={() => {
            goTo('/queues');
          }}
        />
      ) : (
        <Tabs value={methodTab} onValueChange={(value: string) => setMethodTab(value as MethodTab)}>
          <TabsList className="w-full flex-wrap justify-start">
            <TabsTrigger value="all">
              {t('admin.deposits.filter.all')} ({methodCounts.all})
            </TabsTrigger>
            <TabsTrigger value="krw">
              {t('admin.wallet.depositRecon.filter.method.krw')} ({methodCounts.krw})
            </TabsTrigger>
            <TabsTrigger value="crypto">
              {t('admin.wallet.depositRecon.filter.method.crypto')} ({methodCounts.crypto})
            </TabsTrigger>
            <TabsTrigger value="giftcard">
              {t('admin.wallet.depositRecon.filter.method.giftcard')} ({methodCounts.giftcard})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={methodTab}>
            <section className="space-y-3">
              <Input
                value={depositFilters.search}
                onChange={(event) =>
                  setDepositFilters((prev) => ({ ...prev, search: event.target.value }))
                }
                placeholder={t('admin.wallet.depositRecon.filter.search.placeholder')}
                aria-label={t('admin.wallet.depositRecon.filter.search.placeholder')}
                className="max-w-md"
              />

              {visibleRows.length === 0 ? (
                <EmptyState
                  title={t('admin.overview.empty.title')}
                  description={t('admin.wallet.depositRecon.empty')}
                  actionLabel={t('admin.deposits.empty.cta')}
                  onAction={() => {
                    goTo('/queues');
                  }}
                />
              ) : (
                <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead className="bg-surface-raised text-foreground-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">{t('admin.queues.col.details')}</th>
                        <th className="px-4 py-3 font-medium">{t('admin.queues.col.amount')}</th>
                        <th className="px-4 py-3 font-medium">{t('admin.deposits.col.method')}</th>
                        <th className="px-4 py-3 font-medium">
                          {t('admin.wallet.depositRecon.col.reference')}
                        </th>
                        <th className="px-4 py-3 font-medium">{t('admin.queues.col.status')}</th>
                        <th className="px-4 py-3 font-medium">{t('admin.queues.col.created')}</th>
                        <th className="px-4 py-3 font-medium">{t('admin.queues.col.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row) => {
                        const matchConfig = MATCH_ACTION_KEYS[row.method];
                        return (
                          <tr key={row.id} className="border-line border-t">
                            <td className="text-foreground-muted px-4 py-3 tabular-nums">
                              {row.userId}
                            </td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {formatAmountString(row.amount, depositCurrency(row.method))}
                            </td>
                            <td className="text-foreground-muted px-4 py-3">
                              {t(METHOD_FILTER_KEYS[row.method])}
                            </td>
                            <td className="text-foreground-muted max-w-48 truncate px-4 py-3">
                              {row.reference ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge state={depositStatusState(row.status)} />
                            </td>
                            <td className="text-foreground-muted px-4 py-3 tabular-nums">
                              {formatWhen(row.createdAt, locale)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() =>
                                    openAction({
                                      kind: matchConfig.kind,
                                      id: row.id,
                                      titleKey: matchConfig.dialog,
                                      confirmKey: matchConfig.action,
                                      summary: formatRowSummary(row),
                                    })
                                  }
                                >
                                  {t(matchConfig.action)}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    openAction({
                                      kind: 'flag',
                                      id: row.id,
                                      titleKey: 'admin.deposits.dialog.flag',
                                      confirmKey: 'admin.deposits.action.flag',
                                      destructive: true,
                                      summary: formatRowSummary(row),
                                    })
                                  }
                                >
                                  {t('admin.deposits.action.flag')}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
        titleKey={actionTarget?.titleKey ?? 'admin.deposits.dialog.flag'}
        confirmKey={actionTarget?.confirmKey ?? 'admin.deposits.action.flag'}
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
