import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import { canAccessAdminSupportDesk } from '@/domain/admin-support-desk-display-contract';
import { useAdminSupportDesk, type AdminSupportTicketRow } from '@/hooks/admin/useAdminSupportDesk';
import { useAdminOperatorRbac } from '@/hooks/admin/useAdminOperatorRbac';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

function formatWhen(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ticketStatusState(status: AdminSupportTicketRow['status']): MoneyStatusState {
  if (status === 'resolved' || status === 'closed') return 'settled';
  if (status === 'in_progress') return 'reviewing';
  return 'pending';
}

function categoryLabelKey(category: AdminSupportTicketRow['category']): MessageKey {
  return `admin.support.category.${category}` as MessageKey;
}

function statusFilterLabelKey(
  status: 'all' | 'open_queue' | AdminSupportTicketRow['status'],
): MessageKey {
  if (status === 'all') return 'admin.support.filter.status.all';
  if (status === 'open_queue') return 'admin.support.filter.status.openQueue';
  return `admin.support.status.${status}` as MessageKey;
}

function priorityLabelKey(priority: AdminSupportTicketRow['priority']): MessageKey {
  return `admin.support.priority.${priority}` as MessageKey;
}

function actionSummary(row: AdminSupportTicketRow, t: ReturnType<typeof useT>): string {
  return [
    `${t('admin.support.col.subject')}: ${row.subject}`,
    `${t('admin.support.col.category')}: ${t(categoryLabelKey(row.category))}`,
    `${t('admin.support.col.member')}: ${row.userId.slice(0, 8)}…`,
    `${t('admin.support.col.priority')}: ${t(priorityLabelKey(row.priority))}`,
  ].join('\n');
}

/** Canonical admin `/support` — member inquiry list · resolve (§29.2 R0·R2 · E9). */
export function AdminSupportPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';
  const { role } = useAdminOperatorRbac();
  const allowed = canAccessAdminSupportDesk(role);

  const {
    filteredTickets,
    openCount,
    highPriorityOpenCount,
    filters,
    setFilters,
    loading,
    isError,
    busy,
    auditEvents,
    refresh,
    resolveTicket,
    canResolve,
  } = useAdminSupportDesk();

  const [refreshing, setRefreshing] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<AdminSupportTicketRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const summaryLine = useMemo(() => {
    if (loading) return t('admin.support.summary.loading');
    return t('admin.support.summary.open', { count: String(openCount) });
  }, [loading, openCount, t]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleResolveSubmit = async (reason: string): Promise<boolean> => {
    if (!resolveTarget) return false;
    setActionLoading(true);
    try {
      await resolveTicket({ ticketId: resolveTarget.id, reason });
      return true;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  if (!allowed) {
    return (
      <div className="flex flex-col gap-ds-8" data-testid="admin-support-page-forbidden">
        <EmptyState
          title={t('admin.support.forbidden.title')}
          description={t('admin.support.forbidden.body')}
          actionLabel={t('admin.nav.queues')}
          onAction={() => {
            goTo('/queues');
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-ds-8" data-testid="admin-support-page">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.support')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">{summaryLine}</p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.support.subtitle')}</p>
          {highPriorityOpenCount > 0 ? (
            <p
              className="text-foreground m-0 text-sm font-medium"
              data-testid="admin-support-urgent"
            >
              {t('admin.support.summary.urgent', { count: String(highPriorityOpenCount) })}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              goTo('/queues');
            }}
            data-testid="admin-support-to-queues"
          >
            {t('admin.support.action.toQueues')}
          </Button>
          <Button
            variant="outline"
            size="md"
            loading={refreshing || loading}
            onClick={() => void handleRefresh()}
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />
            {t('admin.overview.action.refresh')}
          </Button>
        </div>
      </section>

      <HowItWorks
        persistenceId="admin-support"
        titleKey="admin.help.support.title"
        stepKeys={[
          'admin.help.support.step1',
          'admin.help.support.step2',
          'admin.help.support.step3',
        ]}
      />

      {isError ? (
        <EmptyState
          title={t('admin.support.error.title')}
          description={t('admin.support.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <>
          <section
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            aria-label={t('admin.support.filter.aria')}
          >
            <div className="min-w-48 flex-1">
              <label className="text-foreground-muted mb-1 block text-xs font-medium">
                {t('admin.support.search.placeholder')}
              </label>
              <Input
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, search: event.target.value }))
                }
                placeholder={t('admin.support.search.placeholder')}
                data-testid="admin-support-search"
              />
            </div>
            <div>
              <label className="text-foreground-muted mb-1 block text-xs font-medium">
                {t('admin.support.col.status')}
              </label>
              <select
                className="border-line bg-surface-raised text-foreground rounded-md border px-3 py-2 text-sm"
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value as typeof prev.status,
                  }))
                }
                data-testid="admin-support-status-filter"
              >
                {(['open_queue', 'all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(
                  (value) => (
                    <option key={value} value={value}>
                      {t(statusFilterLabelKey(value))}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="text-foreground-muted mb-1 block text-xs font-medium">
                {t('admin.support.col.priority')}
              </label>
              <select
                className="border-line bg-surface-raised text-foreground rounded-md border px-3 py-2 text-sm"
                value={filters.priority}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    priority: event.target.value as typeof prev.priority,
                  }))
                }
                data-testid="admin-support-priority-filter"
              >
                <option value="all">{t('admin.support.filter.priority.all')}</option>
                <option value="high">{t('admin.support.priority.high')}</option>
                <option value="normal">{t('admin.support.priority.normal')}</option>
                <option value="low">{t('admin.support.priority.low')}</option>
              </select>
            </div>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setFilters({ search: '', status: 'open_queue', priority: 'all' })}
            >
              {t('admin.support.filter.reset')}
            </Button>
          </section>

          <AdminTable
            columns={[
              {
                id: 'subject',
                header: t('admin.support.col.subject'),
                cell: ({ row }) => (
                  <span className="text-foreground font-medium">{row.subject}</span>
                ),
              },
              {
                id: 'category',
                header: t('admin.support.col.category'),
                cell: ({ row }) => t(categoryLabelKey(row.category)),
              },
              {
                id: 'member',
                header: t('admin.support.col.member'),
                cell: ({ row }) => <span className="tabular-nums">{row.userId.slice(0, 8)}…</span>,
              },
              {
                id: 'priority',
                header: t('admin.support.col.priority'),
                cell: ({ row }) => t(priorityLabelKey(row.priority)),
              },
              {
                id: 'status',
                header: t('admin.support.col.status'),
                cell: ({ row }) => <StatusBadge state={ticketStatusState(row.status)} />,
              },
              {
                id: 'created',
                header: t('admin.support.col.created'),
                cell: ({ row }) => (
                  <span className="tabular-nums">{formatWhen(row.createdAt, locale)}</span>
                ),
              },
              {
                id: 'action',
                header: t('admin.support.col.action'),
                cell: ({ row }) =>
                  canResolve(row) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      data-testid={`admin-support-resolve-${row.id}`}
                      onClick={() => setResolveTarget(row)}
                    >
                      {t('admin.support.action.resolve')}
                    </Button>
                  ) : (
                    <span className="text-foreground-muted text-sm">
                      {t('admin.support.status.resolved')}
                    </span>
                  ),
              },
            ]}
            rows={filteredTickets}
            getRowId={(row) => row.id}
            loading={loading}
            minWidth={880}
            empty={
              <EmptyState
                title={t('admin.support.empty.title')}
                description={t('admin.support.empty.body')}
                actionLabel={t('admin.support.action.toQueues')}
                onAction={() => {
                  goTo('/queues');
                }}
              />
            }
          />

          {auditEvents.length > 0 ? (
            <section className="space-y-2" data-testid="admin-support-audit">
              <h3 className="text-foreground m-0 text-sm font-semibold">
                {t('admin.support.audit.title')}
              </h3>
              <AdminTable
                columns={[
                  {
                    id: 'at',
                    header: t('admin.audit.col.time'),
                    cell: ({ row }) => (
                      <span className="tabular-nums">{formatWhen(row.at, locale)}</span>
                    ),
                  },
                  {
                    id: 'action',
                    header: t('admin.audit.col.action'),
                    cell: ({ row }) => t(row.actionKey as MessageKey),
                  },
                  {
                    id: 'subject',
                    header: t('admin.support.col.subject'),
                    cell: ({ row }) => (
                      <span className="tabular-nums">{String(row.subject).slice(0, 8)}…</span>
                    ),
                  },
                  {
                    id: 'reason',
                    header: t('admin.audit.col.reason'),
                    cell: ({ row }) => row.reason ?? '—',
                  },
                ]}
                rows={auditEvents}
                getRowId={(row) => row.id}
                loading={false}
                minWidth={640}
                empty={null}
              />
            </section>
          ) : null}
        </>
      )}

      <AdminQueueActionDialog
        open={resolveTarget != null}
        onOpenChange={(open) => {
          if (!open) setResolveTarget(null);
        }}
        titleKey="admin.support.dialog.resolve"
        confirmKey="admin.support.action.resolve"
        summary={resolveTarget ? actionSummary(resolveTarget, t) : undefined}
        loading={actionLoading}
        onSubmit={handleResolveSubmit}
      />
    </div>
  );
}
