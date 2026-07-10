import { useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import { useAdminSettingsDesk } from '@/hooks/admin/useAdminSettingsDesk';
import type { AdminSettingsRow } from '@/product/bridge/parse-admin-settings-config';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';

function booleanStatus(value: string): MoneyStatusState {
  return value === 'on' ? 'settled' : 'halted';
}

function formatValue(row: AdminSettingsRow, t: ReturnType<typeof useT>): string {
  if (row.kind === 'boolean') {
    return row.displayValue === 'on'
      ? t('admin.operations.toggle.on')
      : t('admin.operations.toggle.off');
  }
  return row.value;
}

function rowLabel(row: AdminSettingsRow, t: ReturnType<typeof useT>): string {
  if (row.labelKey === 'admin.settings.key.fallback') {
    return row.key;
  }
  return t(row.labelKey as MessageKey);
}

/** Admin settings desk (`/settings`) — `app_config` read via `useAppConfig` (§29.2 R0). */
export function AdminSettingsPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const { sections, entryCount, search, setSearch, isLoading, isError, isFetching, refresh } =
    useAdminSettingsDesk();
  const [refreshing, setRefreshing] = useState(false);

  const defaultTab = sections[0]?.id ?? 'system';

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
            {t('admin.nav.settings')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {isLoading
              ? t('admin.settings.summary.loading')
              : t('admin.settings.summary.entries', { count: String(entryCount) })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.settings.description')}</p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.settings.readOnly')}</p>
        </div>
        <Button
          variant="outline"
          size="md"
          loading={refreshing || isFetching}
          onClick={() => void handleRefresh()}
          className="shrink-0"
        >
          <RefreshCw
            className={cn('size-4', (refreshing || isFetching) && 'animate-spin')}
            aria-hidden
          />
          {t('admin.overview.action.refresh')}
        </Button>
      </section>

      <HowItWorks
        persistenceId="admin-settings"
        titleKey="admin.help.settings.title"
        stepKeys={[
          'admin.help.settings.step1',
          'admin.help.settings.step2',
          'admin.help.settings.step3',
        ]}
      />

      {isError ? (
        <EmptyState
          title={t('admin.settings.error.title')}
          description={t('admin.settings.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : isLoading ? (
        <AdminTable
          columns={[
            { id: 'setting', header: t('admin.settings.col.setting') },
            { id: 'value', header: t('admin.settings.col.value') },
          ]}
          rows={[]}
          loading
          loadingRowCount={6}
          minWidth={640}
        />
      ) : entryCount === 0 ? (
        <EmptyState
          title={t('admin.settings.empty.title')}
          description={t('admin.settings.empty.body')}
          actionLabel={t('admin.settings.empty.cta')}
          onAction={() => {
            goTo('/ops');
          }}
        />
      ) : (
        <>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('admin.settings.search.placeholder')}
            aria-label={t('admin.settings.search.placeholder')}
            className="max-w-md"
          />

          {sections.length === 0 ? (
            <EmptyState
              title={t('admin.settings.empty.filtered')}
              description={t('admin.settings.empty.filteredBody')}
              actionLabel={t('admin.audit.clearFilters')}
              onAction={() => setSearch('')}
            />
          ) : (
            <Tabs defaultValue={defaultTab} className="gap-4">
              <TabsList aria-label={t('admin.settings.tabs.aria')}>
                {sections.map((section) => (
                  <TabsTrigger key={section.id} value={section.id}>
                    {t(section.titleKey)} ({section.rows.length})
                  </TabsTrigger>
                ))}
              </TabsList>

              {sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="space-y-3">
                  <p className="text-foreground-muted m-0 text-sm">{t(section.descKey)}</p>
                  <AdminTable
                    columns={[
                      {
                        id: 'setting',
                        header: t('admin.settings.col.setting'),
                        cell: ({ row }) => rowLabel(row, t),
                      },
                      {
                        id: 'value',
                        header: t('admin.settings.col.value'),
                        cell: ({ row }) =>
                          row.kind === 'boolean' ? (
                            <StatusBadge
                              state={booleanStatus(row.displayValue)}
                              label={formatValue(row, t)}
                            />
                          ) : (
                            <span className="text-foreground tabular-nums">
                              {formatValue(row, t)}
                            </span>
                          ),
                      },
                    ]}
                    rows={section.rows}
                    getRowId={(row) => row.key}
                    minWidth={640}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
