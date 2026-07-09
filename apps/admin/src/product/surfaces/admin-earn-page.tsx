import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  useAdminEarnDesk,
  type AgentTier,
  type SettlementState,
} from '@/hooks/admin/useAdminEarnDesk';
import { formatAmountString } from '@/hooks/admin/useAdminWalletDesk';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';

const AGENT_TIER_KEYS: Record<AgentTier, MessageKey> = {
  bronze: 'admin.earn.agents.tier.bronze',
  silver: 'admin.earn.agents.tier.silver',
  gold: 'admin.earn.agents.tier.gold',
  platinum: 'admin.earn.agents.tier.platinum',
};

const SETTLEMENT_STATE_KEYS: Record<SettlementState, MessageKey> = {
  pending: 'admin.earn.settlements.state.pending',
  approved: 'admin.earn.settlements.state.approved',
  paid: 'admin.earn.settlements.state.paid',
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

function LoadingTable({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: cols }, (_, colIndex) => (
            <Skeleton key={colIndex} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Admin earn desk (`/earn`) — settlements read + approve · agents Tier C deferred (§29.2). */
export function AdminEarnPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    agents,
    filteredAgents,
    agentFilters,
    setAgentFilters,
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
  const [activeTab, setActiveTab] = useState<'settlements' | 'agents'>('settlements');

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

      {isError ? (
        <EmptyState
          title={t('admin.earn.error.title')}
          description={t('admin.earn.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value: string) => setActiveTab(value as 'settlements' | 'agents')}
          className="gap-4"
        >
          <TabsList aria-label={t('admin.earn.section.tabs')}>
            <TabsTrigger value="settlements">
              {t('admin.earn.section.settlements')} ({settlementMetrics.pending})
            </TabsTrigger>
            <TabsTrigger value="agents">{t('admin.earn.section.agents')}</TabsTrigger>
          </TabsList>

          <TabsContent value="settlements" className="space-y-4">
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

            {loading ? (
              <LoadingTable rows={5} cols={6} />
            ) : settlements.length === 0 ? (
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

                {filteredSettlements.length === 0 ? (
                  <EmptyState
                    title={t('admin.overview.empty.title')}
                    description={t('admin.earn.settlements.empty')}
                    actionLabel={t('admin.referrals.empty.clearSearch')}
                    onAction={() => setSettlementFilters({ search: '', state: 'all' })}
                  />
                ) : (
                  <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                    <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                      <thead className="bg-surface-raised text-foreground-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.settlements.col.agent')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.settlements.col.period')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.settlements.col.amount')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.settlements.col.state')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.settlements.col.createdAt')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.settlements.col.action')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSettlements.map((row) => (
                          <tr key={row.id} className="border-line border-t">
                            <td className="text-foreground px-4 py-3">
                              <div className="font-medium">{row.agentCode}</div>
                              <div className="text-foreground-muted text-xs">
                                {row.agentDisplayName}
                              </div>
                            </td>
                            <td className="text-foreground-muted px-4 py-3 tabular-nums">
                              {row.periodKey}
                            </td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {formatAmountString(row.amount, row.currency)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                state={settlementStatusState(row.state)}
                                label={t(SETTLEMENT_STATE_KEYS[row.state])}
                              />
                            </td>
                            <td className="text-foreground-muted px-4 py-3 tabular-nums">
                              {formatWhen(row.createdAt, locale)}
                            </td>
                            <td className="px-4 py-3">
                              {row.state === 'pending' ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => approveSettlement(row.id)}
                                >
                                  {t('admin.earn.settlements.action.approve')}
                                </Button>
                              ) : (
                                <span className="text-foreground-muted text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader className="gap-2">
                <CardTitle className="text-base">{t('admin.earn.agents.section.title')}</CardTitle>
                <CardDescription>{t('admin.earn.deferred.agents')}</CardDescription>
              </CardHeader>
            </Card>

            {agents.length === 0 ? (
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.earn.agents.empty')}
                actionLabel={t('admin.earn.shortcut.open')}
                onAction={() => {
                  goTo('/earn/referrals');
                }}
              />
            ) : (
              <section className="space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <Input
                    value={agentFilters.search}
                    onChange={(event) =>
                      setAgentFilters((prev) => ({ ...prev, search: event.target.value }))
                    }
                    placeholder={t('admin.earn.agents.search.placeholder')}
                    aria-label={t('admin.earn.agents.search.placeholder')}
                    className="max-w-md"
                  />
                </div>

                {filteredAgents.length === 0 ? (
                  <EmptyState
                    title={t('admin.overview.empty.title')}
                    description={t('admin.earn.agents.empty')}
                    actionLabel={t('admin.referrals.empty.clearSearch')}
                    onAction={() => setAgentFilters({ search: '', tier: 'all', status: 'all' })}
                  />
                ) : (
                  <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                    <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                      <thead className="bg-surface-raised text-foreground-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.agents.col.agent')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.agents.col.tier')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.agents.col.referrals')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.agents.col.pendingPayout')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.earn.agents.col.status')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAgents.map((row) => (
                          <tr key={row.id} className="border-line border-t">
                            <td className="text-foreground px-4 py-3">
                              <div className="font-medium">{row.agentCode}</div>
                              <div className="text-foreground-muted text-xs">{row.displayName}</div>
                            </td>
                            <td className="text-foreground px-4 py-3">
                              {t(AGENT_TIER_KEYS[row.tier])}
                            </td>
                            <td className="text-foreground-muted px-4 py-3 tabular-nums">
                              {row.referralCount}
                            </td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {row.pendingPayout}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                state={row.status === 'active' ? 'settled' : 'pending'}
                                label={t(`admin.earn.agents.status.${row.status}` as MessageKey)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </TabsContent>
        </Tabs>
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
