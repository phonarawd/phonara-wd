import { useState } from 'react';

import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';

import { RefreshCw } from 'lucide-react';

import { useAdminTiersDesk } from '@/hooks/admin/useAdminTiersDesk';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';
import { StatusBadge } from '@/product/primitives/status-badge';
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

/** Admin tiers desk (`/tiers`) — `user_earn_vip` read · decay monitor deferred E1 (§29.2 R0). */
export function AdminTiersPage() {
  const t = useT();
  const navigate = useAdminRouteNavigate();
  const {
    distribution,
    goldenEarthLimits,
    earnMissionLimits,
    decayPolicy,
    decayPhase,
    totalMembers,
    isLoading,
    isError,
    refresh,
  } = useAdminTiersDesk();

  const [refreshing, setRefreshing] = useState(false);

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
            {t('admin.nav.tiers')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {isLoading
              ? t('admin.tiers.summary.loading')
              : t('admin.tiers.summary.members', { count: String(totalMembers) })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.tiers.description')}</p>
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
        </div>
      </section>

      <HowItWorks
        persistenceId="admin-tiers"
        titleKey="admin.help.tiers.title"
        stepKeys={['admin.help.tiers.step1', 'admin.help.tiers.step2', 'admin.help.tiers.step3']}
      />

      {isError ? (
        <EmptyState
          title={t('admin.tiers.error.title')}
          description={t('admin.tiers.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <Tabs defaultValue="distribution" className="gap-4">
          <TabsList aria-label={t('admin.tiers.tabs.aria')}>
            <TabsTrigger value="distribution">{t('admin.tiers.tab.distribution')}</TabsTrigger>
            <TabsTrigger value="limits">{t('admin.tiers.tab.limits')}</TabsTrigger>
            <TabsTrigger value="decay">{t('admin.tiers.tab.decay')}</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="space-y-3">
            {isLoading ? (
              <LoadingTable rows={5} cols={2} />
            ) : totalMembers === 0 ? (
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.tiers.empty.distribution')}
                actionLabel={t('admin.tiers.empty.cta')}
                onAction={() => {
                  void navigate('/ops');
                }}
              />
            ) : (
              <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                  <thead className="bg-surface-raised text-foreground-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t('admin.tiers.col.tier')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.tiers.col.members')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distribution.map((row) => (
                      <tr key={row.tier} className="border-line border-t">
                        <td className="text-foreground px-4 py-3">{t(row.labelKey)}</td>
                        <td className="text-foreground px-4 py-3 tabular-nums">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="limits" className="space-y-6">
            {isLoading ? (
              <LoadingTable rows={5} cols={4} />
            ) : (
              <>
                <section className="space-y-3">
                  <h3 className="text-foreground m-0 text-base font-semibold">
                    {t('admin.tiers.limits.goldenEarth.title')}
                  </h3>
                  <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead className="bg-surface-raised text-foreground-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">{t('admin.tiers.col.tier')}</th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.tiers.col.dailyTapCap')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.tiers.col.phonPerTap')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {goldenEarthLimits.map((row) => (
                          <tr key={row.tier} className="border-line border-t">
                            <td className="text-foreground px-4 py-3">{t(row.labelKey)}</td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {row.dailyTapCap}
                            </td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {row.phonPerTap} PHON
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-foreground m-0 text-base font-semibold">
                    {t('admin.tiers.limits.missions.title')}
                  </h3>
                  <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                    <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                      <thead className="bg-surface-raised text-foreground-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">{t('admin.tiers.col.tier')}</th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.tiers.col.attendance')}
                          </th>
                          <th className="px-4 py-3 font-medium">{t('admin.tiers.col.roulette')}</th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.tiers.col.referralPayout')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.tiers.col.viralShare')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.tiers.col.dailyQuiz')}
                          </th>
                          <th className="px-4 py-3 font-medium">
                            {t('admin.tiers.col.referralMultiplier')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnMissionLimits.map((row) => (
                          <tr key={row.tier} className="border-line border-t">
                            <td className="text-foreground px-4 py-3">{t(row.labelKey)}</td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {row.attendance}
                            </td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {row.roulette}
                            </td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {row.referralPayout}
                            </td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {row.viralShare}
                            </td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {row.dailyQuiz}
                            </td>
                            <td className="text-foreground px-4 py-3 tabular-nums">
                              {row.referralMultiplier}×
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </TabsContent>

          <TabsContent value="decay" className="space-y-4">
            <Card>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">
                    {t('admin.tiers.decay.monitor.title')}
                  </CardTitle>
                  <StatusBadge
                    state="halted"
                    label={
                      decayPhase === 'deferred'
                        ? t('admin.tiers.decay.monitor.deferred')
                        : t('common.comingSoon')
                    }
                  />
                </div>
                <CardDescription>{t('admin.tiers.decay.monitor.description')}</CardDescription>
              </CardHeader>
            </Card>

            <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-surface-raised text-foreground-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('admin.tiers.col.tier')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.tiers.col.keepCondition')}</th>
                    <th className="px-4 py-3 font-medium">
                      {t('admin.tiers.col.downgradeTarget')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {decayPolicy.map((row) => (
                    <tr key={row.tier} className="border-line border-t">
                      <td className="text-foreground px-4 py-3">{t(row.labelKey)}</td>
                      <td className="text-foreground-muted px-4 py-3">{t(row.keepConditionKey)}</td>
                      <td className="text-foreground-muted px-4 py-3">
                        {row.downgradeTargetKey ? t(row.downgradeTargetKey) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-foreground-muted m-0 text-sm">{t('admin.tiers.decay.footnote')}</p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
