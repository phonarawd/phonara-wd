import { useEffect } from 'react';

import { Link } from '@tanstack/react-router';

import { Globe, Palette, CircleDollarSign } from 'lucide-react';

import {
  SETTINGS_PREFERENCES_LOCALE_OPTIONS,
  SETTINGS_PREFERENCES_FIAT_HINT_HINT_KEY,
  SETTINGS_PREFERENCES_FIAT_HINT_TITLE_KEY,
  SETTINGS_PREFERENCES_SEO_DESCRIPTION_KEY,
  SETTINGS_PREFERENCES_SEO_TITLE_KEY,
  SETTINGS_THEME_OPTIONS,
  resolveSettingsPreferencesLocaleLabelKey,
  resolveSettingsThemeLabelKey,
  type SettingsPreferencesLocaleOption,
  type SettingsThemeOption,
} from '@/domain/settings-preferences-display-contract';

import { useSettingsPreferencesController } from '@/features/settings/use-settings-preferences-controller';

import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/product/primitives/select';
import { Switch } from '@/product/primitives/switch';

/** Canonical `/settings/preferences` — display locale · color theme · fiat hint toggle (P8 · Fiat#9). */

export function PreferencesSettingsPage() {
  const engine = useSettingsPreferencesController();

  const {
    t,
    displayLocale,
    theme,
    fiatHintEnabled,
    setDisplayLocale,
    setTheme,
    setFiatHintEnabled,
  } = engine;

  useEffect(() => {
    document.title = t(SETTINGS_PREFERENCES_SEO_TITLE_KEY);
  }, [t]);

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4 md:py-6"
      data-testid="settings-preferences-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to="/settings"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="settings-preferences-back"
        >
          {t('settings.preferences.back')}
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('settings.preferences.title')}
          </h1>

          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(SETTINGS_PREFERENCES_SEO_DESCRIPTION_KEY)}
          </p>
        </div>
      </header>

      <Card data-testid="settings-preferences-locale-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <Globe className="size-5" />
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('settings.preferences.localeTitle')}</CardTitle>

            <CardDescription>{t('settings.preferences.localeHint')}</CardDescription>
          </div>
        </CardHeader>

        <CardBody className="flex flex-col gap-3 pt-0">
          <Select
            value={displayLocale}
            onValueChange={(value) => {
              setDisplayLocale(value as SettingsPreferencesLocaleOption);
            }}
          >
            <SelectTrigger
              id="settings-preferences-locale"
              aria-label={t('settings.display.aria.language')}
              data-testid="settings-preferences-locale-select"
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {SETTINGS_PREFERENCES_LOCALE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(resolveSettingsPreferencesLocaleLabelKey(option))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardBody>
      </Card>

      <Card data-testid="settings-preferences-theme-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <Palette className="size-5" />
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{t('settings.preferences.themeTitle')}</CardTitle>

            <CardDescription>{t('settings.preferences.themeHint')}</CardDescription>
          </div>
        </CardHeader>

        <CardBody className="flex flex-col gap-3 pt-0">
          <Select
            value={theme}
            onValueChange={(value) => {
              setTheme(value as SettingsThemeOption);
            }}
          >
            <SelectTrigger
              id="settings-preferences-theme"
              aria-label={t('settings.display.aria.theme')}
              data-testid="settings-preferences-theme-select"
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {SETTINGS_THEME_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(resolveSettingsThemeLabelKey(option))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardBody>
      </Card>

      <Card data-testid="settings-preferences-fiat-hint-card">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <span
            className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
            aria-hidden
          >
            <CircleDollarSign className="size-5" />
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">
              {t(SETTINGS_PREFERENCES_FIAT_HINT_TITLE_KEY)}
            </CardTitle>

            <CardDescription>{t(SETTINGS_PREFERENCES_FIAT_HINT_HINT_KEY)}</CardDescription>
          </div>
        </CardHeader>

        <CardBody className="flex flex-col gap-3 pt-0">
          <div
            className="flex items-start justify-between gap-3"
            data-testid="settings-preferences-fiat-hint-toggle"
          >
            <label
              htmlFor="settings-preferences-fiat-hint-switch"
              className="text-foreground text-sm font-medium"
            >
              {t(SETTINGS_PREFERENCES_FIAT_HINT_TITLE_KEY)}
            </label>

            <Switch
              id="settings-preferences-fiat-hint-switch"
              checked={fiatHintEnabled}
              onCheckedChange={setFiatHintEnabled}
              aria-label={t(SETTINGS_PREFERENCES_FIAT_HINT_TITLE_KEY)}
              data-testid="settings-preferences-fiat-hint-switch"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
