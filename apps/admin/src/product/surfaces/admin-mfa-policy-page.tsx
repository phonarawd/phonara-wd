import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  useAdminMfaPolicyDesk,
  type AdminMfaPolicyDeskRow,
  type MfaTierKey,
} from '@/hooks/admin/useAdminMfaPolicyDesk';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

const TIER_LABEL_KEYS: Record<MfaTierKey, MessageKey> = {
  'tier.admin': 'admin.access.mfa.tier.admin',
  'tier.staff': 'admin.access.mfa.tier.staff',
  'tier.platinum': 'admin.access.mfa.tier.platinum',
  'tier.gold': 'admin.access.mfa.tier.gold',
  'tier.silver': 'admin.access.mfa.tier.silver',
  'tier.bronze': 'admin.access.mfa.tier.bronze',
};

type PolicyActionTarget = {
  row: AdminMfaPolicyDeskRow;
  nextRequired: boolean;
  titleKey: MessageKey;
  confirmKey: MessageKey;
  destructive: boolean;
};

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

function requiredStatusState(required: boolean): MoneyStatusState {
  return required ? 'settled' : 'halted';
}

function policySummary(row: AdminMfaPolicyDeskRow, t: ReturnType<typeof useT>): string {
  const tier = t(TIER_LABEL_KEYS[row.tierKey]);
  const required = row.mfaRequired
    ? t('admin.access.mfa.required.on')
    : t('admin.access.mfa.required.off');
  const nextRequired = !row.mfaRequired
    ? t('admin.access.mfa.required.on')
    : t('admin.access.mfa.required.off');
  return [
    `${t('admin.access.mfa.col.tier')}: ${tier}`,
    `${t('admin.mfa.policy.summary.current')}: ${required}`,
    `${t('admin.mfa.policy.summary.next')}: ${nextRequired}`,
    `${t('admin.access.mfa.col.grace')}: ${row.graceDays}`,
    `${t('admin.access.mfa.col.enroll')}: ${row.enrollRate}%`,
  ].join('\n');
}

/** Canonical admin `/mfa/policy` — team MFA tier policy desk · `rpc_admin_set_mfa_policy` (§29.2 R3). */
export function AdminMfaPolicyPage() {
  const t = useT();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  const {
    filteredPolicies,
    filters,
    setFilters,
    tierKeys,
    loading,
    isError,
    busy,
    auditEvents,
    refresh,
    setMfaRequired,
    canRelaxTier,
    policies,
  } = useAdminMfaPolicyDesk();

  const [refreshing, setRefreshing] = useState(false);
  const [actionTarget, setActionTarget] = useState<PolicyActionTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const requiredCount = useMemo(() => policies.filter((row) => row.mfaRequired).length, [policies]);

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
      await setMfaRequired(actionTarget.row.tierKey, actionTarget.nextRequired, reason);
      return true;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" data-testid="admin-mfa-policy-page">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.mfa.title')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {loading
              ? t('admin.mfa.policy.summary.loading')
              : t('admin.mfa.policy.summary.tiers', { count: String(policies.length) })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.mfa.subtitle')}</p>
          <p className="text-foreground-muted m-0 text-sm">
            {t('admin.access.mfa.section.subtitle')}
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          loading={refreshing || loading}
          onClick={() => void handleRefresh()}
          className="shrink-0"
        >
          <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />
          {t('admin.overview.action.refresh')}
        </Button>
      </section>

      <HowItWorks
        persistenceId="admin-mfa-policy"
        titleKey="admin.help.mfa.policy.title"
        stepKeys={[
          'admin.help.mfa.policy.step1',
          'admin.help.mfa.policy.step2',
          'admin.help.mfa.policy.step3',
        ]}
      />

      {isError ? (
        <EmptyState
          title={t('admin.mfa.policy.error.title')}
          description={t('admin.mfa.policy.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : !loading && policies.length === 0 ? (
        <EmptyState
          title={t('admin.access.mfa.empty')}
          description={t('admin.mfa.policy.empty.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <>
          <p className="text-foreground-muted m-0 text-sm">
            {t('admin.mfa.policy.summary.required', { count: String(requiredCount) })}
          </p>

          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
            <Input
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder={t('admin.access.mfa.search.placeholder')}
              aria-label={t('admin.access.mfa.search.placeholder')}
              className="max-w-md"
            />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground-muted">{t('admin.access.mfa.col.tier')}</span>
              <select
                className="border-line bg-surface text-foreground rounded-md border px-3 py-2"
                value={filters.tierKey}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    tierKey: event.target.value as MfaTierKey | 'all',
                  }))
                }
              >
                <option value="all">{t('admin.access.mfa.tier.all')}</option>
                {tierKeys.map((tierKey) => (
                  <option key={tierKey} value={tierKey}>
                    {t(TIER_LABEL_KEYS[tierKey])}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground-muted">{t('admin.access.mfa.col.required')}</span>
              <select
                className="border-line bg-surface text-foreground rounded-md border px-3 py-2"
                value={filters.required}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    required: event.target.value as 'all' | 'on' | 'off',
                  }))
                }
              >
                <option value="all">{t('admin.access.mfa.required.all')}</option>
                <option value="on">{t('admin.access.mfa.required.on')}</option>
                <option value="off">{t('admin.access.mfa.required.off')}</option>
              </select>
            </label>
          </div>

          <AdminTable
            columns={[
              {
                id: 'tier',
                header: t('admin.access.mfa.col.tier'),
                cell: ({ row }) => t(TIER_LABEL_KEYS[row.tierKey]),
              },
              {
                id: 'required',
                header: t('admin.access.mfa.col.required'),
                cell: ({ row }) => (
                  <StatusBadge
                    state={requiredStatusState(row.mfaRequired)}
                    label={
                      row.mfaRequired
                        ? t('admin.access.mfa.required.on')
                        : t('admin.access.mfa.required.off')
                    }
                  />
                ),
              },
              {
                id: 'grace',
                header: t('admin.access.mfa.col.grace'),
                cell: ({ row }) => row.graceDays,
                meta: { className: 'text-foreground-muted tabular-nums' },
              },
              {
                id: 'enroll',
                header: t('admin.access.mfa.col.enroll'),
                cell: ({ row }) => `${row.enrollRate}%`,
                meta: { className: 'text-foreground-muted tabular-nums' },
              },
              {
                id: 'updated',
                header: t('admin.access.mfa.col.updated'),
                cell: ({ row }) => formatWhen(row.updatedAt, locale),
                meta: { className: 'text-foreground-muted' },
              },
            ]}
            rows={filteredPolicies}
            getRowId={(row) => row.id}
            loading={loading}
            loadingRowCount={6}
            minWidth={760}
            empty={
              <EmptyState
                title={t('admin.access.mfa.empty')}
                description={t('admin.mfa.policy.filter.empty')}
                actionLabel={t('admin.mfa.policy.filter.reset')}
                onAction={() => setFilters({ search: '', tierKey: 'all', required: 'all' })}
              />
            }
            rowActionsHeader={t('admin.access.mfa.col.action')}
            rowActions={(row) => {
              const canRequire = !row.mfaRequired;
              const canRelax = row.mfaRequired && canRelaxTier(row.tierKey);
              return (
                <>
                  {canRequire ? (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={busy}
                      data-testid={`admin-mfa-policy-require-${row.tierKey}`}
                      onClick={() =>
                        setActionTarget({
                          row,
                          nextRequired: true,
                          titleKey: 'admin.mfa.policy.dialog.require',
                          confirmKey: 'admin.access.mfa.action.require',
                          destructive: false,
                        })
                      }
                    >
                      {t('admin.access.mfa.action.require')}
                    </Button>
                  ) : null}
                  {canRelax ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      data-testid={`admin-mfa-policy-relax-${row.tierKey}`}
                      onClick={() =>
                        setActionTarget({
                          row,
                          nextRequired: false,
                          titleKey: 'admin.access.mfa.dialog.relax.title',
                          confirmKey: 'admin.access.mfa.action.relax',
                          destructive: true,
                        })
                      }
                    >
                      {t('admin.access.mfa.action.relax')}
                    </Button>
                  ) : null}
                </>
              );
            }}
          />

          {auditEvents.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-foreground m-0 text-base font-semibold">
                {t('admin.access.mfa.audit.title')}
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {auditEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-md border border-line bg-surface-raised px-4 py-3 text-sm"
                  >
                    <p className="text-foreground m-0 font-medium">
                      {t('admin.access.mfa.audit.require')}
                    </p>
                    <p className="text-foreground-muted m-0 mt-1">
                      {formatWhen(event.at, locale)}
                      {event.subject ? ` · ${event.subject}` : ''}
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
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null);
        }}
        titleKey={actionTarget?.titleKey ?? 'admin.mfa.policy.dialog.require'}
        confirmKey={actionTarget?.confirmKey ?? 'admin.access.mfa.action.require'}
        destructive={actionTarget?.destructive ?? false}
        loading={actionLoading}
        summary={
          actionTarget ? (
            <p className="text-foreground m-0 whitespace-pre-line">
              {policySummary(actionTarget.row, t)}
            </p>
          ) : undefined
        }
        onSubmit={handleActionSubmit}
      />
    </div>
  );
}
