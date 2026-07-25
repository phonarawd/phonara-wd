import { useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  formatKrwGrouped,
  useAdminSports,
  type SportsFixtureRow,
  type SportsFixtureStatus,
  type SportsUserRiskTier,
} from '@/hooks/admin/useAdminSports';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { AdminTable } from '@/product/primitives/admin-table';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';
import { AdminSportsSettleDialog } from '@/product/surfaces/admin-sports-settle-dialog';

type SportsActionKind =
  | 'suspend'
  | 'resume'
  | 'void'
  | 'enableFeature'
  | 'disableFeature'
  | 'setRiskTier';

interface SportsActionTarget {
  kind: SportsActionKind;
  fixtureId?: string;
  titleKey: MessageKey;
  confirmKey: MessageKey;
  destructive?: boolean;
  summary: string;
  riskUserId?: string;
  riskTier?: SportsUserRiskTier;
}

const STATUS_KEYS: Record<SportsFixtureStatus, MessageKey> = {
  live: 'admin.sports.queue.status.live',
  ft: 'admin.sports.queue.status.ft',
  scheduled: 'admin.sports.queue.status.scheduled',
};

const RISK_TIER_KEYS: Record<'A' | 'B' | 'C', MessageKey> = {
  A: 'admin.sports.risk.tier.A',
  B: 'admin.sports.risk.tier.B',
  C: 'admin.sports.risk.tier.C',
};

const USER_RISK_TIER_OPTIONS: SportsUserRiskTier[] = ['normal', 'restricted', 'sharp', 'banned'];

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

function fixtureStatusState(status: SportsFixtureStatus): MoneyStatusState {
  if (status === 'live') return 'reviewing';
  if (status === 'ft') return 'settled';
  return 'pending';
}

function formatFixtureSummary(row: SportsFixtureRow): string {
  return `${row.league} · ${row.home} vs ${row.away}\n${row.id}`;
}

function toggleStatusFilter(
  list: SportsFixtureStatus[],
  value: SportsFixtureStatus,
): SportsFixtureStatus[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Admin sports desk (`/sports`) — unsettled queue · quorum settle · suspend/void (§29.2). */
export function AdminSportsPage() {
  const t = useT();
  const qc = useQueryClient();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    featureEnabled,
    fixtures,
    suspended,
    risk,
    exposure,
    tier,
    setFeatureEnabled,
    suspendMarket,
    unsuspendMarket,
    settleFixtureQuorum,
    voidFixtureMarket,
    setSportsRiskTier,
  } = useAdminSports();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SportsFixtureStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [settleTarget, setSettleTarget] = useState<SportsFixtureRow | null>(null);
  const [settleLoading, setSettleLoading] = useState(false);
  const [actionTarget, setActionTarget] = useState<SportsActionTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [riskUserId, setRiskUserId] = useState('');
  const [riskTier, setRiskTier] = useState<SportsUserRiskTier>('restricted');

  const suspendedIds = useMemo(() => new Set(suspended.map((row) => row.fixtureId)), [suspended]);

  const filteredFixtures = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fixtures.filter((row) => {
      if (statusFilter.length > 0 && !statusFilter.includes(row.status)) return false;
      if (!q) return true;
      return (
        row.id.toLowerCase().includes(q) ||
        row.league.toLowerCase().includes(q) ||
        row.home.toLowerCase().includes(q) ||
        row.away.toLowerCase().includes(q)
      );
    });
  }, [fixtures, search, statusFilter]);

  const unsettledMarkets = useMemo(
    () => fixtures.reduce((sum, row) => sum + row.unsettledMarkets, 0),
    [fixtures],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await qc.invalidateQueries({ queryKey: ['admin-sports-desk'] });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSettleSubmit = async (
    homeGoals: number,
    awayGoals: number,
    reason: string,
    forceQuorum: boolean,
  ): Promise<boolean> => {
    if (!settleTarget) return false;
    setSettleLoading(true);
    try {
      return await settleFixtureQuorum(settleTarget.id, homeGoals, awayGoals, reason, forceQuorum);
    } finally {
      setSettleLoading(false);
    }
  };

  const handleActionSubmit = async (reason: string): Promise<boolean> => {
    if (!actionTarget) return false;
    setActionLoading(true);
    try {
      if (actionTarget.kind === 'suspend' && actionTarget.fixtureId) {
        return await suspendMarket(actionTarget.fixtureId, reason);
      }
      if (actionTarget.kind === 'resume' && actionTarget.fixtureId) {
        return await unsuspendMarket(actionTarget.fixtureId, reason);
      }
      if (actionTarget.kind === 'void' && actionTarget.fixtureId) {
        return await voidFixtureMarket(actionTarget.fixtureId, reason);
      }
      if (actionTarget.kind === 'enableFeature') {
        return await setFeatureEnabled(true, reason);
      }
      if (actionTarget.kind === 'disableFeature') {
        return await setFeatureEnabled(false, reason);
      }
      if (actionTarget.kind === 'setRiskTier' && actionTarget.riskUserId && actionTarget.riskTier) {
        return await setSportsRiskTier(actionTarget.riskUserId, actionTarget.riskTier, reason);
      }
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const openRiskTierDialog = () => {
    const trimmed = riskUserId.trim();
    if (!trimmed) return;
    setActionTarget({
      kind: 'setRiskTier',
      titleKey: 'admin.sports.risk.setTier.title',
      confirmKey: 'admin.sports.risk.setTier.confirm',
      summary: `${trimmed} · ${t(`admin.sports.risk.userTier.${riskTier}` as MessageKey)}`,
      riskUserId: trimmed,
      riskTier,
    });
  };

  return (
    <div className="flex flex-col gap-ds-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.sports')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {fixtures.length > 0
              ? t('admin.sports.summary.unsettled', {
                  fixtures: String(fixtures.length),
                  markets: String(unsettledMarkets),
                })
              : t('admin.sports.summary.clear')}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.sports.description')}</p>
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
        persistenceId="admin-sports"
        titleKey="admin.help.sports.title"
        stepKeys={['admin.help.sports.step1', 'admin.help.sports.step2', 'admin.help.sports.step3']}
      />

      <section
        aria-labelledby="admin-sports-metrics-heading"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <h3 id="admin-sports-metrics-heading" className="sr-only">
          {t('admin.nav.sports')}
        </h3>
        <MetricCard
          label={t('admin.sports.queue.title')}
          value={String(fixtures.length)}
          emphasis={fixtures.length > 0}
        />
        <MetricCard label={t('admin.sports.exposure.openBets')} value={String(exposure.openBets)} />
        <MetricCard
          label={t('admin.sports.exposure.total')}
          value={formatKrwGrouped(exposure.total)}
        />
        <MetricCard label={t('admin.sports.risk.tierBanner')} value={t(RISK_TIER_KEYS[tier])} />
      </section>

      <Tabs defaultValue="queue">
        <TabsList aria-label={t('admin.sports.hub.title')}>
          <TabsTrigger value="queue">
            {t('admin.sports.tab.queue')} ({fixtures.length})
          </TabsTrigger>
          <TabsTrigger value="exposure">{t('admin.sports.tab.exposure')}</TabsTrigger>
          <TabsTrigger value="risk">
            {t('admin.sports.tab.risk')} ({risk.length})
          </TabsTrigger>
          <TabsTrigger value="ops">{t('admin.sports.tab.ops')}</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" forceMount className="space-y-4 data-[state=inactive]:hidden">
          <div className="flex flex-col gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('admin.sports.filter.search.placeholder')}
              aria-label={t('admin.sports.filter.search.placeholder')}
              className="max-w-md"
            />
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_KEYS) as SportsFixtureStatus[]).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter.includes(status) ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter((prev) => toggleStatusFilter(prev, status))}
                >
                  {t(STATUS_KEYS[status])}
                </Button>
              ))}
            </div>
          </div>

          {filteredFixtures.length === 0 ? (
            <EmptyState
              title={t('admin.sports.queue.empty')}
              description={t('admin.sports.empty.desc')}
              actionLabel={t('admin.sports.empty.cta')}
              onAction={() => void handleRefresh()}
            />
          ) : (
            <AdminTable
              columns={[
                {
                  id: 'fixture',
                  header: t('admin.sports.queue.col.fixture'),
                  cell: ({ row }) => {
                    const isSuspended = suspendedIds.has(row.id);
                    return (
                      <div>
                        <div className="font-medium">
                          {row.home} vs {row.away}
                        </div>
                        <div className="text-foreground-muted text-xs">{row.id}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <StatusBadge
                            state={fixtureStatusState(row.status)}
                            label={t(STATUS_KEYS[row.status])}
                          />
                          {isSuspended ? (
                            <StatusBadge
                              state="reviewing"
                              label={t('admin.sports.queue.suspendedBadge')}
                            />
                          ) : null}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  id: 'league',
                  header: t('admin.sports.queue.col.league'),
                  cell: ({ row }) => row.league,
                  meta: { className: 'text-foreground-muted' },
                },
                {
                  id: 'kickoff',
                  header: t('admin.sports.queue.col.kickoff'),
                  cell: ({ row }) => formatWhen(row.kickoff, locale),
                  meta: { className: 'text-foreground-muted tabular-nums' },
                },
                {
                  id: 'unsettled',
                  header: t('admin.sports.queue.col.unsettled'),
                  cell: ({ row }) => row.unsettledMarkets,
                  meta: { className: 'tabular-nums' },
                },
                {
                  id: 'exposure',
                  header: t('admin.sports.queue.col.exposure'),
                  cell: ({ row }) => formatKrwGrouped(row.exposure),
                  meta: { className: 'text-foreground-muted tabular-nums' },
                },
              ]}
              rows={filteredFixtures}
              getRowId={(row) => row.id}
              minWidth={960}
              rowActionsHeader={t('admin.sports.queue.col.action')}
              rowActions={(row) => {
                const isSuspended = suspendedIds.has(row.id);
                return (
                  <>
                    <Button size="sm" variant="primary" onClick={() => setSettleTarget(row)}>
                      {t('admin.sports.queue.action.settle')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setActionTarget({
                          kind: isSuspended ? 'resume' : 'suspend',
                          fixtureId: row.id,
                          titleKey: isSuspended
                            ? 'admin.sports.resume.title'
                            : 'admin.sports.suspend.title',
                          confirmKey: isSuspended
                            ? 'admin.sports.resume.confirm'
                            : 'admin.sports.suspend.confirm',
                          summary: formatFixtureSummary(row),
                        })
                      }
                    >
                      {t(
                        isSuspended
                          ? 'admin.sports.queue.action.resume'
                          : 'admin.sports.queue.action.suspend',
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setActionTarget({
                          kind: 'void',
                          fixtureId: row.id,
                          titleKey: 'admin.sports.void.title',
                          confirmKey: 'admin.sports.void.confirm',
                          destructive: true,
                          summary: formatFixtureSummary(row),
                        })
                      }
                    >
                      {t('admin.sports.queue.action.void')}
                    </Button>
                  </>
                );
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="exposure" forceMount className="space-y-4 data-[state=inactive]:hidden">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">{t('admin.sports.exposure.title')}</CardTitle>
              <CardDescription>{t('admin.sports.hub.subtitle')}</CardDescription>
            </CardHeader>
            <div className="grid gap-3 px-6 pb-6 sm:grid-cols-3">
              <MetricCard
                label={t('admin.sports.exposure.total')}
                value={formatKrwGrouped(exposure.total)}
              />
              <MetricCard
                label={t('admin.sports.exposure.max')}
                value={formatKrwGrouped(exposure.max)}
              />
              <MetricCard
                label={t('admin.sports.exposure.openBets')}
                value={String(exposure.openBets)}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="risk" forceMount className="space-y-4 data-[state=inactive]:hidden">
          <Card>
            <CardHeader className="gap-1">
              <CardTitle className="text-base">{t('admin.sports.risk.tierBanner')}</CardTitle>
              <CardDescription>{t('admin.sports.risk.tierDesc')}</CardDescription>
            </CardHeader>
            <CardHeader className="pt-0">
              <CardTitle className="text-2xl">{t(RISK_TIER_KEYS[tier])}</CardTitle>
            </CardHeader>
          </Card>

          {risk.length === 0 ? (
            <EmptyState
              title={t('admin.sports.risk.empty')}
              description={t('admin.sports.empty.desc')}
              actionLabel={t('admin.sports.empty.cta')}
              onAction={() => void handleRefresh()}
            />
          ) : (
            <AdminTable
              columns={[
                {
                  id: 'time',
                  header: t('admin.audit.col.time'),
                  cell: ({ row }) => formatWhen(row.at, locale),
                  meta: { className: 'text-foreground-muted tabular-nums' },
                },
                {
                  id: 'event',
                  header: t('admin.sports.risk.eventsTitle'),
                  cell: ({ row }) => t(row.labelKey as MessageKey),
                },
                {
                  id: 'severity',
                  header: t('admin.sports.risk.severity.info'),
                  cell: ({ row }) => t(`admin.sports.risk.severity.${row.severity}` as MessageKey),
                  meta: { className: 'text-foreground-muted' },
                },
              ]}
              rows={risk}
              getRowId={(row) => row.id}
              minWidth={640}
            />
          )}
        </TabsContent>

        <TabsContent value="ops" forceMount className="space-y-4 data-[state=inactive]:hidden">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">
                {t('admin.operations.feature.sports.title')}
              </CardTitle>
              <CardDescription>{t('admin.operations.feature.sports.desc')}</CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2 px-6 pb-6">
              <Button
                size="sm"
                variant={featureEnabled ? 'outline' : 'primary'}
                disabled={featureEnabled}
                onClick={() =>
                  setActionTarget({
                    kind: 'enableFeature',
                    titleKey: 'admin.sports.ops.enable.title',
                    confirmKey: 'admin.sports.ops.enable.confirm',
                    summary: t('admin.operations.feature.sports.title'),
                  })
                }
              >
                {t('admin.sports.ops.enable.action')}
              </Button>
              <Button
                size="sm"
                variant={featureEnabled ? 'destructive' : 'outline'}
                disabled={!featureEnabled}
                onClick={() =>
                  setActionTarget({
                    kind: 'disableFeature',
                    titleKey: 'admin.sports.ops.disable.title',
                    confirmKey: 'admin.sports.ops.disable.confirm',
                    destructive: true,
                    summary: t('admin.operations.feature.sports.title'),
                  })
                }
              >
                {t('admin.sports.ops.disable.action')}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-base">{t('admin.sports.risk.setTier.title')}</CardTitle>
              <CardDescription>{t('admin.sports.risk.setTier.desc')}</CardDescription>
            </CardHeader>
            <div className="flex flex-col gap-3 px-6 pb-6">
              <Input
                value={riskUserId}
                onChange={(event) => setRiskUserId(event.target.value)}
                placeholder={t('admin.sports.risk.setTier.userId.placeholder')}
                aria-label={t('admin.sports.risk.setTier.userId.placeholder')}
                className="max-w-md"
              />
              <div className="flex flex-wrap gap-2">
                {USER_RISK_TIER_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={riskTier === option ? 'primary' : 'outline'}
                    onClick={() => setRiskTier(option)}
                  >
                    {t(`admin.sports.risk.userTier.${option}` as MessageKey)}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                variant="primary"
                className="w-fit"
                disabled={riskUserId.trim().length === 0}
                onClick={openRiskTierDialog}
              >
                {t('admin.sports.risk.setTier.action')}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <AdminSportsSettleDialog
        open={settleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSettleTarget(null);
        }}
        fixtureSummary={settleTarget ? formatFixtureSummary(settleTarget) : ''}
        loading={settleLoading}
        onSubmit={handleSettleSubmit}
      />

      <AdminQueueActionDialog
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
        titleKey={actionTarget?.titleKey ?? 'admin.sports.suspend.title'}
        confirmKey={actionTarget?.confirmKey ?? 'admin.sports.suspend.confirm'}
        summary={
          actionTarget ? (
            <p className="text-foreground m-0 whitespace-pre-line text-sm">
              {actionTarget.summary}
            </p>
          ) : null
        }
        loading={actionLoading}
        destructive={actionTarget?.destructive}
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
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
