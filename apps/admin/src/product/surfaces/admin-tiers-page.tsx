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
import { AdminTable } from '@/product/primitives/admin-table';
import { StatusBadge } from '@/product/primitives/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';

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
            <AdminTable
              columns={[
                {
                  id: 'tier',
                  header: t('admin.tiers.col.tier'),
                  cell: ({ row }) => t(row.labelKey),
                },
                {
                  id: 'members',
                  header: t('admin.tiers.col.members'),
                  cell: ({ row }) => row.count,
                  meta: { className: 'tabular-nums' },
                },
              ]}
              rows={distribution}
              getRowId={(row) => row.tier}
              loading={isLoading}
              loadingRowCount={5}
              minWidth={480}
              empty={
                <EmptyState
                  title={t('admin.overview.empty.title')}
                  description={t('admin.tiers.empty.distribution')}
                  actionLabel={t('admin.tiers.empty.cta')}
                  onAction={() => void navigate('/ops')}
                />
              }
            />
          </TabsContent>

          <TabsContent value="limits" className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-foreground m-0 text-base font-semibold">
                {t('admin.tiers.limits.goldenEarth.title')}
              </h3>
              <AdminTable
                columns={[
                  {
                    id: 'tier',
                    header: t('admin.tiers.col.tier'),
                    cell: ({ row }) => t(row.labelKey),
                  },
                  {
                    id: 'dailyTapCap',
                    header: t('admin.tiers.col.dailyTapCap'),
                    cell: ({ row }) => row.dailyTapCap,
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'phonPerTap',
                    header: t('admin.tiers.col.phonPerTap'),
                    cell: ({ row }) => `${row.phonPerTap} PHON`,
                    meta: { className: 'tabular-nums' },
                  },
                ]}
                rows={goldenEarthLimits}
                getRowId={(row) => row.tier}
                loading={isLoading}
                loadingRowCount={5}
                minWidth={640}
              />
            </section>
            <section className="space-y-3">
              <h3 className="text-foreground m-0 text-base font-semibold">
                {t('admin.tiers.limits.missions.title')}
              </h3>
              <AdminTable
                columns={[
                  {
                    id: 'tier',
                    header: t('admin.tiers.col.tier'),
                    cell: ({ row }) => t(row.labelKey),
                  },
                  {
                    id: 'attendance',
                    header: t('admin.tiers.col.attendance'),
                    cell: ({ row }) => row.attendance,
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'roulette',
                    header: t('admin.tiers.col.roulette'),
                    cell: ({ row }) => row.roulette,
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'referralPayout',
                    header: t('admin.tiers.col.referralPayout'),
                    cell: ({ row }) => row.referralPayout,
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'viralShare',
                    header: t('admin.tiers.col.viralShare'),
                    cell: ({ row }) => row.viralShare,
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'dailyQuiz',
                    header: t('admin.tiers.col.dailyQuiz'),
                    cell: ({ row }) => row.dailyQuiz,
                    meta: { className: 'tabular-nums' },
                  },
                  {
                    id: 'referralMultiplier',
                    header: t('admin.tiers.col.referralMultiplier'),
                    cell: ({ row }) => `${row.referralMultiplier}×`,
                    meta: { className: 'tabular-nums' },
                  },
                ]}
                rows={earnMissionLimits}
                getRowId={(row) => row.tier}
                loading={isLoading}
                loadingRowCount={5}
                minWidth={920}
              />
            </section>
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

            <AdminTable
              columns={[
                {
                  id: 'tier',
                  header: t('admin.tiers.col.tier'),
                  cell: ({ row }) => t(row.labelKey),
                },
                {
                  id: 'keepCondition',
                  header: t('admin.tiers.col.keepCondition'),
                  cell: ({ row }) => t(row.keepConditionKey),
                  meta: { className: 'text-foreground-muted' },
                },
                {
                  id: 'downgradeTarget',
                  header: t('admin.tiers.col.downgradeTarget'),
                  cell: ({ row }) => (row.downgradeTargetKey ? t(row.downgradeTargetKey) : '—'),
                  meta: { className: 'text-foreground-muted' },
                },
              ]}
              rows={decayPolicy}
              getRowId={(row) => row.tier}
              loading={isLoading}
              loadingRowCount={5}
              minWidth={720}
            />

            <p className="text-foreground-muted m-0 text-sm">{t('admin.tiers.decay.footnote')}</p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
