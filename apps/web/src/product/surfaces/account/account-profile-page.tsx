import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Crown, UserRound } from 'lucide-react';

import {
  ACCOUNT_PROFILE_BACK_ROUTE,
  ACCOUNT_PROFILE_SEO_DESCRIPTION_KEY,
  ACCOUNT_PROFILE_SEO_TITLE_KEY,
} from '@/domain/account-profile-display-contract';
import { useAccountProfileController } from '@/features/account/use-account-profile-controller';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { Input } from '@/product/primitives/input';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

function AccountProfileLoadingShell() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-ds-8 py-4 md:py-6"
      data-testid="account-profile-loading"
    >
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

/** Canonical `/account/profile` — username/display name edit · VIP badge (P8). */
export function AccountProfilePage() {
  const engine = useAccountProfileController();
  const {
    t,
    loading,
    error,
    email,
    displayLabel,
    tierProgress,
    tierColorVar,
    username,
    setUsername,
    displayName,
    setDisplayName,
    usernameGateKey,
    displayNameGateKey,
    submitBusy,
    profileComplete,
    refresh,
    handleSubmit,
  } = engine;

  useEffect(() => {
    document.title = t(ACCOUNT_PROFILE_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return <AccountProfileLoadingShell />;
  }

  if (error) {
    return (
      <div
        className="border-danger/30 bg-surface mx-auto flex w-full max-w-2xl flex-col items-start gap-3 rounded-(--ds-radius-lg) border p-4 py-4 md:py-6"
        data-testid="account-profile-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(error)}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const submitDisabled = submitBusy || usernameGateKey !== null || displayNameGateKey !== null;

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-ds-8 py-4 md:py-6"
      data-testid="account-profile-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to={ACCOUNT_PROFILE_BACK_ROUTE}
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="account-profile-back"
        >
          {t('account.profile.back')}
        </Link>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
              {t('account.profile.title')}
            </h1>
            {tierProgress && tierColorVar ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                style={{
                  background: `color-mix(in oklch, var(${tierColorVar}) 18%, transparent)`,
                  color: `var(${tierColorVar})`,
                }}
                data-testid="account-profile-tier-badge"
              >
                <Crown className="size-4" aria-hidden />
                {t(`earn.tier.${tierProgress.tier}`)}
              </span>
            ) : null}
          </div>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(ACCOUNT_PROFILE_SEO_DESCRIPTION_KEY)}
          </p>
        </div>
      </header>

      <Card data-testid="account-profile-identity-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <UserRound className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('account.profile.identityTitle')}</CardTitle>
            <CardDescription>{t('account.profile.identityHint')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-0">
          <div className="bg-surface-raised border-line flex flex-col gap-2 rounded-(--ds-radius-md) border px-4 py-3">
            <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
              {t('account.profile.previewLabel')}
            </p>
            <p
              className="text-foreground m-0 text-lg font-semibold"
              data-testid="account-profile-preview"
            >
              {displayLabel || t('account.profile.previewEmpty')}
            </p>
            {!profileComplete ? (
              <p className="text-warning m-0 text-xs" data-testid="account-profile-incomplete-hint">
                {t('onboarding.missions.profile.desc')}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="account-profile-email" className="text-foreground text-sm font-medium">
              {t('account.profile.emailLabel')}
            </label>
            <Input
              id="account-profile-email"
              type="email"
              value={email}
              readOnly
              disabled
              data-testid="account-profile-email"
            />
          </div>
        </CardBody>
      </Card>

      <Card data-testid="account-profile-form-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('account.profile.formTitle')}</CardTitle>
          <CardDescription>{t('account.profile.formHint')}</CardDescription>
        </CardHeader>
        <CardBody className="pt-0">
          <form
            onSubmit={(event) => void handleSubmit(event)}
            noValidate
            className="flex flex-col gap-4"
            data-testid="account-profile-form"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="account-profile-username"
                className="text-foreground text-sm font-medium"
              >
                {t('account.profile.usernameLabel')}
              </label>
              <Input
                id="account-profile-username"
                type="text"
                autoComplete="username"
                value={username}
                disabled={submitBusy}
                aria-invalid={usernameGateKey !== null}
                onChange={(event) => setUsername(event.target.value)}
                data-testid="account-profile-username"
              />
              <p className="text-foreground-muted m-0 text-xs">
                {t('account.profile.usernameHint')}
              </p>
              {usernameGateKey ? (
                <p className="text-danger m-0 text-xs" role="alert">
                  {t(usernameGateKey)}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="account-profile-display-name"
                className="text-foreground text-sm font-medium"
              >
                {t('account.profile.displayNameLabel')}
              </label>
              <Input
                id="account-profile-display-name"
                type="text"
                autoComplete="nickname"
                value={displayName}
                disabled={submitBusy}
                aria-invalid={displayNameGateKey !== null}
                onChange={(event) => setDisplayName(event.target.value)}
                data-testid="account-profile-display-name"
              />
              <p className="text-foreground-muted m-0 text-xs">
                {t('account.profile.displayNameHint')}
              </p>
              {displayNameGateKey ? (
                <p className="text-danger m-0 text-xs" role="alert">
                  {t(displayNameGateKey)}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className={cn('w-full sm:w-auto')}
              loading={submitBusy}
              disabled={submitDisabled}
              data-testid="account-profile-save"
            >
              {t('account.profile.save')}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
