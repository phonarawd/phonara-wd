import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  useAdminUsersDesk,
  userBalanceSummaryParts,
  type AdminUserRow,
  type KycTier,
  type UserStatus,
} from '@/hooks/admin/useAdminUsersDesk';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

type UserActionKind = 'suspend' | 'unsuspend' | 'releaseSelfExclusion';

interface UserActionTarget {
  kind: UserActionKind;
  userId: string;
  exclusionId?: string;
  titleKey: MessageKey;
  confirmKey: MessageKey;
  destructive?: boolean;
  summary: string;
}

const STATUS_FILTER_KEYS: Record<UserStatus, MessageKey> = {
  active: 'admin.users.filter.status.active',
  suspended: 'admin.users.filter.status.suspended',
  banned: 'admin.users.filter.status.banned',
};

const KYC_FILTER_KEYS: Record<KycTier, MessageKey> = {
  tier0: 'admin.users.filter.kyc.tier0',
  tier1: 'admin.users.filter.kyc.tier1',
  tier2: 'admin.users.filter.kyc.tier2',
  tier3: 'admin.users.filter.kyc.tier3',
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

function userStatusState(status: UserStatus): MoneyStatusState {
  if (status === 'suspended') return 'halted';
  if (status === 'banned') return 'rejected';
  return 'settled';
}

function toggleFilter<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function auditActionKey(actionKey: string): MessageKey {
  const suffix = actionKey.replace(/^admin\.users\.(audit\.)?/, '');
  return `admin.users.audit.${suffix}` as MessageKey;
}

function formatUserSummary(row: AdminUserRow, t: ReturnType<typeof useT>): string {
  const parts = userBalanceSummaryParts(row);
  return `${row.displayName} · ${row.emailMasked} · ${t(STATUS_FILTER_KEYS[row.status])} · ${t(
    'admin.users.balance.summary',
    parts,
  )}`;
}

/** Admin users desk (`/users`) — list · suspend/unsuspend · self-exclusion release (§29.2). */
export function AdminUsersPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    users,
    filteredUsers,
    filters,
    setFilters,
    audit,
    selfExclusionByUserId,
    suspendUser,
    unsuspendUser,
    releaseSelfExclusion,
    loading,
    isError,
    refresh,
  } = useAdminUsersDesk();

  const [refreshing, setRefreshing] = useState(false);
  const [actionTarget, setActionTarget] = useState<UserActionTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const statusCounts = useMemo(() => {
    const counts: Record<UserStatus, number> = { active: 0, suspended: 0, banned: 0 };
    for (const row of users) {
      counts[row.status] += 1;
    }
    return counts;
  }, [users]);

  const selfExclusionCount = useMemo(
    () => users.filter((row) => selfExclusionByUserId.has(row.id)).length,
    [selfExclusionByUserId, users],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleActionSubmit = async (reason: string): Promise<boolean> => {
    if (!actionTarget) return false;
    setActionLoading(true);
    try {
      if (actionTarget.kind === 'suspend') {
        await suspendUser(actionTarget.userId, reason);
        return true;
      }
      if (actionTarget.kind === 'unsuspend') {
        await unsuspendUser(actionTarget.userId, reason);
        return true;
      }
      if (actionTarget.kind === 'releaseSelfExclusion' && actionTarget.exclusionId) {
        await releaseSelfExclusion(actionTarget.exclusionId, reason);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.users')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {loading
              ? t('admin.users.summary.loading')
              : t('admin.users.summary.members', { count: String(users.length) })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.users.description')}</p>
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
        persistenceId="admin-users"
        titleKey="admin.help.users.title"
        stepKeys={['admin.help.users.step1', 'admin.help.users.step2', 'admin.help.users.step3']}
      />

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('admin.users.queue.title')}</CardTitle>
          <CardDescription>{t('admin.users.deferred.mfaSession')}</CardDescription>
        </CardHeader>
      </Card>

      {isError ? (
        <EmptyState
          title={t('admin.users.error.title')}
          description={t('admin.users.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <>
          <section
            aria-labelledby="admin-users-metrics-heading"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <h3 id="admin-users-metrics-heading" className="sr-only">
              {t('admin.nav.users')}
            </h3>
            <MetricCard
              label={t('admin.users.filter.status.active')}
              value={String(statusCounts.active)}
            />
            <MetricCard
              label={t('admin.users.filter.status.suspended')}
              value={String(statusCounts.suspended)}
              emphasis={statusCounts.suspended > 0}
            />
            <MetricCard
              label={t('admin.users.filter.status.banned')}
              value={String(statusCounts.banned)}
            />
            <MetricCard
              label={t('admin.queues.type.rgSelfExclusionRelease')}
              value={String(selfExclusionCount)}
              emphasis={selfExclusionCount > 0}
            />
          </section>

          <section className="space-y-4">
            {!loading && users.length === 0 ? (
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.users.empty.desc')}
                actionLabel={t('admin.users.empty.cta')}
                onAction={() => {
                  goTo('/queues');
                }}
              />
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <Input
                    value={filters.search}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, search: event.target.value }))
                    }
                    placeholder={t('admin.users.search.placeholder')}
                    aria-label={t('admin.users.search.placeholder')}
                    className="max-w-md"
                  />

                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(STATUS_FILTER_KEYS) as UserStatus[]).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={filters.status.includes(status) ? 'primary' : 'outline'}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            status: toggleFilter(prev.status, status),
                          }))
                        }
                      >
                        {t(STATUS_FILTER_KEYS[status])}
                      </Button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(KYC_FILTER_KEYS) as KycTier[]).map((tier) => (
                      <Button
                        key={tier}
                        size="sm"
                        variant={filters.kyc.includes(tier) ? 'primary' : 'outline'}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            kyc: toggleFilter(prev.kyc, tier),
                          }))
                        }
                      >
                        {t(KYC_FILTER_KEYS[tier])}
                      </Button>
                    ))}
                  </div>
                </div>

                <AdminTable
                  columns={[
                    {
                      id: 'name',
                      header: t('admin.users.col.name'),
                      cell: ({ row }) => (
                        <>
                          <div className="font-medium">{row.displayName}</div>
                          <div className="text-foreground-muted text-xs">{row.id}</div>
                        </>
                      ),
                    },
                    {
                      id: 'email',
                      header: t('admin.users.col.email'),
                      cell: ({ row }) => row.emailMasked,
                    },
                    {
                      id: 'status',
                      header: t('admin.users.col.status'),
                      cell: ({ row }) => (
                        <StatusBadge
                          state={userStatusState(row.status)}
                          label={t(STATUS_FILTER_KEYS[row.status])}
                        />
                      ),
                    },
                    {
                      id: 'kyc',
                      header: t('admin.users.col.kyc'),
                      cell: ({ row }) => t(KYC_FILTER_KEYS[row.kycTier]),
                    },
                    {
                      id: 'balance',
                      header: t('admin.users.col.balance'),
                      cell: ({ row }) =>
                        t('admin.users.balance.summary', userBalanceSummaryParts(row)),
                      meta: { className: 'tabular-nums' },
                    },
                    {
                      id: 'session',
                      header: t('admin.users.col.session'),
                      cell: ({ row }) => formatWhen(row.lastSessionAt, locale),
                      meta: { className: 'text-foreground-muted' },
                    },
                  ]}
                  rows={filteredUsers}
                  getRowId={(row) => row.id}
                  loading={loading}
                  loadingRowCount={6}
                  minWidth={960}
                  empty={
                    <EmptyState
                      title={t('admin.users.empty.title')}
                      description={t('admin.users.empty.desc')}
                      actionLabel={t('admin.referrals.empty.clearSearch')}
                      onAction={() => setFilters({ search: '', status: [], kyc: [] })}
                    />
                  }
                  rowActionsHeader={t('admin.users.col.action')}
                  rowActions={(row) => {
                    const exclusion = selfExclusionByUserId.get(row.id);
                    return (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => goTo(`/users/${row.id}/tier`)}
                        >
                          {t('admin.users.action.viewTier')}
                        </Button>
                        {row.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setActionTarget({
                                kind: 'suspend',
                                userId: row.id,
                                titleKey: 'admin.users.dialog.suspend',
                                confirmKey: 'admin.users.action.suspend',
                                destructive: true,
                                summary: `${formatUserSummary(row, t)}\n${t('admin.users.dialog.suspend.desc')}`,
                              })
                            }
                          >
                            {t('admin.users.action.suspend')}
                          </Button>
                        ) : null}
                        {row.status === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setActionTarget({
                                kind: 'unsuspend',
                                userId: row.id,
                                titleKey: 'admin.users.dialog.unsuspend',
                                confirmKey: 'admin.users.action.unsuspend',
                                summary: `${formatUserSummary(row, t)}\n${t('admin.users.dialog.unsuspend.desc')}`,
                              })
                            }
                          >
                            {t('admin.users.action.unsuspend')}
                          </Button>
                        ) : null}
                        {exclusion ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                              setActionTarget({
                                kind: 'releaseSelfExclusion',
                                userId: row.id,
                                exclusionId: exclusion.id,
                                titleKey: 'admin.users.dialog.releaseSelfExclusion',
                                confirmKey: 'admin.users.action.releaseSelfExclusion',
                                destructive: true,
                                summary: `${formatUserSummary(row, t)}\n${t('admin.users.dialog.releaseSelfExclusion.desc')}`,
                              })
                            }
                          >
                            {t('admin.users.action.releaseSelfExclusion')}
                          </Button>
                        ) : null}
                      </>
                    );
                  }}
                />
              </>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="admin-users-audit-heading">
            <h3
              id="admin-users-audit-heading"
              className="text-foreground m-0 text-base font-semibold"
            >
              {t('admin.users.audit.title')}
            </h3>
            <AdminTable
              columns={[
                {
                  id: 'time',
                  header: t('admin.audit.col.time'),
                  cell: ({ row }) => formatWhen(row.at, locale),
                  meta: { className: 'text-foreground-muted' },
                },
                {
                  id: 'action',
                  header: t('admin.audit.col.action'),
                  cell: ({ row }) => t(auditActionKey(row.actionKey)),
                },
                { id: 'name', header: t('admin.users.col.name'), cell: ({ row }) => row.subject },
                {
                  id: 'reason',
                  header: t('admin.audit.col.reason'),
                  cell: ({ row }) => row.reason || '—',
                  meta: { className: 'text-foreground-muted' },
                },
              ]}
              rows={audit.slice(0, 20)}
              getRowId={(row) => row.id}
              minWidth={640}
              empty={
                <p className="text-foreground-muted m-0 text-sm">{t('admin.users.audit.empty')}</p>
              }
            />
          </section>
        </>
      )}

      <AdminQueueActionDialog
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
        titleKey={actionTarget?.titleKey ?? 'admin.users.dialog.suspend'}
        confirmKey={actionTarget?.confirmKey ?? 'admin.users.action.suspend'}
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
