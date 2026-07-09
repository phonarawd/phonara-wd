import { useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import { useAdminMissionsDesk } from '@/hooks/admin/useAdminMissionsDesk';
import type { AdminViralMissionRow } from '@/product/bridge/parse-admin-missions-config';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';
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
            {isLoading ? (
              <LoadingTable rows={5} cols={5} />
            ) : viralMissions.length === 0 ? (
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.missions.empty.viral')}
                actionLabel={t('admin.missions.empty.cta')}
                onAction={() => {
                  goTo('/ops');
                }}
              />
            ) : (
              <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-surface-raised text-foreground-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t('admin.missions.col.mission')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.missions.col.reward')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.missions.col.quota')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.missions.col.extra')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.missions.col.exposure')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viralMissions.map((row) => (
                      <tr key={row.id} className="border-line border-t">
                        <td className="text-foreground px-4 py-3">{t(row.labelKey)}</td>
                        <td className="text-foreground px-4 py-3 tabular-nums">
                          {row.rewardPhon} PHON
                        </td>
                        <td className="text-foreground-muted px-4 py-3 tabular-nums">
                          {row.quota} {t(row.quotaPeriodKey)}
                        </td>
                        <td className="text-foreground-muted px-4 py-3 tabular-nums">
                          {row.extraValue && row.extraLabelKey
                            ? `${row.extraValue} · ${t(row.extraLabelKey)}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            state={exposureStatus(row.exposure)}
                            label={t(exposureLabelKey(row.exposure))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="limits" className="space-y-3">
            {isLoading ? (
              <LoadingTable rows={6} cols={3} />
            ) : earnLimits.length === 0 ? (
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.missions.empty.limits')}
                actionLabel={t('admin.missions.empty.cta')}
                onAction={() => {
                  goTo('/ops');
                }}
              />
            ) : (
              <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className="bg-surface-raised text-foreground-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t('admin.missions.col.setting')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.missions.col.value')}</th>
                      <th className="px-4 py-3 font-medium">{t('admin.missions.col.note')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnLimits.map((row) => (
                      <tr key={row.key} className="border-line border-t">
                        <td className="text-foreground px-4 py-3">{t(row.labelKey)}</td>
                        <td className="text-foreground px-4 py-3 tabular-nums">{row.value}</td>
                        <td className="text-foreground-muted px-4 py-3">
                          {row.description ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
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
