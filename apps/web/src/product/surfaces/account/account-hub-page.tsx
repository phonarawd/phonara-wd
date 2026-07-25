import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Crown, IdCard, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  ACCOUNT_HUB_SEO_DESCRIPTION_KEY,
  ACCOUNT_HUB_SEO_TITLE_KEY,
  ACCOUNT_HUB_NOTIFICATION_PREF_KEYS,
  NOTIFICATIONS_SETTINGS_ROUTE,
  resolveAccountHubGroupLabelKey,
  resolveNotificationPrefHintKey,
  resolveNotificationPrefLabelKey,
  type AccountHubNavGroup,
  type AccountHubNavItem,
} from '@/domain/account-hub-display-contract';
import { useAccountHubController } from '@/features/account/use-account-hub-controller';
import { useI18n } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { Switch } from '@/product/primitives/switch';
import { cn } from '@/product/primitives/lib/cn';

const HUB_GROUP_ORDER: readonly AccountHubNavGroup[] = ['profile', 'money', 'help'] as const;

const NAV_ITEM_ICONS: Readonly<Record<string, LucideIcon>> = {
  profile: UserRound,
  kyc: IdCard,
  'responsible-gaming': ShieldCheck,
  security: ShieldCheck,
  wallet: Wallet,
};

function AccountHubLoadingShell() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-ds-8 py-4 md:py-6"
      data-testid="account-hub-loading"
    >
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

function AccountHubNavLink({
  item,
  t,
}: {
  item: AccountHubNavItem;
  t: ReturnType<typeof useAccountHubController>['t'];
}) {
  const Icon = NAV_ITEM_ICONS[item.id] ?? ChevronRight;

  return (
    <Link
      to={item.route}
      className="border-line hover:bg-surface-raised flex items-center gap-3 rounded-(--ds-radius-md) border px-3 py-3 transition-colors"
      data-testid={`account-hub-link-${item.id}`}
    >
      <span
        className="bg-accent/10 text-accent flex size-9 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="text-foreground text-sm font-semibold">{t(item.labelKey)}</span>
        {item.hintKey ? (
          <span className="text-foreground-muted text-xs leading-relaxed">{t(item.hintKey)}</span>
        ) : null}
      </span>
      <ChevronRight className="text-foreground-muted size-4 shrink-0" aria-hidden />
    </Link>
  );
}

function AccountHubToggleRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  hint?: string | null;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div
      className="flex items-start justify-between gap-3 py-2"
      data-testid={`account-hub-toggle-${id}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <label htmlFor={`account-hub-switch-${id}`} className="text-foreground text-sm font-medium">
          {label}
        </label>
        {hint ? <p className="text-foreground-muted m-0 text-xs leading-relaxed">{hint}</p> : null}
      </div>
      <Switch
        id={`account-hub-switch-${id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}

function formatJoinedDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/** Canonical `/account` hub — profile · KYC · RG · TopBar avatar target (P8). */
export function AccountHubPage() {
  const { locale } = useI18n();
  const engine = useAccountHubController();
  const {
    t,
    loading,
    error,
    displayLabel,
    email,
    avatarInitial,
    joinedAt,
    tierProgress,
    tierColorVar,
    qualifiedReferrals,
    navByGroup,
    notificationPrefs,
    logoutBusy,
    deleteBusy,
    setNotificationPref,
    handleLogout,
    handleDeleteAccount,
  } = engine;

  useEffect(() => {
    document.title = t(ACCOUNT_HUB_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return <AccountHubLoadingShell />;
  }

  if (error) {
    return (
      <div
        className="border-danger/30 bg-surface mx-auto flex w-full max-w-2xl flex-col items-start gap-3 rounded-(--ds-radius-lg) border p-4 py-4 md:py-6"
        data-testid="account-hub-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(error)}</p>
      </div>
    );
  }

  const joinedLabel = formatJoinedDate(joinedAt, locale);

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-ds-8 py-4 md:py-6"
      data-testid="account-hub-page"
    >
      <header className="flex flex-col gap-3">
        <p className="text-foreground-muted m-0 text-xs font-semibold tracking-wide uppercase">
          {t('account.hub.eyebrow')}
        </p>
        <div className="flex items-start gap-4">
          <span
            className="bg-accent text-accent-foreground inline-flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold"
            aria-hidden
            data-testid="account-hub-avatar"
          >
            {avatarInitial}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
                {displayLabel || t('shell.account.guest')}
              </h1>
              {tierProgress && tierColorVar ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                  style={{
                    background: `color-mix(in oklch, var(${tierColorVar}) 18%, transparent)`,
                    color: `var(${tierColorVar})`,
                  }}
                  data-testid="account-hub-tier-badge"
                >
                  <Crown className="size-4" aria-hidden />
                  {t(`earn.tier.${tierProgress.tier}`)}
                </span>
              ) : null}
            </div>
            <p className="text-foreground-muted m-0 text-sm">{email}</p>
            {qualifiedReferrals > 0 ? (
              <p
                className="text-foreground-muted m-0 text-xs"
                data-testid="account-hub-referral-progress"
              >
                {t('account.hub.referralProgress', { count: qualifiedReferrals })}
              </p>
            ) : null}
            <p className="text-foreground-muted m-0 text-sm leading-relaxed">
              {t(ACCOUNT_HUB_SEO_DESCRIPTION_KEY)}
            </p>
          </div>
        </div>
      </header>

      <Card data-testid="account-hub-stats-card">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
              {t('account.stat.points')}
            </p>
            <p className="text-foreground m-0 text-lg font-semibold tabular-nums">
              {tierProgress?.xp.toLocaleString() ?? '—'}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
              {t('nav.referral')}
            </p>
            <p className="text-foreground m-0 text-lg font-semibold tabular-nums">
              {qualifiedReferrals}
            </p>
          </div>
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
              {t('account.stat.joinedAt')}
            </p>
            <p className="text-foreground m-0 text-sm font-medium">{joinedLabel ?? '—'}</p>
          </div>
        </CardBody>
      </Card>

      {HUB_GROUP_ORDER.map((group) => {
        const items = navByGroup[group];
        if (items.length === 0) return null;

        return (
          <section
            key={group}
            className="flex flex-col gap-3"
            data-testid={`account-hub-group-${group}`}
          >
            <h2 className="text-foreground-muted m-0 text-xs font-semibold tracking-wide uppercase">
              {t(resolveAccountHubGroupLabelKey(group))}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <AccountHubNavLink key={item.id} item={item} t={t} />
              ))}
            </div>
          </section>
        );
      })}

      <Card data-testid="account-hub-notifications-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('account.notifications.quick.title')}</CardTitle>
          <CardDescription>{t('account.notifications.quick.body')}</CardDescription>
        </CardHeader>
        <CardBody className="flex flex-col gap-1 pt-0">
          {ACCOUNT_HUB_NOTIFICATION_PREF_KEYS.map((key) => (
            <AccountHubToggleRow
              key={key}
              id={key}
              label={t(resolveNotificationPrefLabelKey(key))}
              hint={
                resolveNotificationPrefHintKey(key) ? t(resolveNotificationPrefHintKey(key)!) : null
              }
              checked={notificationPrefs[key]}
              onCheckedChange={(checked) => setNotificationPref(key, checked)}
            />
          ))}
          <Link
            to={NOTIFICATIONS_SETTINGS_ROUTE}
            className="text-accent mt-2 text-sm font-medium underline-offset-4 hover:underline"
            data-testid="account-hub-notifications-settings"
          >
            {t('account.notifications.quick.settings')}
          </Link>
        </CardBody>
      </Card>

      <Card data-testid="account-hub-danger-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('account.section.danger')}</CardTitle>
          <CardDescription>{t('account.hub.danger.body')}</CardDescription>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 pt-0">
          <Button
            type="button"
            variant="outline"
            size="md"
            className={cn('w-full sm:w-auto')}
            loading={logoutBusy}
            disabled={logoutBusy || deleteBusy}
            onClick={() => void handleLogout()}
            data-testid="account-hub-logout"
          >
            {t('account.action.logout')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className={cn('text-danger w-full sm:w-auto')}
            loading={deleteBusy}
            disabled={logoutBusy || deleteBusy}
            onClick={() => void handleDeleteAccount()}
            data-testid="account-hub-delete"
          >
            {t('account.action.deleteAccount')}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
