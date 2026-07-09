import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Clock, Globe } from 'lucide-react';

import {
  SETTINGS_ACCOUNT_LOCALE_OPTIONS,
  SETTINGS_ACCOUNT_SEO_DESCRIPTION_KEY,
  SETTINGS_ACCOUNT_SEO_TITLE_KEY,
  formatSettingsAccountTimezoneLabel,
  resolveSettingsAccountLocaleLabelKey,
  type SettingsAccountLocaleOption,
} from '@/domain/settings-account-display-contract';
import { useSettingsAccountController } from '@/features/settings/use-settings-account-controller';
import { useI18n } from '@/product/i18n';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/product/primitives/select';
import { Skeleton } from '@/product/primitives/skeleton';

function SettingsAccountLoadingShell() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4 md:py-6"
      data-testid="settings-account-loading"
    >
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}

/** Canonical `/settings/account` — profile locale (ENGINE) · timezone SOT (P8). */
export function AccountSettingsPage() {
  const { locale: uiLocale } = useI18n();
  const engine = useSettingsAccountController();
  const {
    t,
    loading,
    error,
    accountLocale,
    timezone,
    timezoneOptions,
    timezonePreview,
    setAccountLocale,
    setTimezone,
    localeBusy,
  } = engine;

  useEffect(() => {
    document.title = t(SETTINGS_ACCOUNT_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return <SettingsAccountLoadingShell />;
  }

  if (error) {
    return (
      <div
        className="border-danger/30 bg-surface mx-auto flex w-full max-w-2xl flex-col items-start gap-3 rounded-(--ds-radius-lg) border p-4 py-4 md:py-6"
        data-testid="settings-account-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(error)}</p>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4 md:py-6"
      data-testid="settings-account-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to="/settings"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="settings-account-back"
        >
          {t('settings.account.back')}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('settings.account.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(SETTINGS_ACCOUNT_SEO_DESCRIPTION_KEY)}
          </p>
        </div>
      </header>

      <Card data-testid="settings-account-locale-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <Globe className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('settings.account.localeTitle')}</CardTitle>
            <CardDescription>{t('settings.account.localeHint')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 pt-0">
          <Select
            value={accountLocale}
            onValueChange={(value) => {
              void setAccountLocale(value as SettingsAccountLocaleOption);
            }}
            disabled={localeBusy}
          >
            <SelectTrigger
              id="settings-account-locale"
              aria-label={t('settings.account.localeTitle')}
              data-testid="settings-account-locale-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SETTINGS_ACCOUNT_LOCALE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(resolveSettingsAccountLocaleLabelKey(option))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardBody>
      </Card>

      <Card data-testid="settings-account-timezone-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <Clock className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('settings.account.timezoneTitle')}</CardTitle>
            <CardDescription>{t('settings.account.timezoneHint')}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 pt-0">
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger
              id="settings-account-timezone"
              aria-label={t('settings.account.timezoneTitle')}
              data-testid="settings-account-timezone-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezoneOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatSettingsAccountTimezoneLabel(option, uiLocale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div
            className="bg-surface-raised border-line rounded-(--ds-radius-md) border px-4 py-3"
            data-testid="settings-account-timezone-preview"
          >
            <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
              {t('settings.account.previewLabel')}
            </p>
            <p className="text-foreground m-0 mt-1 text-sm tabular-nums">{timezonePreview}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
