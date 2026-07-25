import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { resolveOpsAlert } from '@/domain/ops';
import { useAdminAuditAlerts } from '@/hooks/admin/useAdminAuditAlerts';
import type { AdminAlertRow } from '@/hooks/admin/useAdminAuditAlerts';
import { useAdminOverview } from '@/hooks/admin/useAdminOverview';
import type { HealthStatus } from '@/hooks/admin/useAdminOverview';
import {
  healthCheckDescKey,
  healthCheckLabelKey,
  queueTypeLabelKey,
} from '@/product/bridge/ops-health-labels';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';
import {
  AdminAlertActionDialog,
  healthStatusClass,
  type AdminAlertActionMode,
} from '@/product/surfaces/admin-alert-action-dialog';

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

function overallStatusKey(
  status: HealthStatus,
): 'admin.overview.status.ok' | 'admin.overview.status.warning' | 'admin.overview.status.critical' {
  if (status === 'critical') return 'admin.overview.status.critical';
  if (status === 'warning') return 'admin.overview.status.warning';
  return 'admin.overview.status.ok';
}

function openAlerts(alerts: AdminAlertRow[]): AdminAlertRow[] {
  return alerts.filter((row) => row.status === 'open' || row.status === 'acknowledged');
}

/** Admin landing (`/`) — today summary via `useAdminOverview` + alert ack/resolve (section 29). */
export function AdminHomePage() {
  const t = useT();
  const healthSectionRef = useRef<HTMLDivElement>(null);
  const { dashboard, health, isLoading, isFetching, unresolvedAlerts, refreshAll, error } =
    useAdminOverview();
  const { alerts, confirmAckAlert } = useAdminAuditAlerts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<AdminAlertActionMode>('ack');
  const [selectedAlert, setSelectedAlert] = useState<AdminAlertRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const pendingCount = useMemo(() => {
    const queueTotal = (dashboard?.exceptionQueues ?? []).reduce(
      (sum, row) => sum + row.openCount,
      0,
    );
    return queueTotal + unresolvedAlerts;
  }, [dashboard?.exceptionQueues, unresolvedAlerts]);

  const activeAlerts = useMemo(() => openAlerts(alerts), [alerts]);
  const healthChecks = dashboard?.healthChecks ?? health?.checks ?? [];
  const overallStatus = dashboard?.overallStatus ?? health?.status ?? 'warning';
  const lastUpdated = dashboard?.fetchedAt ?? health?.lastUpdatedAt;

  const openDialog = (mode: AdminAlertActionMode, alert: AdminAlertRow) => {
    setDialogMode(mode);
    setSelectedAlert(alert);
    setDialogOpen(true);
  };

  const handleAlertSubmit = async (reason: string): Promise<boolean> => {
    if (!selectedAlert) return false;
    setActionLoading(true);
    try {
      if (dialogMode === 'ack') {
        if (!confirmAckAlert) return false;
        return await confirmAckAlert(selectedAlert.id, reason);
      }
      await resolveOpsAlert({ alertId: selectedAlert.id, reason: reason.trim() });
      await refreshAll();
      return true;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const scrollToHealth = () => {
    healthSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col gap-ds-8" data-testid="overview-page">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.today.title')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {pendingCount > 0
              ? t('admin.today.summary', { count: String(pendingCount) })
              : t('admin.today.summaryClear')}
          </p>
          <span className={healthStatusClass(overallStatus)}>
            {t(overallStatusKey(overallStatus))}
          </span>
        </div>
        <Button
          variant="outline"
          size="md"
          loading={isFetching}
          onClick={() => void refreshAll()}
          className="shrink-0"
        >
          <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} aria-hidden />
          {t('admin.overview.action.refresh')}
        </Button>
      </section>

      <HowItWorks
        persistenceId="admin-home"
        stepKeys={[
          'admin.help.overview.step1',
          'admin.help.overview.step2',
          'admin.help.overview.step3',
        ]}
        titleKey="admin.help.overview.title"
      />

      {error ? (
        <Card className="border-danger/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="text-danger size-4" aria-hidden />
              {t('admin.overview.healthUnavailable.title')}
            </CardTitle>
            <CardDescription>{t('admin.overview.healthUnavailable.description')}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section aria-labelledby="admin-pending-heading">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h3 id="admin-pending-heading" className="text-foreground m-0 text-lg font-semibold">
              {t('admin.overview.section.pending')}
            </h3>
            <p className="text-foreground-muted m-0 text-sm">
              {t('admin.overview.section.pendingHint')}
            </p>
          </div>
        </div>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-(--ds-radius-lg)" />
            ))}
          </div>
        ) : (dashboard?.exceptionQueues ?? []).length === 0 && unresolvedAlerts === 0 ? (
          <EmptyState
            title={t('admin.overview.empty.title')}
            description={t('admin.overview.empty.description')}
            actionLabel={t('admin.overview.empty.cta')}
            onAction={scrollToHealth}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(dashboard?.exceptionQueues ?? []).map((row) => (
              <Card key={row.queueType}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t(queueTypeLabelKey(row.queueType))}</CardTitle>
                  <CardDescription>
                    {t('admin.overview.metric.open', { count: String(row.openCount) })}
                    {row.overdueCount > 0
                      ? ` · ${t('admin.overview.metric.overdue', { count: String(row.overdueCount) })}`
                      : ''}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
            {unresolvedAlerts > 0 ? (
              <Card className="border-warning/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('admin.overview.section.alerts')}</CardTitle>
                  <CardDescription>
                    {t('admin.overview.alertsBanner.description', {
                      count: String(unresolvedAlerts),
                    })}
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}
          </div>
        )}
      </section>

      <section aria-labelledby="admin-alerts-heading">
        <div className="mb-3">
          <h3 id="admin-alerts-heading" className="text-foreground m-0 text-lg font-semibold">
            {t('admin.overview.section.alerts')}
          </h3>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.alerts.description')}</p>
        </div>
        <AdminTable
          columns={[
            {
              id: 'summary',
              header: t('admin.alerts.col.summary'),
              cell: ({ row }) => row.summary,
            },
            {
              id: 'severity',
              header: t('admin.alerts.col.severity'),
              cell: ({ row }) => (
                <span
                  className={healthStatusClass(
                    row.severity === 'critical' ? 'critical' : 'warning',
                  )}
                >
                  {t(
                    row.severity === 'critical'
                      ? 'admin.alerts.severity.critical'
                      : 'admin.alerts.severity.warning',
                  )}
                </span>
              ),
            },
            {
              id: 'status',
              header: t('admin.alerts.col.status'),
              cell: ({ row }) =>
                row.status === 'open' ? t('ux.status.pending') : t('ux.status.reviewing'),
              meta: { className: 'text-foreground-muted' },
            },
            {
              id: 'lastSeen',
              header: t('admin.alerts.col.lastSeen'),
              cell: ({ row }) => formatWhen(row.lastSeenAt, locale),
              meta: { className: 'text-foreground-muted tabular-nums' },
            },
          ]}
          rows={activeAlerts}
          getRowId={(row) => row.id}
          loading={isLoading}
          loadingRowCount={4}
          minWidth={640}
          empty={
            <EmptyState
              title={t('admin.alerts.empty')}
              description={t('admin.overview.empty.description')}
              actionLabel={t('admin.overview.empty.cta')}
              onAction={scrollToHealth}
            />
          }
          rowActionsHeader={t('admin.alerts.col.action')}
          rowActions={(alert) => (
            <>
              {alert.status === 'open' ? (
                <Button variant="outline" size="sm" onClick={() => openDialog('ack', alert)}>
                  {t('admin.overview.action.alertAck')}
                </Button>
              ) : null}
              <Button variant="primary" size="sm" onClick={() => openDialog('resolve', alert)}>
                {t('admin.overview.action.alertResolve')}
              </Button>
            </>
          )}
        />
      </section>

      <section ref={healthSectionRef} aria-labelledby="admin-health-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 id="admin-health-heading" className="text-foreground m-0 text-lg font-semibold">
              {t('admin.overview.section.health')}
            </h3>
            <p className="text-foreground-muted m-0 text-sm">{t('admin.overview.description')}</p>
          </div>
          {lastUpdated ? (
            <p className="text-foreground-muted m-0 text-xs tabular-nums">
              {t('admin.overview.lastUpdated')}: {formatWhen(lastUpdated, locale)}
            </p>
          ) : null}
        </div>
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-(--ds-radius-lg)" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {healthChecks.map((check) => (
              <Card key={check.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{t(healthCheckLabelKey(check.id))}</CardTitle>
                    <span className={healthStatusClass(check.status)}>
                      {t(overallStatusKey(check.status))}
                    </span>
                  </div>
                  <CardDescription>{t(healthCheckDescKey(check.id))}</CardDescription>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-foreground m-0 text-sm">{check.summary}</p>
                  <p className="text-foreground-muted m-0 mt-2 text-xs tabular-nums">
                    {t('admin.overview.observedAt')}: {formatWhen(check.observedAt, locale)}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <AdminAlertActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        alert={selectedAlert}
        loading={actionLoading}
        onSubmit={handleAlertSubmit}
      />
    </div>
  );
}
