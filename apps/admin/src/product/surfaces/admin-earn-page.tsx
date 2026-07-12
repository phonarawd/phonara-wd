import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import { useAdminEarnDesk, type SettlementState } from '@/hooks/admin/useAdminEarnDesk';
import { useAdminOperatorRbac } from '@/hooks/admin/useAdminOperatorRbac';
import { formatAmountString } from '@/hooks/admin/useAdminWalletDesk';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';
import { ADMIN_RBAC_DENIED_KEY, adminRbacActionProps } from '@/product/surfaces/admin-rbac-action';

const SETTLEMENT_STATE_KEYS: Record<SettlementState, MessageKey> = {
  pending: 'admin.earn.settlements.state.pending',
  approved: 'admin.earn.settlements.state.approved',
  paid: 'admin.earn.settlements.state.paid',
};

type SettlementActionTarget = {
  id: string;
  summary: string;
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

function settlementStatusState(state: SettlementState): MoneyStatusState {
  if (state === 'paid') return 'settled';
  if (state === 'approved') return 'reviewing';
  return 'pending';
}

/** Admin earn desk (`/earn`) — settlements read + reason/RBAC approve · agents Tier C deferred (§29.2 · H-08/M-13). */
export function AdminEarnPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';
  const { can } = useAdminOperatorRbac();
  const canApproveSettlement = can('earn.settlement.approve');
  const rbacDenied = t(ADMIN_RBAC_DENIED_KEY);

  const {
    settlements,
    filteredSettlements,
    settlementFilters,
    setSettlementFilters,
    approveSettlement,
    settlementStates,
    audit,
    loading,
    isError,
    refresh,
  } = useAdminEarnDesk();

  const [refreshing, setRefreshing] = useState(false);
  const [actionTarget, setActionTarget] = useState<SettlementActionTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const settlementMetrics = useMemo(() => {
    const counts = { total: settlements.length, pending: 0, approved: 0, paid: 0 };
    for (const row of settlements) {
      counts[row.state] += 1;
    }
    return counts;
  }, [settlements]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleActionSubmit = async (reason: string): Promise<boolean> => {
    if (!actionTarget || !canApproveSettlement) return false;
    setActionLoading(true);
    try {
      const ok = await approveSettlement(actionTarget.id, reason);
      if (ok) setActionTarget(null);
      return ok;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.earn')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {loading
              ? t('admin.earn.summary.loading')
              : t('admin.earn.summary.settlements', {
                  count: String(settlementMetrics.total),
                  pending: String(settlementMetrics.pending),
                })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.earn.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="md"
          loading={refreshing}
          onClick={() => void handleRefresh()}
          className="shrink-0"
        >
          <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />
          {t('admin.overview.action.refresh')}
        </Button>
      </section>

      <HowItWorks
        persistenceId="admin-earn"
        titleKey="admin.help.earn.title"
        stepKeys={['admin.help.earn.step1', 'admin.help.earn.step2', 'admin.help.earn.step3']}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">{t('admin.earn.shortcut.referrals')}</CardTitle>
            <CardDescription>{t('admin.earn.shortcut.referralsBody')}</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                goTo('/earn/referrals');
              }}
            >
              {t('admin.earn.shortcut.open')}
            </Button>
          </div>
        </Card>
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">{t('admin.earn.shortcut.missions')}</CardTitle>
            <CardDescription>{t('admin.earn.shortcut.missionsBody')}</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                goTo('/earn/missions');
              }}
            >
              {t('admin.earn.shortcut.open')}
            </Button>
          </div>
        </Card>
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">{t('admin.earn.shortcut.rewards')}</CardTitle>
            <CardDescription>{t('admin.earn.shortcut.rewardsBody')}</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                goTo('/earn/rewards');
              }}
            >
              {t('admin.earn.shortcut.open')}
            </Button>
          </div>
        </Card>
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-base">{t('admin.earn.shortcut.viralStats')}</CardTitle>
            <CardDescription>{t('admin.earn.shortcut.viralStatsBody')}</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                goTo('/viral-stats');
              }}
            >
              {t('admin.earn.shortcut.open')}
            </Button>
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('admin.earn.agents.section.title')}</CardTitle>
          <CardDescription>{t('admin.earn.deferred.agents')}</CardDescription>
        </CardHeader>
      </Card>

      {isError ? (
        <EmptyState
          title={t('admin.earn.error.title')}
          description={t('admin.earn.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">
                {t('admin.earn.settlements.section.title')}
              </CardTitle>
              <CardDescription>{t('admin.earn.deferred.settlementsPayout')}</CardDescription>
            </CardHeader>
          </Card>

          <section
            aria-labelledby="admin-earn-settlement-metrics-heading"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <h3 id="admin-earn-settlement-metrics-heading" className="sr-only">
              {t('admin.earn.section.settlements')}
            </h3>
            <MetricCard
              label={t('admin.earn.settlements.metric.total')}
              value={String(settlementMetrics.total)}
            />
            <MetricCard
              label={t('admin.earn.settlements.metric.pending')}
              value={String(settlementMetrics.pending)}
              emphasis={settlementMetrics.pending > 0}
            />
            <MetricCard
              label={t('admin.earn.settlements.metric.approved')}
              value={String(settlementMetrics.approved)}
            />
            <MetricCard
              label={t('admin.earn.settlements.metric.paid')}
              value={String(settlementMetrics.paid)}
            />
          </section>

          {!loading && settlements.length === 0 ? (
            <EmptyState
              title={t('admin.overview.empty.title')}
              description={t('admin.earn.settlements.empty')}
              actionLabel={t('admin.earn.shortcut.open')}
              onAction={() => {
                goTo('/earn/referrals');
              }}
            />
          ) : (
            <section className="space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Input
                  value={settlementFilters.search}
                  onChange={(event) =>
                    setSettlementFilters((prev) => ({ ...prev, search: event.target.value }))
                  }
                  placeholder={t('admin.earn.settlements.search.placeholder')}
                  aria-label={t('admin.earn.settlements.search.placeholder')}
                  className="max-w-md"
                />
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={settlementFilters.state === 'all'}
                    label={t('admin.earn.settlements.state.all')}
                    onClick={() => setSettlementFilters((prev) => ({ ...prev, state: 'all' }))}
                  />
                  {settlementStates.map((state) => (
                    <FilterChip
                      key={state}
                      active={settlementFilters.state === state}
                      label={t(SETTLEMENT_STATE_KEYS[state])}
                      onClick={() => setSettlementFilters((prev) => ({ ...prev, state }))}
                    />
                  ))}
                </div>
              </div>

              <AdminTable
                columns={[
                  {
                    id: 'agent',
                    header: t('admin.earn.settlements.col.agent'),
                    cell: ({ row }) => (
                      <>
                        <div className="font-medium">{row.agentCode}</div>
                        <div className="text-foreground-muted text-xs">{row.agentDisplayName}</div>
                      </>
                    ),
                  },
                  {
                    id: 'period',
                    header: t('admin.earn.settlements.col.period'),
                    cell: ({ row }) => row.periodKey,
                    meta: { className: 'text-foreground-muted tabular-nums' },
                  },
                  {
                    id: 'amount',
                    header: t('admin.earn.settlements.col.amount'),
                    cell: ({ row }) => formatAmountString(row.amount, row.currency),
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'state',
                    header: t('admin.earn.settlements.col.state'),
                    cell: ({ row }) => (
                      <StatusBadge
                        state={settlementStatusState(row.state)}
                        label={t(SETTLEMENT_STATE_KEYS[row.state])}
                      />
                    ),
                  },
                  {
                    id: 'createdAt',
                    header: t('admin.earn.settlements.col.createdAt'),
                    cell: ({ row }) => formatWhen(row.createdAt, locale),
                    meta: { className: 'text-foreground-muted tabular-nums' },
                  },
                ]}
                rows={filteredSettlements}
                getRowId={(row) => row.id}
                loading={loading}
                loadingRowCount={5}
                minWidth={880}
                empty={
                  <EmptyState
                    title={t('admin.overview.empty.title')}
                    description={t('admin.earn.settlements.empty')}
                    actionLabel={t('admin.referrals.empty.clearSearch')}
                    onAction={() => setSettlementFilters({ search: '', state: 'all' })}
                  />
                }
                rowActionsHeader={t('admin.earn.settlements.col.action')}
                rowActions={(row) =>
                  row.state === 'pending' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      data-testid={`admin-earn-approve-${row.id}`}
                      {...adminRbacActionProps(canApproveSettlement, rbacDenied)}
                      onClick={() =>
                        setActionTarget({
                          id: row.id,
                          summary: `${row.agentCode} · ${formatAmountString(row.amount, row.currency)} · ${row.periodKey}`,
                        })
                      }
                    >
                      {t('admin.earn.settlements.action.approve')}
                    </Button>
                  ) : (
                    <span className="text-foreground-muted text-xs">—</span>
                  )
                }
              />
            </section>
          )}
        </div>
      )}

      {audit.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-foreground m-0 text-base font-semibold">
            {t('admin.earn.audit.title')}
          </h3>
          <ul className="m-0 list-none space-y-2 p-0">
            {audit.slice(0, 8).map((event) => (
              <li
                key={event.id}
                className="rounded-md border border-line bg-surface-raised px-4 py-3 text-sm"
              >
                <p className="text-foreground m-0 font-medium">
                  {t(event.actionKey as MessageKey)}
                </p>
                <p className="text-foreground-muted m-0 mt-1">
                  {formatWhen(event.at, locale)}
                  {event.subject ? ` · ${event.subject}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AdminQueueActionDialog
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
        titleKey="admin.earn.settlements.dialog.approve.title"
        confirmKey="admin.earn.settlements.action.approve"
        summary={actionTarget?.summary}
        loading={actionLoading}
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

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant={active ? 'primary' : 'outline'} size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}
