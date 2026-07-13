import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  useAdminRewardsDesk,
  type RewardCurrency,
  type RewardDirection,
} from '@/hooks/admin/useAdminRewardsDesk';
import type { AdminUserRow } from '@/hooks/admin/useAdminUsersDesk';
import { formatAmountString } from '@/hooks/admin/useAdminWalletDesk';
import { userBalanceSummaryParts } from '@/hooks/admin/useAdminUsersDesk';
import { useAdminOperatorRbac } from '@/hooks/admin/useAdminOperatorRbac';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';
import { StatusBadge } from '@/product/primitives/status-badge';
import { ADMIN_RBAC_DENIED_KEY, adminRbacActionProps } from '@/product/surfaces/admin-rbac-action';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

const CURRENCIES: RewardCurrency[] = ['PHON', 'USDT', 'KRW'];
const DIRECTIONS: RewardDirection[] = ['credit', 'debit'];

const CURRENCY_KEYS: Record<RewardCurrency, MessageKey> = {
  PHON: 'admin.rewards.currency.phon',
  USDT: 'admin.rewards.currency.usdt',
  KRW: 'admin.rewards.currency.krw',
};

const DIRECTION_KEYS: Record<RewardDirection, MessageKey> = {
  credit: 'admin.users.manualAdjust.direction.credit',
  debit: 'admin.users.manualAdjust.direction.debit',
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

function isValidAmount(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value.trim()) && Number(value) > 0;
}

function formatAdjustSummary(
  user: AdminUserRow,
  currency: RewardCurrency,
  amount: string,
  direction: RewardDirection,
  t: ReturnType<typeof useT>,
): string {
  const parts = userBalanceSummaryParts(user);
  return [
    `${user.displayName} · ${user.emailMasked}`,
    `${t(DIRECTION_KEYS[direction])} · ${formatAmountString(amount, currency)}`,
    t('admin.users.balance.summary', parts),
  ].join(' · ');
}

/** Admin rewards desk (`/earn/rewards`) — manual wallet credit/debit (§29.2 R3). */
export function AdminEarnRewardsPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const { can } = useAdminOperatorRbac();
  const canWalletAdjust = can('users.wallet_adjust');
  const rbacDenied = t(ADMIN_RBAC_DENIED_KEY);
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    filteredUsers,
    filters,
    setFilters,
    recentAdjustments,
    manualAdjust,
    loading,
    isError,
    refresh,
  } = useAdminRewardsDesk();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<RewardCurrency>('PHON');
  const [direction, setDirection] = useState<RewardDirection>('credit');
  const [amount, setAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const selectedUser = useMemo(
    () => filteredUsers.find((row) => row.id === selectedUserId) ?? null,
    [filteredUsers, selectedUserId],
  );

  const canSubmit = canWalletAdjust && selectedUser !== null && isValidAmount(amount);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleActionSubmit = async (reason: string): Promise<boolean> => {
    if (!canWalletAdjust || !selectedUser || !canSubmit) return false;
    setActionLoading(true);
    try {
      return await manualAdjust(selectedUser.id, {
        currency,
        amount: amount.trim(),
        direction,
        reason,
        clientRequestId: crypto.randomUUID(),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustSuccess = () => {
    setAmount('');
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.rewards')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {loading
              ? t('admin.rewards.summary.loading')
              : t('admin.rewards.summary.members', { count: String(filteredUsers.length) })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.rewards.description')}</p>
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
        persistenceId="admin-earn-rewards"
        titleKey="admin.help.rewards.title"
        stepKeys={[
          'admin.help.rewards.step1',
          'admin.help.rewards.step2',
          'admin.help.rewards.step3',
        ]}
      />

      {isError ? (
        <EmptyState
          title={t('admin.rewards.error.title')}
          description={t('admin.rewards.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <Card>
              <CardHeader className="gap-2">
                <CardTitle className="text-base">{t('admin.rewards.section.member')}</CardTitle>
                <CardDescription>{t('admin.rewards.section.memberBody')}</CardDescription>
              </CardHeader>
            </Card>

            <Input
              id="admin-rewards-member-search"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder={t('admin.rewards.search.placeholder')}
              aria-label={t('admin.rewards.search.placeholder')}
            />

            {loading ? (
              <div className="space-y-2" aria-busy="true">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-16" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                title={t('admin.overview.empty.title')}
                description={t('admin.rewards.empty.members')}
                actionLabel={t('admin.rewards.empty.clearSearch')}
                onAction={() => setFilters({ search: '' })}
              />
            ) : (
              <ul className="m-0 list-none space-y-2 p-0">
                {filteredUsers.map((row) => {
                  const active = row.id === selectedUserId;
                  return (
                    <li key={row.id}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setSelectedUserId(row.id)}
                        className={cn(
                          'h-auto w-full flex-col items-start rounded-md border px-4 py-3 text-left text-sm font-normal',
                          active
                            ? 'border-accent bg-accent/5'
                            : 'border-line bg-surface-raised hover:bg-surface',
                        )}
                      >
                        <p className="text-foreground m-0 font-medium">{row.displayName}</p>
                        <p className="text-foreground-muted m-0 mt-1 text-xs">
                          {row.emailMasked} · {row.id}
                        </p>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <Card>
              <CardHeader className="gap-2">
                <CardTitle className="text-base">{t('admin.rewards.section.form')}</CardTitle>
                <CardDescription>{t('admin.rewards.section.formBody')}</CardDescription>
              </CardHeader>
            </Card>

            {!selectedUser ? (
              <EmptyState
                title={t('admin.rewards.empty.noSelection')}
                description={t('admin.rewards.empty.noSelectionBody')}
                actionLabel={t('admin.rewards.search.placeholder')}
                onAction={() => {
                  document.getElementById('admin-rewards-member-search')?.focus();
                }}
              />
            ) : (
              <div className="space-y-4 rounded-lg border border-line p-4">
                <p className="text-foreground-muted m-0 text-sm">
                  {formatAdjustSummary(selectedUser, currency, amount || '0', direction, t)}
                </p>

                <div className="space-y-2">
                  <p className="text-foreground m-0 text-sm font-medium">
                    {t('admin.users.manualAdjust.currency')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CURRENCIES.map((value) => (
                      <FilterChip
                        key={value}
                        active={currency === value}
                        label={t(CURRENCY_KEYS[value])}
                        onClick={() => setCurrency(value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-foreground m-0 text-sm font-medium">
                    {t('admin.rewards.field.direction')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DIRECTIONS.map((value) => (
                      <FilterChip
                        key={value}
                        active={direction === value}
                        label={t(DIRECTION_KEYS[value])}
                        onClick={() => setDirection(value)}
                        destructive={value === 'debit'}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-rewards-amount"
                    className="text-foreground text-sm font-medium"
                  >
                    {t('admin.users.manualAdjust.amount')}
                  </label>
                  <Input
                    id="admin-rewards-amount"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder={t('admin.rewards.field.amountPlaceholder')}
                    inputMode="decimal"
                    autoComplete="off"
                    className="tabular-nums"
                  />
                </div>

                <Button
                  variant={direction === 'debit' ? 'destructive' : 'primary'}
                  size="md"
                  {...adminRbacActionProps(canWalletAdjust, rbacDenied)}
                  disabled={!canSubmit}
                  onClick={() => {
                    if (!canWalletAdjust) return;
                    setDialogOpen(true);
                  }}
                >
                  {t('admin.rewards.action.adjust')}
                </Button>
                {!canWalletAdjust ? (
                  <p className="text-foreground-muted m-0 text-xs">{rbacDenied}</p>
                ) : null}
              </div>
            )}
          </section>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-foreground m-0 text-base font-semibold">
          {t('admin.rewards.section.history')}
        </h3>
        <AdminTable
          columns={[
            {
              id: 'member',
              header: t('admin.rewards.col.member'),
              cell: ({ row }) => row.userMask,
            },
            {
              id: 'direction',
              header: t('admin.rewards.col.direction'),
              cell: ({ row }) => (
                <StatusBadge
                  state={row.direction === 'credit' ? 'settled' : 'rejected'}
                  label={t(DIRECTION_KEYS[row.direction])}
                />
              ),
            },
            {
              id: 'amount',
              header: t('admin.rewards.col.amount'),
              cell: ({ row }) => formatAmountString(row.amount, row.currency),
              meta: { className: 'tabular-nums' },
            },
            {
              id: 'reason',
              header: t('admin.rewards.col.reason'),
              cell: ({ row }) => row.reason,
              meta: { className: 'text-foreground-muted max-w-[240px] truncate' },
            },
            {
              id: 'at',
              header: t('admin.rewards.col.at'),
              cell: ({ row }) => formatWhen(row.at, locale),
              meta: { className: 'text-foreground-muted tabular-nums' },
            },
          ]}
          rows={recentAdjustments}
          getRowId={(row) => row.id}
          loading={loading}
          loadingRowCount={4}
          minWidth={720}
          empty={
            <EmptyState
              title={t('admin.overview.empty.title')}
              description={t('admin.rewards.empty.history')}
              actionLabel={t('admin.rewards.empty.cta')}
              onAction={() => goTo('/audit')}
            />
          }
        />
      </section>

      {selectedUser && canSubmit ? (
        <AdminQueueActionDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open && !actionLoading) return;
          }}
          titleKey="admin.rewards.dialog.adjust"
          confirmKey="admin.rewards.action.adjust"
          summary={formatAdjustSummary(selectedUser, currency, amount.trim(), direction, t)}
          destructive={direction === 'debit'}
          minReason={8}
          loading={actionLoading}
          onSubmit={async (reason) => {
            const ok = await handleActionSubmit(reason);
            if (ok) handleAdjustSuccess();
            return ok;
          }}
        />
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  destructive = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <Button
      variant={active ? (destructive ? 'destructive' : 'primary') : 'outline'}
      size="sm"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
