import { useEffect, useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { X } from 'lucide-react';

import {
  resolvePwaInstallBannerPosition,
  resolvePwaInstallBannerVisible,
} from '@/domain/notifications-pwa-display-contract';
import {
  consumePwaInstallBannerNudge,
  dismissPwaInstallPrompt,
  isPwaInstallDismissed,
  markPwaInstallBannerSessionShown,
  shouldShowPwaInstallBanner,
} from '@/features/pwa/pwa-install';
import { useInstallPrompt } from '@/features/pwa/install-prompt-context';
import { peekAuthLoginPwaNudge, clearAuthLoginPwaNudge } from '@/lib/pwa-auth-nudge';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';
import { shouldMountAppShell } from '@/product/shell/shell-route-matchers';

/** Contextual install banner — session cap · 7-day dismiss (§25.10). */
export function PwaInstallBanner() {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isInstalled } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasAuthNudge = peekAuthLoginPwaNudge();
    const hasContextNudge = hasAuthNudge || consumePwaInstallBannerNudge();

    if (
      !resolvePwaInstallBannerVisible({
        pathname,
        isInstalled,
        isDismissed: isPwaInstallDismissed(),
      })
    ) {
      setVisible(false);
      return;
    }

    if (!shouldShowPwaInstallBanner({ hasContextNudge })) {
      setVisible(false);
      return;
    }

    if (hasAuthNudge) {
      clearAuthLoginPwaNudge();
    }

    markPwaInstallBannerSessionShown();
    setVisible(true);
  }, [pathname, isInstalled]);

  if (!visible) return null;

  const handleDismiss = () => {
    dismissPwaInstallPrompt();
    setVisible(false);
  };

  const position = resolvePwaInstallBannerPosition(shouldMountAppShell(pathname));

  return (
    <aside
      className={cn(
        'border-accent/25 bg-surface-overlay/95 supports-backdrop-filter:bg-surface-overlay/80',
        'fixed inset-x-0 z-40 border-t px-4 py-3 backdrop-blur-sm',
        position === 'above-bottom-nav'
          ? 'bottom-[calc(var(--ds-shell-bottomnav-height)+env(safe-area-inset-bottom,0px))]'
          : 'bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]',
        'lg:bottom-4 lg:mx-auto lg:max-w-md lg:rounded-lg lg:border lg:shadow-overlay',
      )}
      data-testid="pwa-install-banner"
      data-position={position}
      aria-label={t('pwa.banner.title')}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-foreground m-0 text-sm font-medium">{t('pwa.banner.title')}</p>
          <p className="text-foreground-muted m-0 mt-0.5 text-xs leading-relaxed">
            {t('pwa.banner.guide')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/install"
            className={buttonVariants({ variant: 'primary', size: 'sm' })}
            data-testid="pwa-install-banner-cta"
          >
            {t('pwa.banner.cta')}
          </Link>
          <button
            type="button"
            className="text-foreground-muted hover:text-foreground rounded-(--ds-radius-sm) p-1.5 transition-colors"
            aria-label={t('pwa.banner.dismiss')}
            data-testid="pwa-install-banner-dismiss"
            onClick={handleDismiss}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}
