import { useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  useAdminCompliance,
  type AdminRiskRgRow,
  type AdminStrRow,
  type RiskFlagType,
  type StrCaseType,
  type StrStatus,
} from '@/hooks/admin/useAdminCompliance';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
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

type RiskActionKind = 'clearRisk' | 'reviewStr' | 'fileStr' | 'dismissStr';

interface RiskActionTarget {
  kind: RiskActionKind;
  id: string;
  titleKey: MessageKey;
  confirmKey: MessageKey;
  destructive?: boolean;
  summary: string;
}

const RISK_FLAG_KEYS: Record<RiskFlagType, MessageKey> = {
  rg_self_exclusion: 'admin.compliance.risk.flagType.rg_self_exclusion',
  rg_cooldown: 'admin.compliance.risk.flagType.rg_cooldown',
  rg_deposit_limit: 'admin.compliance.risk.flagType.rg_deposit_limit',
  fraud_pattern: 'admin.compliance.risk.flagType.fraud_pattern',
  vpn_proxy: 'admin.compliance.risk.flagType.vpn_proxy',
};

const STR_CASE_KEYS: Record<StrCaseType, MessageKey> = {
  structuring: 'admin.compliance.str.filter.caseType.structuring',
  rapid_movement: 'admin.compliance.str.filter.caseType.rapid_movement',
  high_risk_geo: 'admin.compliance.str.filter.caseType.high_risk_geo',
  chip_dumping: 'admin.compliance.str.filter.caseType.chip_dumping',
};

const STR_STATUS_KEYS: Record<StrStatus, MessageKey> = {
  open: 'admin.compliance.str.filter.status.open',
  reviewing: 'admin.compliance.str.filter.status.reviewing',
  filed: 'admin.compliance.str.filter.status.filed',
  dismissed: 'admin.compliance.str.filter.status.dismissed',
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

function strStatusState(status: AdminStrRow['status']): MoneyStatusState {
  if (status === 'reviewing') return 'reviewing';
  if (status === 'filed' || status === 'dismissed') return 'settled';
  return 'pending';
}

function toggleFilter<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function formatRiskSummary(row: AdminRiskRgRow, t: ReturnType<typeof useT>): string {
  return `${row.userId} · ${t(RISK_FLAG_KEYS[row.flagType])} · ${row.detailsSummary}`;
}

function formatStrSummary(row: AdminStrRow, t: ReturnType<typeof useT>): string {
  return `${row.userId} · ${t(STR_CASE_KEYS[row.caseType])} · ${row.detailsSummary}`;
}

/** Admin risk & compliance desk (`/risk`) — flags · STR status (§29.2). */
export function AdminRiskPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const qc = useQueryClient();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    kyc,
    str,
    risk,
    filteredRisk,
    filteredStr,
    riskFilters,
    setRiskFilters,
    strFilters,
    setStrFilters,
    audit,
    clearRiskFlag,
    flagStr,
    fileStr,
    dismissStr,
  } = useAdminCompliance();

  const [refreshing, setRefreshing] = useState(false);
  const [actionTarget, setActionTarget] = useState<RiskActionTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const openKycCount = useMemo(
    () => kyc.filter((row) => row.status === 'pending' || row.status === 'in_review').length,
    [kyc],
  );
  const openStrCount = useMemo(
    () => str.filter((row) => row.status === 'open' || row.status === 'reviewing').length,
    [str],
  );
  const activeRiskCount = useMemo(
    () => risk.filter((row) => row.status === 'active').length,
    [risk],
  );

  const hasWork = openKycCount + openStrCount + activeRiskCount > 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await qc.invalidateQueries({ queryKey: ['admin-compliance-queues'] });
    } finally {
      setRefreshing(false);
    }
  };

  const handleActionSubmit = async (reason: string): Promise<boolean> => {
    if (!actionTarget) return false;
    setActionLoading(true);
    try {
      if (actionTarget.kind === 'clearRisk') return clearRiskFlag(actionTarget.id, reason);
      if (actionTarget.kind === 'reviewStr') return flagStr(actionTarget.id, reason);
      if (actionTarget.kind === 'fileStr') return fileStr(actionTarget.id, reason);
      if (actionTarget.kind === 'dismissStr') return dismissStr(actionTarget.id, reason);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-ds-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.risk')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t('admin.risk.summary.open', {
              risk: String(activeRiskCount),
              str: String(openStrCount),
              kyc: String(openKycCount),
            })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.risk.description')}</p>
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
        persistenceId="admin-risk"
        titleKey="admin.help.risk.title"
        stepKeys={['admin.help.risk.step1', 'admin.help.risk.step2', 'admin.help.risk.step3']}
      />

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('admin.compliance.detail.title')}</CardTitle>
          <CardDescription>{t('admin.risk.deferred.sanctions')}</CardDescription>
        </CardHeader>
      </Card>

      {!hasWork ? (
        <EmptyState
          title={t('admin.risk.empty.title')}
          description={t('admin.risk.empty.desc')}
          actionLabel={t('admin.risk.empty.cta')}
          onAction={() => {
            goTo('/queues');
          }}
        />
      ) : (
        <>
          <section
            aria-labelledby="admin-risk-metrics-heading"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <h3 id="admin-risk-metrics-heading" className="sr-only">
              {t('admin.nav.risk')}
            </h3>
            <MetricCard
              label={t('admin.risk.metric.flags')}
              value={String(activeRiskCount)}
              emphasis={activeRiskCount > 0}
            />
            <MetricCard
              label={t('admin.risk.metric.str')}
              value={String(openStrCount)}
              emphasis={openStrCount > 0}
            />
            <MetricCard label={t('admin.risk.metric.kyc')} value={String(openKycCount)} />
          </section>

          <Tabs defaultValue="flags">
            <TabsList aria-label={t('admin.risk.tabs.aria')}>
              <TabsTrigger value="flags">
                {t('admin.risk.tab.flags')} ({activeRiskCount})
              </TabsTrigger>
              <TabsTrigger value="str">
                {t('admin.risk.tab.str')} ({openStrCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="flags"
              forceMount
              className="space-y-4 data-[state=inactive]:hidden"
            >
              <div className="flex flex-col gap-3">
                <Input
                  value={riskFilters.search}
                  onChange={(event) =>
                    setRiskFilters((prev) => ({ ...prev, search: event.target.value }))
                  }
                  placeholder={t('admin.compliance.rg.filter.search.placeholder')}
                  aria-label={t('admin.compliance.rg.filter.search.placeholder')}
                  className="max-w-md"
                />
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(RISK_FLAG_KEYS) as RiskFlagType[]).map((flagType) => (
                    <Button
                      key={flagType}
                      size="sm"
                      variant={riskFilters.flagType.includes(flagType) ? 'primary' : 'outline'}
                      onClick={() =>
                        setRiskFilters((prev) => ({
                          ...prev,
                          flagType: toggleFilter(prev.flagType, flagType),
                        }))
                      }
                    >
                      {t(RISK_FLAG_KEYS[flagType])}
                    </Button>
                  ))}
                </div>
              </div>

              {filteredRisk.length === 0 ? (
                <EmptyState
                  title={t('admin.compliance.rg.empty')}
                  description={t('admin.risk.empty.desc')}
                  actionLabel={t('admin.risk.empty.clearFilters')}
                  onAction={() => setRiskFilters({ search: '', status: [], flagType: [] })}
                />
              ) : (
                <AdminTable
                  columns={[
                    {
                      id: 'user',
                      header: t('admin.compliance.rg.col.user'),
                      cell: ({ row }) => row.userId,
                      meta: { className: 'text-foreground-muted' },
                    },
                    {
                      id: 'flagType',
                      header: t('admin.compliance.rg.col.flagType'),
                      cell: ({ row }) => t(RISK_FLAG_KEYS[row.flagType]),
                    },
                    {
                      id: 'details',
                      header: t('admin.compliance.rg.col.details'),
                      cell: ({ row }) => row.detailsSummary,
                      meta: { className: 'text-foreground-muted' },
                    },
                    {
                      id: 'created',
                      header: t('admin.compliance.rg.col.created'),
                      cell: ({ row }) => formatWhen(row.createdAt, locale),
                      meta: { className: 'text-foreground-muted tabular-nums' },
                    },
                  ]}
                  rows={filteredRisk}
                  getRowId={(row) => row.id}
                  minWidth={880}
                  rowActionsHeader={t('admin.compliance.rg.col.action')}
                  rowActions={(row) => (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        setActionTarget({
                          kind: 'clearRisk',
                          id: row.id,
                          titleKey: 'admin.queues.dialog.clearRisk',
                          confirmKey: 'admin.queues.action.clear',
                          destructive: true,
                          summary: formatRiskSummary(row, t),
                        })
                      }
                    >
                      {t('admin.queues.action.clear')}
                    </Button>
                  )}
                />
              )}
            </TabsContent>

            <TabsContent value="str" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <div className="flex flex-col gap-3">
                <Input
                  value={strFilters.search}
                  onChange={(event) =>
                    setStrFilters((prev) => ({ ...prev, search: event.target.value }))
                  }
                  placeholder={t('admin.compliance.str.filter.search.placeholder')}
                  aria-label={t('admin.compliance.str.filter.search.placeholder')}
                  className="max-w-md"
                />
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STR_STATUS_KEYS) as StrStatus[]).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={strFilters.status.includes(status) ? 'primary' : 'outline'}
                      onClick={() =>
                        setStrFilters((prev) => ({
                          ...prev,
                          status: toggleFilter(prev.status, status),
                        }))
                      }
                    >
                      {t(STR_STATUS_KEYS[status])}
                    </Button>
                  ))}
                </div>
              </div>

              {filteredStr.length === 0 ? (
                <EmptyState
                  title={t('admin.compliance.str.empty')}
                  description={t('admin.risk.empty.desc')}
                  actionLabel={t('admin.risk.empty.clearFilters')}
                  onAction={() => setStrFilters({ search: '', status: [], caseType: [] })}
                />
              ) : (
                <AdminTable
                  columns={[
                    {
                      id: 'user',
                      header: t('admin.compliance.str.col.user'),
                      cell: ({ row }) => row.userId,
                      meta: { className: 'text-foreground-muted' },
                    },
                    {
                      id: 'caseType',
                      header: t('admin.compliance.str.col.caseType'),
                      cell: ({ row }) => t(STR_CASE_KEYS[row.caseType]),
                    },
                    {
                      id: 'details',
                      header: t('admin.compliance.str.col.details'),
                      cell: ({ row }) => row.detailsSummary,
                      meta: { className: 'text-foreground-muted' },
                    },
                    {
                      id: 'status',
                      header: t('admin.compliance.str.col.status'),
                      cell: ({ row }) => (
                        <StatusBadge
                          state={strStatusState(row.status)}
                          label={t(STR_STATUS_KEYS[row.status])}
                        />
                      ),
                    },
                  ]}
                  rows={filteredStr}
                  getRowId={(row) => row.id}
                  minWidth={960}
                  rowActionsHeader={t('admin.compliance.str.col.action')}
                  rowActions={(row) => (
                    <>
                      {row.status === 'open' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setActionTarget({
                              kind: 'reviewStr',
                              id: row.id,
                              titleKey: 'admin.queues.dialog.reviewStr',
                              confirmKey: 'admin.queues.action.review',
                              summary: formatStrSummary(row, t),
                            })
                          }
                        >
                          {t('admin.queues.action.review')}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          setActionTarget({
                            kind: 'fileStr',
                            id: row.id,
                            titleKey: 'admin.queues.dialog.fileStr',
                            confirmKey: 'admin.queues.action.file',
                            summary: formatStrSummary(row, t),
                          })
                        }
                      >
                        {t('admin.queues.action.file')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setActionTarget({
                            kind: 'dismissStr',
                            id: row.id,
                            titleKey: 'admin.queues.dialog.dismissStr',
                            confirmKey: 'admin.queues.action.dismiss',
                            destructive: true,
                            summary: formatStrSummary(row, t),
                          })
                        }
                      >
                        {t('admin.queues.action.dismiss')}
                      </Button>
                    </>
                  )}
                />
              )}
            </TabsContent>
          </Tabs>

          {audit.length > 0 ? (
            <section className="space-y-3" aria-labelledby="admin-risk-audit-heading">
              <h3
                id="admin-risk-audit-heading"
                className="text-foreground m-0 text-base font-semibold"
              >
                {t('admin.compliance.kyc.audit.title')}
              </h3>
              <AdminTable
                columns={[
                  {
                    id: 'time',
                    header: t('admin.audit.col.time'),
                    cell: ({ row }) => formatWhen(row.at, locale),
                    meta: { className: 'text-foreground-muted tabular-nums' },
                  },
                  {
                    id: 'action',
                    header: t('admin.audit.col.action'),
                    cell: ({ row }) => t(row.actionKey as MessageKey),
                  },
                  {
                    id: 'reason',
                    header: t('admin.audit.col.reason'),
                    cell: ({ row }) => row.reason || '—',
                    meta: { className: 'text-foreground-muted' },
                  },
                ]}
                rows={audit.slice(0, 10)}
                getRowId={(row) => row.id}
                minWidth={640}
              />
            </section>
          ) : null}
        </>
      )}

      <AdminQueueActionDialog
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
        titleKey={actionTarget?.titleKey ?? 'admin.queues.dialog.clearRisk'}
        confirmKey={actionTarget?.confirmKey ?? 'admin.queues.action.clear'}
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
