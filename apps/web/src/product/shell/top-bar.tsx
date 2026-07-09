import { Link } from '@tanstack/react-router';
import { Bell } from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';
import { resolveAccountAvatarInitial } from '@/domain/account-hub-display-contract';
import {
  NOTIFICATIONS_CENTER_ROUTE,
  resolveNotificationsCenterVisible,
} from '@/domain/notifications-pwa-display-contract';
import { useProfile } from '@/hooks/use-profile';
import { useT } from '@/product/i18n';
import { BrandMark } from '@/product/primitives/brand-mark';
import { cn } from '@/product/primitives/lib/cn';

export type TopBarProps = {
  className?: string;
  title?: string;
};

/** §12.19.5 — 56px · flat mark · avatar 32px · backdrop-filter forbidden. */
export function TopBar({ className, title }: TopBarProps) {
  const t = useT();
  const { session } = useAuth();
  const { profile } = useProfile();
  const displayTitle = title ?? t('brand.wordmark');
  const notificationsVisible = resolveNotificationsCenterVisible();
  const avatarInitial = session
    ? resolveAccountAvatarInitial({
        displayName: profile?.display_name,
        username: profile?.username,
        email: session.user.email,
        guestInitial: t('shell.account.guestInitial'),
      })
    : t('shell.account.guestInitial');

  return (
    <header className={cn('ds-shell-topbar sticky top-0 z-30', className)} data-testid="app-topbar">
      <div className="ds-shell-content-column flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <BrandMark size={20} className="text-accent shrink-0" testId="topbar-brand-mark" />
          <p className="text-foreground m-0 truncate text-base font-semibold">{displayTitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {notificationsVisible ? (
            <Link
              to={NOTIFICATIONS_CENTER_ROUTE}
              className="text-foreground-muted hover:text-foreground inline-flex size-10 items-center justify-center rounded-full transition-colors"
              aria-label={t('shell.topbar.notif')}
              data-testid="topbar-notifications-link"
            >
              <Bell className="size-5" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              className="text-foreground-muted hover:text-foreground inline-flex size-10 items-center justify-center rounded-full transition-colors"
              aria-label={t('shell.topbar.notif')}
              data-testid="topbar-notifications-button"
              disabled
            >
              <Bell className="size-5" aria-hidden />
            </button>
          )}

          {session ? (
            <Link
              to="/account"
              className="bg-accent text-accent-foreground inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold"
              aria-label={t('shell.topbar.avatar')}
              data-testid="topbar-account-avatar"
            >
              {avatarInitial}
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-accent text-sm font-semibold whitespace-nowrap"
              data-testid="topbar-login-link"
            >
              {t('shell.topbar.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
