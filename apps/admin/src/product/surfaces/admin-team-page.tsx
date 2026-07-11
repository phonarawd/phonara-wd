import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  ADMIN_TEAM_ROLE_LABEL_KEYS,
  type AdminTeamRole,
} from '@/domain/admin-beginner-language-display-contract';
import { canAccessAdminTeamDesk } from '@/domain/admin-team-desk-display-contract';
import type { AdminTeamGrantableRole } from '@/domain/admin-team-desk-display-contract';
import {
  useAdminTeamDesk,
  type AdminTeamGrantRow,
} from '@/hooks/admin/useAdminTeamDesk';
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

type TeamActionKind = 'grant' | 'change' | 'revoke';

type TeamActionTarget = {
  kind: TeamActionKind;
  row?: AdminTeamGrantRow;
  userId: string;
  role: AdminTeamGrantableRole;
  enabled: boolean;
  titleKey: MessageKey;
  confirmKey: MessageKey;
  destructive: boolean;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function enabledStatusState(enabled: boolean): MoneyStatusState {
  return enabled ? 'settled' : 'halted';
}

function roleLabelKey(role: string): MessageKey {
  if (role in ADMIN_TEAM_ROLE_LABEL_KEYS) {
    return ADMIN_TEAM_ROLE_LABEL_KEYS[role as AdminTeamRole] as MessageKey;
  }
  return 'admin.access.role.operator.label';
}

function actionSummary(
  target: TeamActionTarget,
  t: ReturnType<typeof useT>,
): string {
  const email = target.row?.email ?? target.userId;
  const role = t(roleLabelKey(target.role));
  const next = target.enabled
    ? t('admin.team.state.enabled')
    : t('admin.team.state.disabled');
  return [
    `${t('admin.team.col.email')}: ${email}`,
    `${t('admin.team.col.role')}: ${role}`,
    `${t('admin.team.summary.next')}: ${next}`,
  ].join('\n');
}

/** Canonical admin `/team` — staff role grants · `rpc_admin_set_role_grant` (§29.2 R3 · owner). */
export function AdminTeamPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';
  const { role, can } = useAdminOperatorRbac();
  const allowed = canAccessAdminTeamDesk(role) && can('access.rbac.manage');

  const {
    grants,
    filteredGrants,
    filters,
    setFilters,
    grantableRoles,
    loading,
    isError,
    busy,
    auditEvents,
    refresh,
    setRoleGrant,
    canRevoke,
    canChangeRole,
  } = useAdminTeamDesk();

  const [refreshing, setRefreshing] = useState(false);
  const [actionTarget, setActionTarget] = useState<TeamActionTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [roleSelectNonce, setRoleSelectNonce] = useState(0);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantRole, setGrantRole] = useState<AdminTeamGrantableRole>('viewer');
  const [grantUserError, setGrantUserError] = useState(false);

  const enabledCount = useMemo(() => grants.filter((row) => row.enabled).length, [grants]);

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
      await setRoleGrant({
        userId: actionTarget.userId,
        role: actionTarget.role,
        enabled: actionTarget.enabled,
        reason,
      });
      if (actionTarget.kind === 'grant') {
        setGrantUserId('');
        setGrantUserError(false);
      }
      return true;
    } catch {
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const openGrantDialog = () => {
    const trimmed = grantUserId.trim();
    if (!UUID_RE.test(trimmed)) {
      setGrantUserError(true);
      return;
    }
    setGrantUserError(false);
    setActionTarget({
      kind: 'grant',
      userId: trimmed,
      role: grantRole,
      enabled: true,
      titleKey: 'admin.team.dialog.grant',
      confirmKey: 'admin.team.action.grant',
      destructive: false,
    });
  };

  if (!allowed) {
    return (
      <div className="flex flex-col gap-6" data-testid="admin-team-page-forbidden">
        <EmptyState
          title={t('admin.team.forbidden.title')}
          description={t('admin.team.forbidden.body')}
          actionLabel={t('admin.nav.settings')}
          onAction={() => {
            goTo('/settings');
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid="admin-team-page">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.team')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {loading
              ? t('admin.team.summary.loading')
              : t('admin.team.summary.members', { count: String(grants.length) })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.team.subtitle')}</p>
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
        persistenceId="admin-team"
        titleKey="admin.help.team.title"
        stepKeys={[
          'admin.help.team.step1',
          'admin.help.team.step2',
          'admin.help.team.step3',
        ]}
      />

      {isError ? (
        <EmptyState
          title={t('admin.team.error.title')}
          description={t('admin.team.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <>
          <section
            className="border-line bg-surface-raised space-y-3 rounded-lg border p-4"
            data-testid="admin-team-grant-form"
          >
            <h3 className="text-foreground m-0 text-base font-semibold">
              {t('admin.team.grant.title')}
            </h3>
            <p className="text-foreground-muted m-0 text-sm">{t('admin.team.grant.hint')}</p>
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
              <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-sm">
                <span className="text-foreground-muted">{t('admin.team.grant.userId')}</span>
                <Input
                  value={grantUserId}
                  onChange={(event) => {
                    setGrantUserId(event.target.value);
                    setGrantUserError(false);
                  }}
                  placeholder={t('admin.team.grant.userId.placeholder')}
                  aria-invalid={grantUserError}
                  data-testid="admin-team-grant-user-id"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-foreground-muted">{t('admin.team.col.role')}</span>
                <select
                  className="border-line bg-surface text-foreground rounded-md border px-3 py-2"
                  value={grantRole}
                  onChange={(event) =>
                    setGrantRole(event.target.value as AdminTeamGrantableRole)
                  }
                  data-testid="admin-team-grant-role"
                >
                  {grantableRoles.map((key) => (
                    <option key={key} value={key}>
                      {t(roleLabelKey(key))}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                size="md"
                variant="primary"
                disabled={busy}
                data-testid="admin-team-grant-submit"
                onClick={openGrantDialog}
              >
                {t('admin.team.action.grant')}
              </Button>
            </div>
            {grantUserError ? (
              <p className="text-danger m-0 text-sm" role="alert">
                {t('admin.team.grant.userId.invalid')}
              </p>
            ) : null}
          </section>

          <p className="text-foreground-muted m-0 text-sm">
            {t('admin.team.summary.enabled', { count: String(enabledCount) })}
          </p>

          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
            <Input
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder={t('admin.team.search.placeholder')}
              aria-label={t('admin.team.search.placeholder')}
              className="max-w-md"
            />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground-muted">{t('admin.team.col.role')}</span>
              <select
                className="border-line bg-surface text-foreground rounded-md border px-3 py-2"
                value={filters.role}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    role: event.target.value as AdminTeamGrantableRole | 'all',
                  }))
                }
              >
                <option value="all">{t('admin.team.role.all')}</option>
                {grantableRoles.map((key) => (
                  <option key={key} value={key}>
                    {t(roleLabelKey(key))}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground-muted">{t('admin.team.col.status')}</span>
              <select
                className="border-line bg-surface text-foreground rounded-md border px-3 py-2"
                value={filters.enabled}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    enabled: event.target.value as 'all' | 'on' | 'off',
                  }))
                }
              >
                <option value="all">{t('admin.team.enabled.all')}</option>
                <option value="on">{t('admin.team.state.enabled')}</option>
                <option value="off">{t('admin.team.state.disabled')}</option>
              </select>
            </label>
          </div>

          <AdminTable
            columns={[
              {
                id: 'email',
                header: t('admin.team.col.email'),
                cell: ({ row }) => row.email,
              },
              {
                id: 'role',
                header: t('admin.team.col.role'),
                cell: ({ row }) => t(roleLabelKey(row.role)),
              },
              {
                id: 'status',
                header: t('admin.team.col.status'),
                cell: ({ row }) => (
                  <StatusBadge
                    state={enabledStatusState(row.enabled)}
                    label={
                      row.enabled
                        ? t('admin.team.state.enabled')
                        : t('admin.team.state.disabled')
                    }
                  />
                ),
              },
              {
                id: 'updated',
                header: t('admin.team.col.updated'),
                cell: ({ row }) => formatWhen(row.updatedAt, locale),
                meta: { className: 'text-foreground-muted' },
              },
            ]}
            rows={filteredGrants}
            getRowId={(row) => row.id}
            loading={loading}
            loadingRowCount={6}
            minWidth={760}
            empty={
              <EmptyState
                title={t('admin.team.empty.title')}
                description={t('admin.team.empty.body')}
                actionLabel={t('admin.team.filter.reset')}
                onAction={() => setFilters({ search: '', role: 'all', enabled: 'all' })}
              />
            }
            rowActionsHeader={t('admin.team.col.action')}
            rowActions={(row) => (
              <>
                {canChangeRole(row) ? (
                  <label className="flex items-center gap-2 text-sm">
                    <span className="sr-only">{t('admin.team.action.change')}</span>
                    <select
                      key={`${row.id}-${row.role}-${roleSelectNonce}`}
                      className="border-line bg-surface text-foreground rounded-md border px-2 py-1"
                      defaultValue={
                        grantableRoles.includes(row.role as AdminTeamGrantableRole)
                          ? row.role
                          : 'viewer'
                      }
                      disabled={busy}
                      data-testid={`admin-team-change-role-${row.userId}`}
                      onChange={(event) => {
                        const nextRole = event.target.value as AdminTeamGrantableRole;
                        if (nextRole === row.role) return;
                        setActionTarget({
                          kind: 'change',
                          row,
                          userId: row.userId,
                          role: nextRole,
                          enabled: true,
                          titleKey: 'admin.team.dialog.change',
                          confirmKey: 'admin.team.action.change',
                          destructive: false,
                        });
                      }}
                    >
                      {grantableRoles.map((key) => (
                        <option key={key} value={key}>
                          {t(roleLabelKey(key))}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {canRevoke(row) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    data-testid={`admin-team-revoke-${row.userId}`}
                    onClick={() =>
                      setActionTarget({
                        kind: 'revoke',
                        row,
                        userId: row.userId,
                        role: (grantableRoles.includes(row.role as AdminTeamGrantableRole)
                          ? row.role
                          : 'viewer') as AdminTeamGrantableRole,
                        enabled: false,
                        titleKey: 'admin.team.dialog.revoke',
                        confirmKey: 'admin.team.action.revoke',
                        destructive: true,
                      })
                    }
                  >
                    {t('admin.team.action.revoke')}
                  </Button>
                ) : null}
              </>
            )}
          />

          {auditEvents.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-foreground m-0 text-base font-semibold">
                {t('admin.team.audit.title')}
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {auditEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-md border border-line bg-surface-raised px-4 py-3 text-sm"
                  >
                    <p className="text-foreground m-0 font-medium">
                      {t(event.actionKey as MessageKey)}
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
          if (!open) {
            setActionTarget(null);
            setRoleSelectNonce((n) => n + 1);
          }
        }}
        titleKey={actionTarget?.titleKey ?? 'admin.team.dialog.grant'}
        confirmKey={actionTarget?.confirmKey ?? 'admin.team.action.grant'}
        destructive={actionTarget?.destructive ?? false}
        loading={actionLoading}
        summary={
          actionTarget ? (
            <p className="text-foreground m-0 whitespace-pre-line">
              {actionSummary(actionTarget, t)}
            </p>
          ) : undefined
        }
        onSubmit={handleActionSubmit}
      />
    </div>
  );
}
