import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import { useAdminStakingDesk, type AdminStakingPoolRow } from '@/hooks/admin/useAdminStakingDesk';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

const TERM_LABEL_KEYS: Record<string, MessageKey> = {
  flexible: 'staking.term.flexible',
  days_7: 'staking.term.days_7',
  days_30: 'staking.term.days_30',
  days_90: 'staking.term.days_90',
  custom: 'staking.term.custom',
};

type PoolToggleTarget = {
  pool: AdminStakingPoolRow;
  nextActive: boolean;
  titleKey: MessageKey;
  confirmKey: MessageKey;
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

function termLabelKey(term: string): MessageKey {
  return TERM_LABEL_KEYS[term] ?? 'staking.term.custom';
}

function poolStatusState(isActive: boolean): MoneyStatusState {
  return isActive ? 'settled' : 'halted';
}

function formatLockDays(pool: AdminStakingPoolRow, t: ReturnType<typeof useT>): string {
  if (pool.lockDays <= 0) return t('staking.term.flexible');
  return String(pool.lockDays);
}

function poolSummary(pool: AdminStakingPoolRow, t: ReturnType<typeof useT>): string {
  const status = pool.isActive ? t('admin.staking.active') : t('admin.staking.inactive');
  return `${t(termLabelKey(pool.term))} · ${pool.estimatedApr}% APR · ${formatLockDays(pool, t)} · ${status}`;
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

/** Admin staking desk (`/staking`) — pool list read + activate/deactivate (§29.2 R0·R3). */
export function AdminStakingPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const { pools, loading, isError, busy, auditEvents, refresh, setPoolActive } =
    useAdminStakingDesk();

  const [refreshing, setRefreshing] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<PoolToggleTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const activeCount = useMemo(() => pools.filter((row) => row.isActive).length, [pools]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleSubmit = async (reason: string): Promise<boolean> => {
    if (!toggleTarget) return false;
    setActionLoading(true);
    try {
      await setPoolActive(toggleTarget.pool.id, toggleTarget.nextActive, reason);
      return true;
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
            {t('admin.nav.staking')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {loading
              ? t('admin.staking.summary.loading')
              : t('admin.staking.summary.pools', { count: String(pools.length) })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.staking.description')}</p>
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
        persistenceId="admin-staking"
        titleKey="admin.help.staking.title"
        stepKeys={[
          'admin.help.staking.step1',
          'admin.help.staking.step2',
          'admin.help.staking.step3',
        ]}
      />

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('admin.staking.tierCap.deferred')}</CardTitle>
          <CardDescription>{t('admin.staking.tierCap.deferredBody')}</CardDescription>
        </CardHeader>
      </Card>

      {isError ? (
        <EmptyState
          title={t('admin.staking.error.title')}
          description={t('admin.staking.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : loading ? (
        <LoadingTable rows={4} cols={5} />
      ) : pools.length === 0 ? (
        <EmptyState
          title={t('admin.overview.empty.title')}
          description={t('admin.staking.empty.desc')}
          actionLabel={t('admin.staking.empty.cta')}
          onAction={() => {
            goTo('/ops');
          }}
        />
      ) : (
        <>
          <p className="text-foreground-muted m-0 text-sm">
            {t('admin.staking.summary.active', { count: String(activeCount) })}
          </p>

          <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-surface-raised text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('admin.staking.col.term')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.staking.col.apr')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.staking.col.lockDays')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.staking.col.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.staking.col.action')}</th>
                </tr>
              </thead>
              <tbody>
                {pools.map((pool) => (
                  <tr key={pool.id} className="border-line border-t">
                    <td className="text-foreground px-4 py-3">{t(termLabelKey(pool.term))}</td>
                    <td className="text-foreground px-4 py-3 tabular-nums">{pool.estimatedApr}%</td>
                    <td className="text-foreground-muted px-4 py-3 tabular-nums">
                      {formatLockDays(pool, t)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        state={poolStatusState(pool.isActive)}
                        label={
                          pool.isActive ? t('admin.staking.active') : t('admin.staking.inactive')
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={pool.isActive ? 'outline' : 'primary'}
                        disabled={busy}
                        onClick={() =>
                          setToggleTarget({
                            pool,
                            nextActive: !pool.isActive,
                            titleKey: pool.isActive
                              ? 'admin.staking.dialog.deactivate'
                              : 'admin.staking.dialog.activate',
                            confirmKey: pool.isActive
                              ? 'admin.staking.deactivate'
                              : 'admin.staking.activate',
                          })
                        }
                      >
                        {pool.isActive
                          ? t('admin.staking.deactivate')
                          : t('admin.staking.activate')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditEvents.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-foreground m-0 text-base font-semibold">
                {t('admin.staking.audit.recent')}
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {auditEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-(--ds-radius-md) border border-line bg-surface-raised px-4 py-3 text-sm"
                  >
                    <p className="text-foreground m-0 font-medium">
                      {t(event.actionKey as MessageKey)}
                    </p>
                    <p className="text-foreground-muted m-0 mt-1">
                      {formatWhen(event.at, locale)}
                      {event.reason ? ` · ${event.reason}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      <AdminQueueActionDialog
        open={toggleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null);
        }}
        titleKey={toggleTarget?.titleKey ?? 'admin.staking.dialog.activate'}
        confirmKey={toggleTarget?.confirmKey ?? 'admin.staking.activate'}
        destructive={toggleTarget?.nextActive === false}
        loading={actionLoading}
        summary={
          toggleTarget ? (
            <p className="text-foreground m-0 whitespace-pre-line">
              {poolSummary(toggleTarget.pool, t)}
            </p>
          ) : undefined
        }
        onSubmit={handleToggleSubmit}
      />
    </div>
  );
}
