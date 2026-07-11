import { useState } from 'react';

import { Link } from '@tanstack/react-router';
import { ArrowLeft, RefreshCw } from 'lucide-react';

import { useAdminUserTierDesk } from '@/hooks/admin/useAdminUserTierDesk';
import { useAdminRouteNavigate } from '@/lib/use-admin-route-navigate';
import { useT } from '@/product/i18n';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { Button } from '@/product/primitives/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';
import { StatusBadge } from '@/product/primitives/status-badge';

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

/** Member earn tier drill-down (`/users/$userId/tier`) — read-only (§12.14). */
export function AdminUserTierPage({ userId }: { userId: string }) {
  const t = useT();
  const goTo = useAdminRouteNavigate();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';
  const { snapshot, isLoading, isError, refresh } = useAdminUserTierDesk(userId);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
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
      )}
    </div>
  );
}
