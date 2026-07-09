import { useState } from 'react';

import { RefreshCw } from 'lucide-react';

import { useAdminViralStatsDesk } from '@/hooks/admin/useAdminViralStatsDesk';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';

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
              <LoadingTable rows={1} cols={4} />
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
                <LoadingTable rows={3} cols={2} />
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
              {isLoading ? (
                <LoadingTable rows={4} cols={3} />
              ) : missionClaims.length === 0 ? (
                <EmptyState
                  title={t('admin.overview.empty.title')}
                  description={t('admin.viralStats.empty.missions')}
                  actionLabel={t('admin.viralStats.empty.cta')}
                  onAction={() => {
                    goTo('/earn/missions');
                  }}
                />
              ) : (
                <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead className="bg-surface-raised text-foreground-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          {t('admin.viralStats.col.mission')}
                        </th>
                        <th className="px-4 py-3 font-medium">
                          {t('admin.viralStats.col.claims')}
                        </th>
                        <th className="px-4 py-3 font-medium">
                          {t('admin.viralStats.col.phonAwarded')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {missionClaims.map((row) => (
                        <tr key={row.mission} className="border-line border-t">
                          <td className="text-foreground px-4 py-3">{t(row.labelKey)}</td>
                          <td className="text-foreground px-4 py-3 tabular-nums">
                            {row.claimCount}
                          </td>
                          <td className="text-foreground px-4 py-3 tabular-nums">
                            {row.phonAwardedTotal} PHON
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="commissions" className="space-y-3">
              {isLoading ? (
                <LoadingTable rows={4} cols={4} />
              ) : commissionAggregates.length === 0 ? (
                <EmptyState
                  title={t('admin.overview.empty.title')}
                  description={t('admin.viralStats.empty.commissions')}
                  actionLabel={t('admin.viralStats.empty.ctaReferrals')}
                  onAction={() => {
                    goTo('/earn/referrals');
                  }}
                />
              ) : (
                <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead className="bg-surface-raised text-foreground-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          {t('admin.viralStats.col.domain')}
                        </th>
                        <th className="px-4 py-3 font-medium">
                          {t('admin.viralStats.col.currency')}
                        </th>
                        <th className="px-4 py-3 font-medium">
                          {t('admin.viralStats.col.grossRevenue')}
                        </th>
                        <th className="px-4 py-3 font-medium">
                          {t('admin.viralStats.col.period')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionAggregates.map((row) => (
                        <tr key={`${row.domain}-${row.currency}`} className="border-line border-t">
                          <td className="text-foreground px-4 py-3">{row.domain}</td>
                          <td className="text-foreground px-4 py-3 tabular-nums">{row.currency}</td>
                          <td className="text-foreground px-4 py-3 tabular-nums">
                            {row.grossRevenueTotal}
                          </td>
                          <td className="text-foreground-muted px-4 py-3 tabular-nums">
                            {row.latestDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
