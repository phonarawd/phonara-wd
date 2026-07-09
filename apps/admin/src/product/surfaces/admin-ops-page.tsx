import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import { useAdminAuditAlerts } from '@/hooks/admin/useAdminAuditAlerts';
import type { AdminAlertRow } from '@/hooks/admin/useAdminAuditAlerts';
import { useAdminOperatorRbac } from '@/hooks/admin/useAdminOperatorRbac';
import {
  useAdminOperations,
  type AdminKillSwitchRow,
  type AdminOpsHealthRow,
  type AdminTradeMarketBreakerRow,
  type OpsHealthCategory,
  type OpsHealthStatus,
  type OpsKillCategory,
} from '@/hooks/admin/useAdminOperations';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { healthStatusClass } from '@/product/surfaces/admin-alert-action-dialog';
import { ADMIN_RBAC_DENIED_KEY, adminRbacActionProps } from '@/product/surfaces/admin-rbac-action';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

const HEALTH_STATUS_KEYS: Record<OpsHealthStatus, MessageKey> = {
  ok: 'admin.operations.health.status.ok',
  warning: 'admin.operations.health.status.warning',
  critical: 'admin.operations.health.status.critical',
};

const HEALTH_CATEGORY_KEYS: Record<OpsHealthCategory, MessageKey> = {
  cron: 'admin.operations.health.category.cron',
  queue: 'admin.operations.health.category.queue',
  budget: 'admin.operations.health.category.budget',
  infra: 'admin.operations.health.category.infra',
};

const KILL_CATEGORY_KEYS: Record<OpsKillCategory, MessageKey> = {
  system: 'admin.operations.kill.category.system',
  wallet: 'admin.operations.kill.category.wallet',
  trading: 'admin.operations.kill.category.trading',
  sports: 'admin.operations.kill.category.sports',
  earn: 'admin.operations.kill.category.earn',
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

function alertStatusKey(status: AdminAlertRow['status']): MessageKey {
  if (status === 'open') return 'ux.status.pending';
  if (status === 'acknowledged') return 'ux.status.reviewing';
  return 'ux.status.settled';
}

function attentionCount(health: AdminOpsHealthRow[], alerts: AdminAlertRow[]): number {
  const healthIssues = health.filter(
    (row) => row.status === 'critical' || row.status === 'warning',
  ).length;
  const openAlerts = alerts.filter(
    (row) => row.status === 'open' || row.status === 'acknowledged',
  ).length;
  return healthIssues + openAlerts;
}

type TradeMarketActionKind = 'halt' | 'resume';

interface TradeMarketActionTarget {
  kind: TradeMarketActionKind;
  row: AdminTradeMarketBreakerRow;
}

interface KillSwitchActionTarget {
  row: AdminKillSwitchRow;
  enabled: boolean;
}

function marketStatusState(isHalted: boolean): MoneyStatusState {
  return isHalted ? 'halted' : 'settled';
}

/** Admin ops desk (`/ops`) — health · kill switches · market halt via `useAdminOperations` (§29.2). */
export function AdminOpsPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const { can } = useAdminOperatorRbac();
  const canKillSwitch = can('operations.kill_switch');
  const rbacDenied = t(ADMIN_RBAC_DENIED_KEY);
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    health,
    filteredHealth,
    healthFilters,
    setHealthFilters,
    refreshHealth,
    healthCategories,
    filteredKillSwitches,
    killFilters,
    setKillFilters,
    killCategories,
    confirmKillSwitch,
    tradeMarkets,
    confirmHaltTradeMarket,
    confirmResumeTradeMarket,
  } = useAdminOperations();

  const { alerts } = useAdminAuditAlerts();

  const [refreshing, setRefreshing] = useState(false);
  const [marketAction, setMarketAction] = useState<TradeMarketActionTarget | null>(null);
  const [marketActionLoading, setMarketActionLoading] = useState(false);
  const [killAction, setKillAction] = useState<KillSwitchActionTarget | null>(null);
  const [killActionLoading, setKillActionLoading] = useState(false);

  const metrics = useMemo(() => {
    const critical = health.filter((row) => row.status === 'critical').length;
    const warning = health.filter((row) => row.status === 'warning').length;
    const openAlerts = alerts.filter(
      (row) => row.status === 'open' || row.status === 'acknowledged',
    ).length;
    return { critical, warning, openAlerts };
  }, [alerts, health]);

  const attention = useMemo(() => attentionCount(health, alerts), [alerts, health]);

  const handleRefresh = () => {
    setRefreshing(true);
    refreshHealth();
    window.setTimeout(() => setRefreshing(false), 600);
  };

  const handleMarketActionSubmit = async (reason: string): Promise<boolean> => {
    if (!marketAction || !canKillSwitch) return false;
    setMarketActionLoading(true);
    try {
      if (marketAction.kind === 'halt') {
        return (await confirmHaltTradeMarket?.(marketAction.row.symbol, reason)) ?? false;
      }
      return (await confirmResumeTradeMarket?.(marketAction.row.symbol, reason)) ?? false;
    } finally {
      setMarketActionLoading(false);
    }
  };

  const handleKillActionSubmit = async (reason: string): Promise<boolean> => {
    if (!killAction || !canKillSwitch || !confirmKillSwitch) return false;
    setKillActionLoading(true);
    try {
      return await confirmKillSwitch(killAction.row.id, killAction.enabled, reason);
    } finally {
      setKillActionLoading(false);
    }
  };

  const haltedMarketCount = useMemo(
    () => tradeMarkets.filter((row) => row.isHalted).length,
    [tradeMarkets],
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.operations')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {attention > 0
              ? t('admin.ops.summary.attention', { count: String(attention) })
              : t('admin.ops.summary.clear')}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.ops.description')}</p>
        </div>
        <Button
          variant="outline"
          size="md"
          loading={refreshing}
          onClick={handleRefresh}
          className="shrink-0"
        >
          <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />
          {t('admin.operations.health.refresh')}
        </Button>
      </section>

      <HowItWorks
        persistenceId="admin-ops"
        titleKey="admin.help.operations.title"
        stepKeys={[
          'admin.help.operations.step1',
          'admin.help.operations.step2',
          'admin.help.operations.step3',
        ]}
      />

      <section aria-labelledby="admin-ops-metrics-heading">
        <h3 id="admin-ops-metrics-heading" className="sr-only">
          {t('admin.nav.operations')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label={t('admin.operations.health.status.critical')}
            value={String(metrics.critical)}
            emphasis={metrics.critical > 0}
          />
          <MetricCard
            label={t('admin.operations.health.status.warning')}
            value={String(metrics.warning)}
            emphasis={metrics.warning > 0}
          />
          <MetricCard
            label={t('admin.alerts.section.open')}
            value={String(metrics.openAlerts)}
            emphasis={metrics.openAlerts > 0}
          />
        </div>
      </section>

      <section aria-labelledby="admin-ops-health-heading" className="space-y-3">
        <div>
          <h3 id="admin-ops-health-heading" className="text-foreground m-0 text-lg font-semibold">
            {t('admin.operations.section.health')}
          </h3>
          <p className="text-foreground-muted m-0 text-sm">
            {t('admin.operations.health.subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            value={healthFilters.search}
            onChange={(event) =>
              setHealthFilters((prev) => ({ ...prev, search: event.target.value }))
            }
            placeholder={t('admin.operations.health.search.placeholder')}
            aria-label={t('admin.operations.health.search.placeholder')}
            className="max-w-md"
          />
          <FilterSelect
            label={t('admin.operations.health.col.status')}
            value={healthFilters.status}
            onChange={(value) =>
              setHealthFilters((prev) => ({
                ...prev,
                status: value as OpsHealthStatus | 'all',
              }))
            }
            options={[
              { value: 'all', label: t('admin.operations.health.status.all') },
              { value: 'ok', label: t('admin.operations.health.status.ok') },
              { value: 'warning', label: t('admin.operations.health.status.warning') },
              { value: 'critical', label: t('admin.operations.health.status.critical') },
            ]}
          />
          <FilterSelect
            label={t('admin.operations.health.col.category')}
            value={healthFilters.category}
            onChange={(value) =>
              setHealthFilters((prev) => ({
                ...prev,
                category: value as OpsHealthCategory | 'all',
              }))
            }
            options={[
              { value: 'all', label: t('admin.operations.health.category.all') },
              ...healthCategories.map((category) => ({
                value: category,
                label: t(HEALTH_CATEGORY_KEYS[category]),
              })),
            ]}
          />
        </div>

        {filteredHealth.length === 0 ? (
          <EmptyState
            title={t('admin.overview.empty.title')}
            description={t('admin.ops.empty.health')}
            actionLabel={t('admin.overview.action.refresh')}
            onAction={handleRefresh}
          />
        ) : (
          <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead className="bg-surface-raised text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    {t('admin.operations.health.col.checkKey')}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t('admin.operations.health.col.category')}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t('admin.operations.health.col.status')}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t('admin.operations.health.col.summary')}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t('admin.operations.health.col.lastRun')}
                  </th>
                  <th className="px-4 py-3 font-medium">{t('admin.operations.health.col.lag')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHealth.map((row) => (
                  <tr key={row.id} className="border-line border-t">
                    <td className="text-foreground px-4 py-3 font-mono text-xs">{row.checkKey}</td>
                    <td className="text-foreground-muted px-4 py-3">
                      {t(HEALTH_CATEGORY_KEYS[row.category])}
                    </td>
                    <td className="px-4 py-3">
                      <span className={healthStatusClass(row.status)}>
                        {t(HEALTH_STATUS_KEYS[row.status])}
                      </span>
                    </td>
                    <td className="text-foreground px-4 py-3">{row.summary}</td>
                    <td className="text-foreground-muted px-4 py-3 tabular-nums">
                      {formatWhen(row.lastRunAt, locale)}
                    </td>
                    <td className="text-foreground-muted px-4 py-3 tabular-nums">
                      {row.lagSeconds ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="admin-ops-kill-heading" className="space-y-3">
        <div>
          <h3 id="admin-ops-kill-heading" className="text-foreground m-0 text-lg font-semibold">
            {t('admin.operations.kill.title')}
          </h3>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.operations.kill.subtitle')}</p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.operations.kill.desc')}</p>
          {!canKillSwitch ? (
            <p
              className="text-foreground-muted m-0 text-sm"
              data-testid="admin-ops-kill-rbac-denied"
            >
              {rbacDenied}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            value={killFilters.search}
            onChange={(event) =>
              setKillFilters((prev) => ({ ...prev, search: event.target.value }))
            }
            placeholder={t('admin.operations.kill.search.placeholder')}
            aria-label={t('admin.operations.kill.search.placeholder')}
            className="max-w-md"
          />
          <FilterSelect
            label={t('admin.operations.kill.col.category')}
            value={killFilters.category}
            onChange={(value) =>
              setKillFilters((prev) => ({
                ...prev,
                category: value as OpsKillCategory | 'all',
              }))
            }
            options={[
              { value: 'all', label: t('admin.operations.kill.category.all') },
              ...killCategories.map((category) => ({
                value: category,
                label: t(KILL_CATEGORY_KEYS[category]),
              })),
            ]}
          />
        </div>

        {filteredKillSwitches.length === 0 ? (
          <EmptyState
            title={t('admin.operations.kill.empty')}
            description={t('admin.operations.kill.desc')}
            actionLabel={t('admin.operations.health.refresh')}
            onAction={handleRefresh}
          />
        ) : (
          <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead className="bg-surface-raised text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('admin.operations.kill.col.label')}</th>
                  <th className="px-4 py-3 font-medium">
                    {t('admin.operations.kill.col.category')}
                  </th>
                  <th className="px-4 py-3 font-medium">{t('admin.operations.kill.col.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.operations.kill.col.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredKillSwitches.map((row) => (
                  <tr
                    key={row.id}
                    className="border-line border-t"
                    data-testid={`admin-kill-${row.id}`}
                  >
                    <td className="text-foreground px-4 py-3">
                      <p className="m-0 font-medium">{t(row.labelKey as MessageKey)}</p>
                      <p className="text-foreground-muted m-0 font-mono text-xs">{row.switchKey}</p>
                    </td>
                    <td className="text-foreground-muted px-4 py-3">
                      {t(KILL_CATEGORY_KEYS[row.category])}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        state={row.enabled ? 'settled' : 'halted'}
                        label={
                          row.enabled
                            ? t('admin.operations.kill.status.on')
                            : t('admin.operations.kill.status.off')
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={row.enabled ? 'outline' : 'primary'}
                        {...adminRbacActionProps(canKillSwitch, rbacDenied)}
                        onClick={() => {
                          if (!canKillSwitch) return;
                          setKillAction({ row, enabled: !row.enabled });
                        }}
                      >
                        {row.enabled
                          ? t('admin.operations.kill.action.disable')
                          : t('admin.operations.kill.action.enable')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="admin-ops-markets-heading" className="space-y-3">
        <div>
          <h3 id="admin-ops-markets-heading" className="text-foreground m-0 text-lg font-semibold">
            {t('admin.ops.markets.title')}
          </h3>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.ops.markets.subtitle')}</p>
          {!canKillSwitch ? (
            <p className="text-foreground-muted m-0 text-sm">{rbacDenied}</p>
          ) : null}
        </div>

        {tradeMarkets.length === 0 ? (
          <EmptyState
            title={t('admin.ops.markets.empty')}
            description={t('admin.ops.markets.emptyDesc')}
            actionLabel={t('admin.operations.health.refresh')}
            onAction={handleRefresh}
          />
        ) : (
          <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead className="bg-surface-raised text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('admin.ops.markets.col.symbol')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.ops.markets.col.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.ops.markets.col.oracle')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.ops.markets.col.reason')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.ops.markets.col.haltedAt')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.ops.markets.col.action')}</th>
                </tr>
              </thead>
              <tbody>
                {tradeMarkets.map((row) => (
                  <tr key={row.symbol} className="border-line border-t">
                    <td className="text-foreground px-4 py-3 font-mono text-xs">{row.symbol}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        state={marketStatusState(row.isHalted)}
                        label={
                          row.isHalted
                            ? t('admin.ops.markets.status.halted')
                            : t('admin.ops.markets.status.active')
                        }
                      />
                    </td>
                    <td className="text-foreground-muted px-4 py-3 tabular-nums">
                      {row.oraclePrice ?? '—'}
                    </td>
                    <td className="text-foreground-muted px-4 py-3">{row.haltReason ?? '—'}</td>
                    <td className="text-foreground-muted px-4 py-3 tabular-nums">
                      {formatWhen(row.haltedAt, locale)}
                    </td>
                    <td className="px-4 py-3">
                      {row.isHalted ? (
                        <Button
                          size="sm"
                          variant="primary"
                          {...adminRbacActionProps(canKillSwitch, rbacDenied)}
                          onClick={() => {
                            if (!canKillSwitch) return;
                            setMarketAction({ kind: 'resume', row });
                          }}
                        >
                          {t('admin.ops.markets.action.resume')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          {...adminRbacActionProps(canKillSwitch, rbacDenied)}
                          onClick={() => {
                            if (!canKillSwitch) return;
                            setMarketAction({ kind: 'halt', row });
                          }}
                        >
                          {t('admin.ops.markets.action.halt')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {haltedMarketCount > 0 ? (
          <p className="text-foreground-muted m-0 text-sm">
            {t('admin.ops.markets.haltedCount', { count: String(haltedMarketCount) })}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="admin-ops-alerts-heading" className="space-y-3">
        <div>
          <h3 id="admin-ops-alerts-heading" className="text-foreground m-0 text-lg font-semibold">
            {t('admin.alerts.section.open')}
          </h3>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.alerts.description')}</p>
        </div>

        {alerts.length === 0 ? (
          <EmptyState
            title={t('admin.alerts.empty')}
            description={t('admin.overview.empty.description')}
            actionLabel={t('admin.ops.empty.cta')}
            onAction={() => {
              goTo('/');
            }}
          />
        ) : (
          <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-surface-raised text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('admin.alerts.col.summary')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.alerts.col.severity')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.alerts.col.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.alerts.col.occurrences')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.alerts.col.lastSeen')}</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="border-line border-t">
                    <td className="text-foreground px-4 py-3">{alert.summary}</td>
                    <td className="px-4 py-3">
                      <span
                        className={healthStatusClass(
                          alert.severity === 'critical' ? 'critical' : 'warning',
                        )}
                      >
                        {t(
                          alert.severity === 'critical'
                            ? 'admin.alerts.severity.critical'
                            : 'admin.alerts.severity.warning',
                        )}
                      </span>
                    </td>
                    <td className="text-foreground-muted px-4 py-3">
                      {t(alertStatusKey(alert.status))}
                    </td>
                    <td className="text-foreground-muted px-4 py-3 tabular-nums">
                      {String(alert.occurrenceCount)}
                    </td>
                    <td className="text-foreground-muted px-4 py-3 tabular-nums">
                      {formatWhen(alert.lastSeenAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminQueueActionDialog
        open={marketAction !== null}
        onOpenChange={(open) => {
          if (!open) setMarketAction(null);
        }}
        titleKey={
          marketAction?.kind === 'resume'
            ? 'admin.ops.markets.dialog.resume'
            : 'admin.ops.markets.dialog.halt'
        }
        confirmKey={
          marketAction?.kind === 'resume'
            ? 'admin.ops.markets.action.resume'
            : 'admin.ops.markets.action.halt'
        }
        summary={
          marketAction ? (
            <p className="text-foreground m-0 text-sm font-mono">{marketAction.row.symbol}</p>
          ) : null
        }
        loading={marketActionLoading}
        destructive={marketAction?.kind === 'halt'}
        onSubmit={handleMarketActionSubmit}
      />

      <AdminQueueActionDialog
        open={killAction !== null}
        onOpenChange={(open) => {
          if (!open) setKillAction(null);
        }}
        titleKey={
          killAction?.enabled
            ? 'admin.operations.kill.dialog.enable.title'
            : 'admin.operations.kill.dialog.disable.title'
        }
        confirmKey={
          killAction?.enabled
            ? 'admin.operations.kill.action.enable'
            : 'admin.operations.kill.action.disable'
        }
        summary={
          killAction ? (
            <p className="text-foreground m-0 text-sm font-mono">{killAction.row.switchKey}</p>
          ) : null
        }
        loading={killActionLoading}
        destructive={killAction?.enabled === false}
        onSubmit={handleKillActionSubmit}
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
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="tabular-nums text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-foreground-muted text-xs font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-line bg-surface text-foreground rounded-(--ds-radius-md) border px-3 py-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
