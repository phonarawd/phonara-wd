import { useState } from 'react';

import { RefreshCw } from 'lucide-react';

import { useAdminViralStatsDesk } from '@/hooks/admin/useAdminViralStatsDesk';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="tabular-nums text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

/** Admin viral stats desk (`/viral-stats`) — referral counts · partial aggregates (§29.2 R0). */
export function AdminViralStatsPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const {
    referralSnapshot,
    missionClaims,
    commissionAggregates,
    partialFlags,
    isLoading,
    isError,
    refresh,
  } = useAdminViralStatsDesk();

  const [refreshing, setRefreshing] = useState(false);

  const showPartialNotice =
    partialFlags.relationshipsTruncated ||
    partialFlags.claimsTruncated ||
    partialFlags.commissionsTruncated;

  const totalClaims = missionClaims.reduce((sum, row) => sum + row.claimCount, 0);

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
            {t('admin.nav.viralStats')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {isLoading
              ? t('admin.viralStats.summary.loading')
              : t('admin.viralStats.summary.snapshot', {
                  links: String(referralSnapshot.totalLinks),
                  claims: String(totalClaims),
                })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.viralStats.description')}</p>
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
        persistenceId="admin-viral-stats"
        titleKey="admin.help.viralStats.title"
        stepKeys={[
          'admin.help.viralStats.step1',
          'admin.help.viralStats.step2',
          'admin.help.viralStats.step3',
        ]}
      />

      {showPartialNotice ? (
        <p className="text-foreground-muted m-0 rounded-(--ds-radius-md) border border-line bg-surface-raised px-4 py-3 text-sm">
          {t('admin.viralStats.partialNotice')}
        </p>
      ) : null}

      {isError ? (
        <EmptyState
          title={t('admin.viralStats.error.title')}
          description={t('admin.viralStats.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <>
          <section
            aria-labelledby="admin-viral-stats-metrics-heading"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <h3 id="admin-viral-stats-metrics-heading" className="sr-only">
              {t('admin.nav.viralStats')}
            </h3>
            {isLoading ? (
              <div
                className="col-span-full grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                aria-busy="true"
              >
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-20" />
                ))}
              </div>
            ) : (
              <>
                <MetricCard
                  label={t('admin.viralStats.metric.totalLinks')}
                  value={String(referralSnapshot.totalLinks)}
                />
                <MetricCard
                  label={t('admin.viralStats.metric.uniqueAffiliates')}
                  value={String(referralSnapshot.uniqueAffiliates)}
                />
                <MetricCard
                  label={t('admin.viralStats.metric.recentLinks')}
                  value={String(referralSnapshot.recentLinks)}
                />
                <MetricCard
                  label={t('admin.viralStats.metric.totalClaims')}
                  value={String(totalClaims)}
                />
              </>
            )}
          </section>

          <Tabs defaultValue="referrals" className="gap-4">
            <TabsList aria-label={t('admin.viralStats.tabs.aria')}>
              <TabsTrigger value="referrals">{t('admin.viralStats.tab.referrals')}</TabsTrigger>
              <TabsTrigger value="missions">{t('admin.viralStats.tab.missions')}</TabsTrigger>
              <TabsTrigger value="commissions">{t('admin.viralStats.tab.commissions')}</TabsTrigger>
              <TabsTrigger value="shareEvents">{t('admin.viralStats.tab.shareEvents')}</TabsTrigger>
            </TabsList>

            <TabsContent value="referrals" className="space-y-3">
              <Card>
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">
                    {t('admin.viralStats.section.referrals')}
                  </CardTitle>
                  <CardDescription>{t('admin.viralStats.section.referralsBody')}</CardDescription>
                </CardHeader>
              </Card>
              {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-3" aria-busy="true">
                  {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={index} className="h-20" />
                  ))}
                </div>
              ) : (
                <dl className="m-0 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-(--ds-radius-md) border border-line px-4 py-3">
                    <dt className="text-foreground-muted m-0 text-xs font-medium">
                      {t('admin.viralStats.metric.totalLinks')}
                    </dt>
                    <dd className="text-foreground m-0 mt-1 tabular-nums text-lg font-semibold">
                      {referralSnapshot.totalLinks}
                    </dd>
                  </div>
                  <div className="rounded-(--ds-radius-md) border border-line px-4 py-3">
                    <dt className="text-foreground-muted m-0 text-xs font-medium">
                      {t('admin.viralStats.metric.uniqueAffiliates')}
                    </dt>
                    <dd className="text-foreground m-0 mt-1 tabular-nums text-lg font-semibold">
                      {referralSnapshot.uniqueAffiliates}
                    </dd>
                  </div>
                  <div className="rounded-(--ds-radius-md) border border-line px-4 py-3">
                    <dt className="text-foreground-muted m-0 text-xs font-medium">
                      {t('admin.viralStats.metric.recentLinks')}
                    </dt>
                    <dd className="text-foreground m-0 mt-1 tabular-nums text-lg font-semibold">
                      {referralSnapshot.recentLinks}
                    </dd>
                  </div>
                </dl>
              )}
            </TabsContent>

            <TabsContent value="missions" className="space-y-3">
              <AdminTable
                columns={[
                  {
                    id: 'mission',
                    header: t('admin.viralStats.col.mission'),
                    cell: ({ row }) => t(row.labelKey),
                  },
                  {
                    id: 'claims',
                    header: t('admin.viralStats.col.claims'),
                    cell: ({ row }) => row.claimCount,
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'phonAwarded',
                    header: t('admin.viralStats.col.phonAwarded'),
                    cell: ({ row }) => `${row.phonAwardedTotal} PHON`,
                    meta: { className: 'tabular-nums' },
                  },
                ]}
                rows={missionClaims}
                getRowId={(row) => row.mission}
                loading={isLoading}
                loadingRowCount={4}
                minWidth={640}
                empty={
                  <EmptyState
                    title={t('admin.overview.empty.title')}
                    description={t('admin.viralStats.empty.missions')}
                    actionLabel={t('admin.viralStats.empty.cta')}
                    onAction={() => goTo('/earn/missions')}
                  />
                }
              />
            </TabsContent>

            <TabsContent value="commissions" className="space-y-3">
              <AdminTable
                columns={[
                  {
                    id: 'domain',
                    header: t('admin.viralStats.col.domain'),
                    cell: ({ row }) => row.domain,
                  },
                  {
                    id: 'currency',
                    header: t('admin.viralStats.col.currency'),
                    cell: ({ row }) => row.currency,
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'grossRevenue',
                    header: t('admin.viralStats.col.grossRevenue'),
                    cell: ({ row }) => row.grossRevenueTotal,
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'period',
                    header: t('admin.viralStats.col.period'),
                    cell: ({ row }) => row.latestDate,
                    meta: { className: 'text-foreground-muted tabular-nums' },
                  },
                ]}
                rows={commissionAggregates}
                getRowId={(row) => `${row.domain}-${row.currency}`}
                loading={isLoading}
                loadingRowCount={4}
                minWidth={720}
                empty={
                  <EmptyState
                    title={t('admin.overview.empty.title')}
                    description={t('admin.viralStats.empty.commissions')}
                    actionLabel={t('admin.viralStats.empty.ctaReferrals')}
                    onAction={() => goTo('/earn/referrals')}
                  />
                }
              />
            </TabsContent>

            <TabsContent value="shareEvents" className="space-y-3">
              <EmptyState
                title={t('admin.viralStats.gap.shareEvents.title')}
                description={t('admin.viralStats.gap.shareEvents.body')}
                actionLabel={t('admin.viralStats.empty.cta')}
                onAction={() => {
                  goTo('/earn/missions');
                }}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
