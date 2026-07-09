import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Copy, Users } from 'lucide-react';

import {
  SETTINGS_REFERRAL_SEO_DESCRIPTION_KEY,
  SETTINGS_REFERRAL_SEO_TITLE_KEY,
} from '@/domain/settings-referral-display-contract';
import { useSettingsReferralController } from '@/features/settings/use-settings-referral-controller';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

function SettingsReferralLoadingShell() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4 md:py-6"
      data-testid="settings-referral-loading"
    >
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}

/** Canonical `/settings/referral` — referral code read · Link to `/referral/invite` only · Web Share forbidden (P8). */
export function ReferralSettingsPage() {
  const engine = useSettingsReferralController();
  const { t, loading, error, referralCode, inviteRoute, copyReferralCode } = engine;

  useEffect(() => {
    document.title = t(SETTINGS_REFERRAL_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return <SettingsReferralLoadingShell />;
  }

  if (error) {
    return (
      <div
        className="border-danger/30 bg-surface mx-auto flex w-full max-w-2xl flex-col items-start gap-3 rounded-(--ds-radius-lg) border p-4 py-4 md:py-6"
        data-testid="settings-referral-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(error)}</p>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4 md:py-6"
      data-testid="settings-referral-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to="/settings"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="settings-referral-back"
        >
          {t('settings.referral.back')}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('settings.referral.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(SETTINGS_REFERRAL_SEO_DESCRIPTION_KEY)}
          </p>
        </div>
      </header>

      <Card data-testid="settings-referral-code-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <Users className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('settings.referral.codeTitle')}</CardTitle>
            <CardDescription>{t('settings.referral.codeHint')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-0">
          <div className="bg-surface-raised border-line flex flex-col gap-2 rounded-(--ds-radius-md) border px-4 py-3">
            <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
              {t('referral.share.card.codeLabel')}
            </p>
            <p
              className="text-foreground m-0 font-mono text-lg font-semibold tabular-nums break-all"
              data-testid="settings-referral-code"
            >
              {referralCode}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="sm:flex-1"
              onClick={() => void copyReferralCode()}
              data-testid="settings-referral-copy"
            >
              <Copy className="size-4" aria-hidden />
              {t('referral.share.card.copy')}
            </Button>
            <Link
              to={inviteRoute}
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'sm:flex-1')}
              data-testid="settings-referral-invite-link"
            >
              {t('settings.referral.inviteLink')}
            </Link>
          </div>

          <p className="text-foreground-muted m-0 text-xs leading-relaxed">
            {t('settings.referral.shareHint')}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
