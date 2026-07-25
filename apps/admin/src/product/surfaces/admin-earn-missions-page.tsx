import { useState } from 'react';

import { RefreshCw } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import { useAdminMissionsDesk } from '@/hooks/admin/useAdminMissionsDesk';
import { formatAdminMoney } from '@/lib/format-admin-money';
import type {
  AdminEarnLimitRow,
  AdminViralMissionRow,
  MissionExposure,
} from '@/product/bridge/parse-admin-missions-config';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { AdminTable } from '@/product/primitives/admin-table';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { StatusBadge, type MoneyStatusState } from '@/product/primitives/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';

function exposureStatus(exposure: AdminViralMissionRow['exposure']): MoneyStatusState {
  if (exposure === 'live') return 'settled';
  return 'halted';
}

function exposureLabelKey(exposure: AdminViralMissionRow['exposure']): MessageKey {
  if (exposure === 'live') return 'admin.missions.exposure.live';
  return 'admin.missions.exposure.hidden';
}

type EditDraft =
  | {
      kind: 'viral';
      row: AdminViralMissionRow;
      rewardPhon: string;
      quota: string;
      extraValue: string;
      exposure: MissionExposure;
    }
  | {
      kind: 'earn';
      row: AdminEarnLimitRow;
      value: string;
    };

type ConfirmTarget =
  | {
      kind: 'exposure';
      catalogKey: string;
      exposure: MissionExposure;
      titleKey: MessageKey;
      confirmKey: MessageKey;
      summaryKey: MessageKey;
      summaryValues: Record<string, string>;
    }
  | {
      kind: 'viral_values';
      catalogKey: string;
      value: string;
      quotaValue: string;
      extraValue?: string;
      titleKey: MessageKey;
      confirmKey: MessageKey;
      summaryKey: MessageKey;
      summaryValues: Record<string, string>;
    }
  | {
      kind: 'earn_value';
      catalogKey: string;
      value: string;
      titleKey: MessageKey;
      confirmKey: MessageKey;
      summaryKey: MessageKey;
      summaryValues: Record<string, string>;
    };

/** Admin missions desk (`/earn/missions`) — catalog list RPC · write UI = E2 GATE unlocked. */
export function AdminEarnMissionsPage() {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const {
    earnLimits,
    viralMissions,
    isLoading,
    isError,
    isSaving,
    writeUiUnlocked,
    refresh,
    upsertMission,
  } = useAdminMissionsDesk();
  const [refreshing, setRefreshing] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const liveCount = viralMissions.filter((row) => row.exposure === 'live').length;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const openExposureConfirm = (row: AdminViralMissionRow) => {
    const next: MissionExposure = row.exposure === 'live' ? 'hidden' : 'live';
    setConfirmTarget({
      kind: 'exposure',
      catalogKey: row.catalogKey,
      exposure: next,
      titleKey: next === 'hidden' ? 'admin.missions.dialog.hide' : 'admin.missions.dialog.show',
      confirmKey: next === 'hidden' ? 'admin.missions.action.hide' : 'admin.missions.action.show',
      summaryKey: 'admin.missions.dialog.summary.exposure',
      summaryValues: {
        mission: t(row.labelKey),
        exposure: t(exposureLabelKey(next)),
      },
    });
  };

  const openViralEditConfirm = () => {
    if (!editDraft || editDraft.kind !== 'viral') return;
    const { row, rewardPhon, quota, extraValue, exposure } = editDraft;
    setConfirmTarget({
      kind: 'viral_values',
      catalogKey: row.catalogKey,
      value: rewardPhon.trim(),
      quotaValue: quota.trim(),
      extraValue: row.extraLabelKey ? extraValue.trim() : undefined,
      titleKey: 'admin.missions.dialog.editViral',
      confirmKey: 'admin.missions.action.save',
      summaryKey: 'admin.missions.dialog.summary.viral',
      summaryValues: {
        mission: t(row.labelKey),
        reward: rewardPhon.trim(),
        quota: quota.trim(),
        exposure: t(exposureLabelKey(exposure)),
      },
    });
  };

  const openEarnEditConfirm = () => {
    if (!editDraft || editDraft.kind !== 'earn') return;
    const { row, value } = editDraft;
    setConfirmTarget({
      kind: 'earn_value',
      catalogKey: row.catalogKey,
      value: value.trim(),
      titleKey: 'admin.missions.dialog.editEarn',
      confirmKey: 'admin.missions.action.save',
      summaryKey: 'admin.missions.dialog.summary.earn',
      summaryValues: {
        setting: t(row.labelKey),
        value: value.trim(),
      },
    });
  };

  const handleConfirmSubmit = async (reason: string): Promise<boolean> => {
    if (!confirmTarget) return false;
    setActionError(null);
    try {
      if (confirmTarget.kind === 'exposure') {
        await upsertMission({
          catalogKey: confirmTarget.catalogKey,
          reason,
          exposure: confirmTarget.exposure,
        });
      } else if (confirmTarget.kind === 'viral_values') {
        await upsertMission({
          catalogKey: confirmTarget.catalogKey,
          reason,
          value: confirmTarget.value,
          quotaValue: confirmTarget.quotaValue,
          extraValue: confirmTarget.extraValue,
        });
      } else {
        await upsertMission({
          catalogKey: confirmTarget.catalogKey,
          reason,
          value: confirmTarget.value,
        });
      }
      setEditDraft(null);
      setConfirmTarget(null);
      return true;
    } catch {
      setActionError(t('admin.missions.write.error'));
      return false;
    }
  };

  return (
    <div className="flex flex-col gap-ds-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.nav.missions')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {isLoading
              ? t('admin.missions.summary.loading')
              : t('admin.missions.summary.config', { count: String(earnLimits.length) })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.missions.description')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="md"
            loading={refreshing}
            onClick={() => void handleRefresh()}
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} aria-hidden />
            {t('admin.overview.action.refresh')}
          </Button>
        </div>
      </section>

      <HowItWorks
        persistenceId="admin-earn-missions"
        titleKey="admin.help.missions.title"
        stepKeys={[
          'admin.help.missions.step1',
          'admin.help.missions.step2',
          'admin.help.missions.step3',
        ]}
      />

      {actionError ? (
        <p className="text-danger m-0 text-sm" role="alert">
          {actionError}
        </p>
      ) : null}

      {isError ? (
        <EmptyState
          title={t('admin.missions.error.title')}
          description={t('admin.missions.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : (
        <Tabs defaultValue="viral" className="gap-4">
          <TabsList aria-label={t('admin.missions.tabs.aria')}>
            <TabsTrigger value="viral">
              {t('admin.missions.tab.viral')} ({liveCount})
            </TabsTrigger>
            <TabsTrigger value="limits">{t('admin.missions.tab.limits')}</TabsTrigger>
          </TabsList>

          <TabsContent value="viral" className="space-y-3">
            <AdminTable
              columns={[
                {
                  id: 'mission',
                  header: t('admin.missions.col.mission'),
                  cell: ({ row }) => t(row.labelKey),
                },
                {
                  id: 'reward',
                  header: t('admin.missions.col.reward'),
                  cell: ({ row }) => formatAdminMoney(row.rewardPhon, 'PHON'),
                  meta: { className: 'tabular-nums' },
                },
                {
                  id: 'quota',
                  header: t('admin.missions.col.quota'),
                  cell: ({ row }) => `${row.quota} ${t(row.quotaPeriodKey)}`,
                  meta: { className: 'text-foreground-muted tabular-nums' },
                },
                {
                  id: 'extra',
                  header: t('admin.missions.col.extra'),
                  cell: ({ row }) =>
                    row.extraValue && row.extraLabelKey
                      ? `${row.extraValue} · ${t(row.extraLabelKey)}`
                      : '—',
                  meta: { className: 'text-foreground-muted tabular-nums' },
                },
                {
                  id: 'exposure',
                  header: t('admin.missions.col.exposure'),
                  cell: ({ row }) => (
                    <StatusBadge
                      state={exposureStatus(row.exposure)}
                      label={t(exposureLabelKey(row.exposure))}
                    />
                  ),
                },
              ]}
              rows={viralMissions}
              getRowId={(row) => row.id}
              loading={isLoading}
              loadingRowCount={5}
              minWidth={writeUiUnlocked ? 920 : 760}
              empty={
                <EmptyState
                  title={t('admin.overview.empty.title')}
                  description={t('admin.missions.empty.viral')}
                  actionLabel={t('admin.missions.empty.cta')}
                  onAction={() => goTo('/ops')}
                />
              }
              rowActionsHeader={writeUiUnlocked ? t('admin.missions.col.actions') : undefined}
              rowActions={
                writeUiUnlocked
                  ? (row) => (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSaving}
                          data-testid={`admin-missions-exposure-${row.id}`}
                          onClick={() => openExposureConfirm(row)}
                        >
                          {t(
                            row.exposure === 'live'
                              ? 'admin.missions.action.hide'
                              : 'admin.missions.action.show',
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={isSaving}
                          data-testid={`admin-missions-edit-${row.id}`}
                          onClick={() =>
                            setEditDraft({
                              kind: 'viral',
                              row,
                              rewardPhon: row.rewardPhon,
                              quota: row.quota,
                              extraValue: row.extraValue ?? '',
                              exposure: row.exposure,
                            })
                          }
                        >
                          {t('admin.missions.action.edit')}
                        </Button>
                      </div>
                    )
                  : undefined
              }
            />
          </TabsContent>

          <TabsContent value="limits" className="space-y-3">
            <AdminTable
              columns={[
                {
                  id: 'setting',
                  header: t('admin.missions.col.setting'),
                  cell: ({ row }) => t(row.labelKey),
                },
                {
                  id: 'value',
                  header: t('admin.missions.col.value'),
                  cell: ({ row }) => row.value,
                  meta: { className: 'tabular-nums' },
                },
                {
                  id: 'note',
                  header: t('admin.missions.col.note'),
                  cell: ({ row }) => row.description ?? '—',
                  meta: { className: 'text-foreground-muted' },
                },
              ]}
              rows={earnLimits}
              getRowId={(row) => row.key}
              loading={isLoading}
              loadingRowCount={6}
              minWidth={writeUiUnlocked ? 760 : 640}
              empty={
                <EmptyState
                  title={t('admin.overview.empty.title')}
                  description={t('admin.missions.empty.limits')}
                  actionLabel={t('admin.missions.empty.cta')}
                  onAction={() => goTo('/ops')}
                />
              }
              rowActionsHeader={writeUiUnlocked ? t('admin.missions.col.actions') : undefined}
              rowActions={
                writeUiUnlocked
                  ? (row) => (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isSaving}
                        data-testid={`admin-missions-edit-earn-${row.key}`}
                        onClick={() =>
                          setEditDraft({
                            kind: 'earn',
                            row,
                            value: row.value,
                          })
                        }
                      >
                        {t('admin.missions.action.edit')}
                      </Button>
                    )
                  : undefined
              }
            />
          </TabsContent>
        </Tabs>
      )}

      {editDraft ? (
        <div
          className="rounded-(--ds-radius-md) border border-line bg-surface-raised space-y-3 p-4"
          data-testid="admin-missions-edit-panel"
        >
          <h3 className="text-foreground m-0 text-base font-semibold">
            {t(
              editDraft.kind === 'viral'
                ? 'admin.missions.dialog.editViral'
                : 'admin.missions.dialog.editEarn',
            )}
          </h3>
          {editDraft.kind === 'viral' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-foreground font-medium">
                  {t('admin.missions.col.reward')}
                </span>
                <Input
                  value={editDraft.rewardPhon}
                  onChange={(event) =>
                    setEditDraft({ ...editDraft, rewardPhon: event.target.value })
                  }
                  className="tabular-nums"
                  data-testid="admin-missions-edit-reward"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-foreground font-medium">{t('admin.missions.col.quota')}</span>
                <Input
                  value={editDraft.quota}
                  onChange={(event) => setEditDraft({ ...editDraft, quota: event.target.value })}
                  className="tabular-nums"
                  data-testid="admin-missions-edit-quota"
                />
              </label>
              {editDraft.row.extraLabelKey ? (
                <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                  <span className="text-foreground font-medium">
                    {t(editDraft.row.extraLabelKey)}
                  </span>
                  <Input
                    value={editDraft.extraValue}
                    onChange={(event) =>
                      setEditDraft({ ...editDraft, extraValue: event.target.value })
                    }
                    className="tabular-nums"
                    data-testid="admin-missions-edit-extra"
                  />
                </label>
              ) : null}
            </div>
          ) : (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-foreground font-medium">{t('admin.missions.col.value')}</span>
              <Input
                value={editDraft.value}
                onChange={(event) => setEditDraft({ ...editDraft, value: event.target.value })}
                className="tabular-nums"
                data-testid="admin-missions-edit-value"
              />
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="md" onClick={() => setEditDraft(null)}>
              {t('common.cta.cancel')}
            </Button>
            <Button
              variant="primary"
              size="md"
              data-testid="admin-missions-edit-continue"
              onClick={() => {
                if (editDraft.kind === 'viral') openViralEditConfirm();
                else openEarnEditConfirm();
              }}
            >
              {t('admin.missions.action.continue')}
            </Button>
          </div>
        </div>
      ) : null}

      <AdminQueueActionDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
        titleKey={confirmTarget?.titleKey ?? 'admin.missions.dialog.editViral'}
        confirmKey={confirmTarget?.confirmKey ?? 'admin.missions.action.save'}
        loading={isSaving}
        summary={
          confirmTarget ? (
            <p className="text-foreground m-0 whitespace-pre-line">
              {t(confirmTarget.summaryKey, confirmTarget.summaryValues)}
            </p>
          ) : undefined
        }
        onSubmit={handleConfirmSubmit}
      />
    </div>
  );
}
