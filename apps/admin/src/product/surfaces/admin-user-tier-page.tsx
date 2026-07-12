import { useState } from 'react';

import { Link } from '@tanstack/react-router';
import { ArrowLeft, RefreshCw } from 'lucide-react';

import { useAdminOperatorRbac } from '@/hooks/admin/useAdminOperatorRbac';
import { useAdminUserTierDesk } from '@/hooks/admin/useAdminUserTierDesk';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { ADMIN_EARN_VIP_TIERS, type AdminEarnVipTier } from '@/product/bridge/parse-admin-tiers-desk';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Input } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';
import { StatusBadge } from '@/product/primitives/status-badge';
import { AdminQueueActionDialog } from '@/product/surfaces/admin-queue-action-dialog';
import { ADMIN_RBAC_DENIED_KEY, adminRbacActionProps } from '@/product/surfaces/admin-rbac-action';

const TIER_LABEL_KEYS = {
  bronze: 'admin.tiers.tier.bronze',
  silver: 'admin.tiers.tier.silver',
  gold: 'admin.tiers.tier.gold',
  platinum: 'admin.tiers.tier.platinum',
  diamond: 'admin.tiers.tier.diamond',
  prime_elite: 'admin.tiers.tier.prime_elite',
} as const;

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

/** Member earn tier drill-down (`/users/$userId/tier`) — owner write via reason dialog (M-12). */
export function AdminUserTierPage({ userId }: { userId: string }) {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';
  const { can } = useAdminOperatorRbac();
  const canWriteTier = can('users.tier.write');
  const rbacDenied = t(ADMIN_RBAC_DENIED_KEY);
  const { snapshot, isLoading, isError, refresh, writeUiUnlocked, setUserTier, isSaving } =
    useAdminUserTierDesk(userId);
  const [refreshing, setRefreshing] = useState(false);
  const [draftTier, setDraftTier] = useState<AdminEarnVipTier | ''>('');
  const [draftXp, setDraftXp] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const writeEnabled = writeUiUnlocked && canWriteTier;
  const selectedTier = (draftTier || snapshot?.tier || '') as AdminEarnVipTier | '';

  const handleSubmit = async (reason: string): Promise<boolean> => {
    if (!writeEnabled || !selectedTier) return false;
    const xpRaw = draftXp.trim();
    const xp =
      xpRaw.length === 0
        ? null
        : Number.isFinite(Number(xpRaw))
          ? Math.trunc(Number(xpRaw))
          : null;
    if (xpRaw.length > 0 && xp === null) return false;
    try {
      await setUserTier({
        tier: selectedTier,
        reason,
        xp,
      });
      setDialogOpen(false);
      setDraftTier('');
      setDraftXp('');
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Link
            to="/users"
            className="text-accent inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t('admin.userTier.back')}
          </Link>
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">
            {t('admin.userTier.title')}
          </h2>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {isLoading
              ? t('admin.userTier.summary.loading')
              : t('admin.userTier.summary.member', {
                  name: snapshot?.displayName ?? '—',
                  email: snapshot?.emailMasked ?? '—',
                })}
          </p>
          <p className="text-foreground-muted m-0 text-sm">{t('admin.userTier.description')}</p>
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
        persistenceId="admin-user-tier"
        titleKey="admin.help.userTier.title"
        stepKeys={[
          'admin.help.userTier.step1',
          'admin.help.userTier.step2',
          'admin.help.userTier.step3',
        ]}
      />

      {isError ? (
        <EmptyState
          title={t('admin.userTier.error.title')}
          description={t('admin.userTier.error.body')}
          actionLabel={t('admin.overview.action.refresh')}
          onAction={() => void handleRefresh()}
        />
      ) : isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !snapshot?.tier ? (
        <EmptyState
          title={t('admin.userTier.empty.title')}
          description={t('admin.userTier.empty.body')}
          actionLabel={t('admin.userTier.back')}
          onAction={() => {
            goTo('/users');
          }}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.userTier.card.title')}</CardTitle>
              <CardDescription>{snapshot.userId}</CardDescription>
            </CardHeader>
            <div className="border-line grid gap-4 border-t px-6 py-5 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
                  {t('admin.userTier.col.tier')}
                </p>
                <StatusBadge
                  state="settled"
                  label={snapshot.tierLabelKey ? t(snapshot.tierLabelKey) : '—'}
                />
              </div>
              <div className="space-y-1">
                <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
                  {t('admin.userTier.col.xp')}
                </p>
                <p className="text-foreground m-0 text-lg font-semibold tabular-nums">
                  {snapshot.xp ?? '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
                  {t('admin.userTier.col.updated')}
                </p>
                <p className="text-foreground m-0 text-sm tabular-nums">
                  {formatWhen(snapshot.updatedAt, locale)}
                </p>
              </div>
            </div>
          </Card>

          {writeUiUnlocked ? (
            <Card data-testid="admin-user-tier-write">
              <CardHeader>
                <CardTitle>{t('admin.userTier.write.title')}</CardTitle>
                <CardDescription>{t('admin.userTier.write.description')}</CardDescription>
              </CardHeader>
              <div className="border-line flex flex-col gap-4 border-t px-6 py-5 sm:flex-row sm:items-end">
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                  <span className="text-foreground-muted text-xs font-medium">
                    {t('admin.userTier.col.tier')}
                  </span>
                  <select
                    className="border-line bg-surface text-foreground rounded-md border px-3 py-2"
                    value={selectedTier}
                    disabled={!writeEnabled || isSaving}
                    data-testid="admin-user-tier-select"
                    onChange={(event) => setDraftTier(event.target.value as AdminEarnVipTier)}
                  >
                    {ADMIN_EARN_VIP_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {t(TIER_LABEL_KEYS[tier])}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-32 flex-col gap-1 text-sm">
                  <span className="text-foreground-muted text-xs font-medium">
                    {t('admin.userTier.col.xp')}
                  </span>
                  <Input
                    value={draftXp}
                    onChange={(event) => setDraftXp(event.target.value)}
                    placeholder={String(snapshot.xp ?? '')}
                    disabled={!writeEnabled || isSaving}
                    inputMode="numeric"
                    data-testid="admin-user-tier-xp"
                  />
                </label>
                <Button
                  variant="primary"
                  size="md"
                  loading={isSaving}
                  {...adminRbacActionProps(writeEnabled, rbacDenied)}
                  onClick={() => setDialogOpen(true)}
                  data-testid="admin-user-tier-submit"
                >
                  {t('admin.userTier.action.set')}
                </Button>
              </div>
            </Card>
          ) : null}
        </>
      )}

      <AdminQueueActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        titleKey="admin.userTier.dialog.set.title"
        confirmKey="admin.userTier.action.set"
        summary={
          selectedTier
            ? `${t(TIER_LABEL_KEYS[selectedTier])}${draftXp.trim() ? ` · XP ${draftXp.trim()}` : ''}`
            : undefined
        }
        loading={isSaving}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
