import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell, ChevronRight, Settings2 } from 'lucide-react';

import { useNotificationsPageController } from '@/features/notifications/use-notifications-page-controller';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

function NotificationsLoadingShell() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4"
      data-testid="notifications-loading"
    >
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function resolvePermissionStatusKey(
  permission: ReturnType<typeof useNotificationsPageController>['permission'],
):
  | 'notif.permission.statusDefault'
  | 'notif.permission.statusGranted'
  | 'notif.permission.statusDenied'
  | 'notif.permission.statusUnsupported' {
  if (permission === 'granted') return 'notif.permission.statusGranted';
  if (permission === 'denied') return 'notif.permission.statusDenied';
  if (permission === 'unsupported') return 'notif.permission.statusUnsupported';
  return 'notif.permission.statusDefault';
}

function resolveRelativeTimeLabel(
  iso: string,
  t: ReturnType<typeof useNotificationsPageController>['t'],
): string {
  const created = new Date(iso).getTime();
  if (!Number.isFinite(created)) return iso;
  const diffMs = Date.now() - created;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return t('notifications.time.justNow');
  if (minutes < 60) return t('notifications.time.minutesAgo', { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('notifications.time.hoursAgo', { hours });
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Canonical `/notifications` inbox hub — outbox read · Web Push · prefs handoff (P8). */
export function NotificationsPage() {
  const engine = useNotificationsPageController();
  const {
    t,
    loading,
    errorKey,
    activeTab,
    tabs,
    visibleItems,
    unreadCount,
    readIds,
    settingsRoute,
    permission,
    permissionBusy,
    permissionError,
    webPushSupported,
    setActiveTab,
    markRead,
    markAllRead,
    enablePush,
    refresh,
  } = engine;

  useEffect(() => {
    document.title = t('seo.notifications.title');
  }, [t]);

  if (loading) {
    return <NotificationsLoadingShell />;
  }

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-ds-8 py-4 md:py-6"
      data-testid="notifications-page"
    >
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
              {t('notifications.title')}
            </h1>
            <p className="text-foreground-muted m-0 text-sm leading-relaxed">
              {t('notifications.subtitle')}
            </p>
          </div>
          {unreadCount > 0 ? (
            <span
              className="bg-accent/15 text-accent inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tabular-nums"
              data-testid="notifications-unread-badge"
            >
              {unreadCount}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={settingsRoute}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'inline-flex gap-1.5',
            )}
            data-testid="notifications-settings-link"
          >
            <Settings2 className="size-4" aria-hidden />
            {t('notifications.manageInSettings')}
          </a>
          {visibleItems.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="notifications-mark-all-read"
              onClick={markAllRead}
            >
              {t('notifications.action.markAllRead')}
            </Button>
          ) : null}
        </div>
      </header>

      <Card data-testid="notifications-push-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <Bell className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <CardTitle className="text-base">{t('notif.permission.title')}</CardTitle>
            <p className="text-foreground-muted m-0 text-sm">
              {t(resolvePermissionStatusKey(permission))}
            </p>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 pt-0">
          {permission === 'granted' ? (
            <p className="text-foreground-muted m-0 text-xs">
              {t('notif.permission.consentLinked')}
            </p>
          ) : null}
          {permissionError ? (
            <p className="text-destructive m-0 text-sm" role="alert">
              {t(permissionError)}
            </p>
          ) : null}
          {permission !== 'granted' && webPushSupported ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              disabled={permissionBusy || permission === 'denied'}
              data-testid="notifications-enable-push"
              onClick={() => void enablePush()}
            >
              {t('notif.permission.cta')}
            </Button>
          ) : null}
          {!webPushSupported ? (
            <p className="text-foreground-muted m-0 text-xs">
              {t('notif.permission.statusUnsupported')}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <div
        className="border-line flex flex-wrap gap-2 border-b pb-2"
        role="tablist"
        aria-label={t('notifications.title')}
        data-testid="notifications-tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground-muted hover:text-foreground bg-transparent',
            )}
            data-testid={`notifications-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(`notifications.tab.${tab}`)}
          </button>
        ))}
      </div>

      {errorKey ? (
        <div
          className="border-danger/30 bg-surface flex flex-col items-start gap-3 rounded-(--ds-radius-lg) border p-4"
          data-testid="notifications-error"
          role="alert"
        >
          <p className="text-foreground m-0 text-sm">{t('common.retry')}</p>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      {visibleItems.length === 0 ? (
        <Card data-testid="notifications-empty">
          <CardBody className="flex flex-col gap-2 py-8 text-center">
            <p className="text-foreground m-0 text-base font-semibold">
              {t('notifications.empty.title')}
            </p>
            <p className="text-foreground-muted m-0 text-sm">{t('notifications.empty.desc')}</p>
          </CardBody>
        </Card>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0" data-testid="notifications-list">
          {visibleItems.map((item) => {
            const unread = !readIds.has(item.id);
            const title = item.inlineTitle ?? t(item.titleKey, item.titleValues);
            const body = item.inlineBody ?? t(item.bodyKey, item.bodyValues);

            return (
              <li key={item.id}>
                <Card
                  data-testid={`notifications-item-${item.id}`}
                  className={cn(unread && 'border-accent/40')}
                >
                  <CardBody className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="text-foreground m-0 text-sm font-semibold">{title}</p>
                        <p className="text-foreground-muted m-0 text-sm leading-relaxed">{body}</p>
                      </div>
                      {unread ? (
                        <span
                          className="bg-accent mt-1 size-2 shrink-0 rounded-full"
                          aria-hidden
                          data-testid={`notifications-unread-dot-${item.id}`}
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <time
                        className="text-foreground-muted text-xs tabular-nums"
                        dateTime={item.createdAt}
                      >
                        {resolveRelativeTimeLabel(item.createdAt, t)}
                      </time>
                      <div className="flex flex-wrap items-center gap-2">
                        {unread ? (
                          <button
                            type="button"
                            className="text-accent text-xs font-medium underline-offset-4 hover:underline"
                            onClick={() => markRead(item.id)}
                          >
                            {t('notifications.action.markRead')}
                          </button>
                        ) : null}
                        {item.nextAction ? (
                          <Link
                            to={item.nextAction.route}
                            className="text-accent inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                            onClick={() => markRead(item.id)}
                          >
                            {t(item.nextAction.labelKey)}
                            <ChevronRight className="size-3.5" aria-hidden />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
