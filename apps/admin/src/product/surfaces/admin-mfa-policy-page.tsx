import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  useAdminMfaPolicyDesk,
  type AdminMfaPolicyDeskRow,
  type MfaTierKey,
} from '@/hooks/admin/useAdminMfaPolicyDesk';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';
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
      ) : loading ? (
        <LoadingTable rows={6} cols={5} />
      ) : policies.length === 0 ? (
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

          {filteredPolicies.length === 0 ? (
            <EmptyState
              title={t('admin.access.mfa.empty')}
              description={t('admin.mfa.policy.filter.empty')}
              actionLabel={t('admin.mfa.policy.filter.reset')}
              onAction={() =>
                setFilters({
                  search: '',
                  tierKey: 'all',
                  required: 'all',
                })
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-(--ds-radius-lg) border border-line">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-surface-raised text-foreground-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('admin.access.mfa.col.tier')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.access.mfa.col.required')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.access.mfa.col.grace')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.access.mfa.col.enroll')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.access.mfa.col.updated')}</th>
                    <th className="px-4 py-3 font-medium">{t('admin.access.mfa.col.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolicies.map((row) => {
                    const canRequire = !row.mfaRequired;
                    const canRelax = row.mfaRequired && canRelaxTier(row.tierKey);

                    return (
                      <tr key={row.id} className="border-line border-t">
                        <td className="text-foreground px-4 py-3">
                          {t(TIER_LABEL_KEYS[row.tierKey])}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            state={requiredStatusState(row.mfaRequired)}
                            label={
                              row.mfaRequired
                                ? t('admin.access.mfa.required.on')
                                : t('admin.access.mfa.required.off')
                            }
                          />
                        </td>
                        <td className="text-foreground-muted px-4 py-3 tabular-nums">
                          {row.graceDays}
                        </td>
                        <td className="text-foreground-muted px-4 py-3 tabular-nums">
                          {row.enrollRate}%
                        </td>
                        <td className="text-foreground-muted px-4 py-3">
                          {formatWhen(row.updatedAt, locale)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

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
