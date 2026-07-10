import { useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import { useAdminMissionsDesk } from '@/hooks/admin/useAdminMissionsDesk';
import type { AdminViralMissionRow } from '@/product/bridge/parse-admin-missions-config';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { cn } from '@/product/primitives/lib/cn';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';

function exposureStatus(exposure: AdminViralMissionRow['exposure']): MoneyStatusState {
  if (exposure === 'live') return 'settled';
  return 'halted';
}

function exposureLabelKey(exposure: AdminViralMissionRow['exposure']): MessageKey {
  if (exposure === 'live') return 'admin.missions.exposure.live';
  return 'admin.missions.exposure.hidden';
}

/** Admin missions desk (`/earn/missions`) — `app_config` read only (§29.2 R0). */
export function AdminEarnMissionsPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const { earnLimits, viralMissions, isLoading, isError, refresh } = useAdminMissionsDesk();
  const [refreshing, setRefreshing] = useState(false);

  const liveCount = viralMissions.filter((row) => row.exposure === 'live').length;

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
            {t('admin.nav.missions')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {isLoading
              ? t('admin.missions.summary.loading')
              : t('admin.missions.summary.config', { count: String(earnLimits.length) })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.missions.description')}</p>
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
        persistenceId="admin-earn-missions"
        titleKey="admin.help.missions.title"
        stepKeys={[
          'admin.help.missions.step1',
          'admin.help.missions.step2',
          'admin.help.missions.step3',
        ]}
      />

      {isError ? (
        <EmptyState
          title={t('admin.missions.error.title')}
          description={t('admin.missions.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <Tabs defaultValue="viral" className="gap-4">
          <TabsList aria-label={t('admin.missions.tabs.aria')}>
            <TabsTrigger value="viral">
              {t('admin.missions.tab.viral')} ({liveCount})
            </TabsTrigger>
            <TabsTrigger value="limits">{t('admin.missions.tab.limits')}</TabsTrigger>
          </TabsList>

          <TabsContent value="viral" className="space-y-3">
            <AdminTable
              columns={[
                {
                  id: 'mission',
                  header: t('admin.missions.col.mission'),
                  cell: ({ row }) => t(row.labelKey),
                },
                {
                  id: 'reward',
                  header: t('admin.missions.col.reward'),
                  cell: ({ row }) => `${row.rewardPhon} PHON`,
                  meta: { className: 'tabular-nums' },
                },
                {
                  id: 'quota',
                  header: t('admin.missions.col.quota'),
                  cell: ({ row }) => `${row.quota} ${t(row.quotaPeriodKey)}`,
                  meta: { className: 'text-foreground-muted tabular-nums' },
                },
                {
                  id: 'extra',
                  header: t('admin.missions.col.extra'),
                  cell: ({ row }) =>
                    row.extraValue && row.extraLabelKey
                      ? `${row.extraValue} · ${t(row.extraLabelKey)}`
                      : '—',
                  meta: { className: 'text-foreground-muted tabular-nums' },
                },
                {
                  id: 'exposure',
                  header: t('admin.missions.col.exposure'),
                  cell: ({ row }) => (
                    <StatusBadge
                      state={exposureStatus(row.exposure)}
                      label={t(exposureLabelKey(row.exposure))}
                    />
                  ),
                },
              ]}
              rows={viralMissions}
              getRowId={(row) => row.id}
              loading={isLoading}
              loadingRowCount={5}
              minWidth={760}
              empty={
                <EmptyState
                  title={t('admin.overview.empty.title')}
                  description={t('admin.missions.empty.viral')}
                  actionLabel={t('admin.missions.empty.cta')}
                  onAction={() => goTo('/ops')}
                />
              }
            />
          </TabsContent>

          <TabsContent value="limits" className="space-y-3">
            <AdminTable
              columns={[
                {
                  id: 'setting',
                  header: t('admin.missions.col.setting'),
                  cell: ({ row }) => t(row.labelKey),
                },
                {
                  id: 'value',
                  header: t('admin.missions.col.value'),
                  cell: ({ row }) => row.value,
                  meta: { className: 'tabular-nums' },
                },
                {
                  id: 'note',
                  header: t('admin.missions.col.note'),
                  cell: ({ row }) => row.description ?? '—',
                  meta: { className: 'text-foreground-muted' },
                },
              ]}
              rows={earnLimits}
              getRowId={(row) => row.key}
              loading={isLoading}
              loadingRowCount={6}
              minWidth={640}
              empty={
                <EmptyState
                  title={t('admin.overview.empty.title')}
                  description={t('admin.missions.empty.limits')}
                  actionLabel={t('admin.missions.empty.cta')}
                  onAction={() => goTo('/ops')}
                />
              }
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
