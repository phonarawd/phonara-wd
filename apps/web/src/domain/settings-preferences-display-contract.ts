/**
 * `/settings/preferences` — display locale · color theme (§25.8.2 · P8 ui_only).
 * Locale uses `@phonara/i18n` localStorage SOT · theme uses `data-theme` + root `color-scheme`.
 */

import type { Locale, MessageKey } from '@phonara/i18n';

import { SETTINGS_PREFERENCES_ROUTE as HUB_PREFERENCES_ROUTE } from './settings-hub-display-contract';

export const SETTINGS_PREFERENCES_ROUTE = '/settings/preferences' as const;

export const SETTINGS_PREFERENCES_P8_TODO = 'p8-page-settings-preferences' as const;

/** Fiat#9 owner — `/settings/preferences` fiat hint toggle · `preferences.fiatHintEnabled`. */
export const P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO = 'p5-page-settings-fiat-reference' as const;

export const SETTINGS_THEME_STORAGE_KEY = 'phonara.settings.theme' as const;

/** localStorage SOT — `preferences.fiatHintEnabled` (display-only · never settlement). */
export const SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY =
  'phonara.settings.preferences.fiatHintEnabled' as const;

export const SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_EVENT =
  'phonara:preferences:fiatHintEnabled' as const;

export const SETTINGS_PREFERENCES_LOCALE_OPTIONS = [
  'ko',
  'en',
] as const satisfies readonly Locale[];

export type SettingsPreferencesLocaleOption = (typeof SETTINGS_PREFERENCES_LOCALE_OPTIONS)[number];

export const SETTINGS_THEME_OPTIONS = ['light', 'dark', 'system'] as const;

export type SettingsThemeOption = (typeof SETTINGS_THEME_OPTIONS)[number];

export const SETTINGS_THEME_DEFAULT: SettingsThemeOption = 'dark';

export const SETTINGS_PREFERENCES_SEO_TITLE_KEY =
  'seo.settingsPreferences.title' as const satisfies MessageKey;
export const SETTINGS_PREFERENCES_SEO_DESCRIPTION_KEY =
  'seo.settingsPreferences.description' as const satisfies MessageKey;

export const SETTINGS_PREFERENCES_FIAT_HINT_TITLE_KEY =
  'settings.preferences.fiatHintTitle' as const satisfies MessageKey;
export const SETTINGS_PREFERENCES_FIAT_HINT_HINT_KEY =
  'settings.preferences.fiatHintHint' as const satisfies MessageKey;
export const SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_TOAST_KEY =
  'settings.toast.fiatHintEnabled' as const satisfies MessageKey;
export const SETTINGS_PREFERENCES_FIAT_HINT_DISABLED_TOAST_KEY =
  'settings.toast.fiatHintDisabled' as const satisfies MessageKey;

const LOCALE_LABEL_KEYS: Readonly<Record<SettingsPreferencesLocaleOption, MessageKey>> = {
  ko: 'settings.preferences.locale.ko',
  en: 'settings.preferences.locale.en',
};

const LOCALE_TOAST_KEYS: Readonly<Record<SettingsPreferencesLocaleOption, MessageKey>> = {
  ko: 'settings.toast.langKo',
  en: 'settings.toast.langEn',
};

const THEME_LABEL_KEYS: Readonly<Record<SettingsThemeOption, MessageKey>> = {
  light: 'settings.theme.light',
  dark: 'settings.theme.dark',
  system: 'settings.theme.system',
};

export function resolveSettingsPreferencesRoute(): typeof SETTINGS_PREFERENCES_ROUTE {
  return SETTINGS_PREFERENCES_ROUTE;
}

export function assertSettingsPreferencesHubRouteParity(): void {
  if (HUB_PREFERENCES_ROUTE !== SETTINGS_PREFERENCES_ROUTE) {
    throw new Error('settings-preferences: hub nav route must match canonical route');
  }
}

export function isSettingsPreferencesLocale(
  value: string,
): value is SettingsPreferencesLocaleOption {
  return (SETTINGS_PREFERENCES_LOCALE_OPTIONS as readonly string[]).includes(value);
}

export function normalizeSettingsPreferencesLocale(
  value: string | null | undefined,
): SettingsPreferencesLocaleOption {
  if (value && isSettingsPreferencesLocale(value)) return value;
  return 'ko';
}

export function isSettingsThemeOption(value: string): value is SettingsThemeOption {
  return (SETTINGS_THEME_OPTIONS as readonly string[]).includes(value);
}

export function normalizeSettingsTheme(value: string | null | undefined): SettingsThemeOption {
  if (value && isSettingsThemeOption(value)) return value;
  return SETTINGS_THEME_DEFAULT;
}

export function resolveSettingsPreferencesLocaleLabelKey(
  locale: SettingsPreferencesLocaleOption,
): MessageKey {
  return LOCALE_LABEL_KEYS[locale];
}

export function resolveSettingsPreferencesLocaleToastKey(
  locale: SettingsPreferencesLocaleOption,
): MessageKey {
  return LOCALE_TOAST_KEYS[locale];
}

export function resolveSettingsThemeLabelKey(theme: SettingsThemeOption): MessageKey {
  return THEME_LABEL_KEYS[theme];
}

export function resolveSettingsThemeColorScheme(
  theme: SettingsThemeOption,
): 'light' | 'dark' | 'light dark' {
  switch (theme) {
    case 'light':
      return 'light';
    case 'dark':
      return 'dark';
    case 'system':
      return 'light dark';
    default:
      return 'dark';
  }
}

export function readSettingsTheme(): SettingsThemeOption {
  if (typeof window === 'undefined') return SETTINGS_THEME_DEFAULT;
  try {
    const stored = window.localStorage.getItem(SETTINGS_THEME_STORAGE_KEY);
    if (stored) return normalizeSettingsTheme(stored);
  } catch {
    // privacy mode / SSR
  }
  return SETTINGS_THEME_DEFAULT;
}

export function writeSettingsTheme(theme: SettingsThemeOption): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeSettingsTheme(theme);
  try {
    window.localStorage.setItem(SETTINGS_THEME_STORAGE_KEY, normalized);
  } catch {
    // ignore
  }
}

/** Root SOT — `data-theme` attribute + inline `color-scheme` (§25.8.2). */
export function applySettingsThemeToDocument(theme: SettingsThemeOption): void {
  if (typeof document === 'undefined') return;
  const normalized = normalizeSettingsTheme(theme);
  const root = document.documentElement;
  root.dataset['theme'] = normalized;
  root.style.colorScheme = resolveSettingsThemeColorScheme(normalized);
}

/** Locale default before explicit user override — ko ON · en OFF (§13.1.4.3 · Fiat#9). */
export function resolveDefaultFiatHintEnabled(locale: string | null | undefined): boolean {
  return normalizeSettingsPreferencesLocale(locale ?? 'ko') === 'ko';
}

export function readFiatHintEnabled(locale: string | null | undefined): boolean {
  if (typeof window === 'undefined') return resolveDefaultFiatHintEnabled(locale);
  try {
    const stored = window.localStorage.getItem(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY);
    if (stored === '1' || stored === 'true') return true;
    if (stored === '0' || stored === 'false') return false;
  } catch {
    // privacy mode / SSR
  }
  return resolveDefaultFiatHintEnabled(locale);
}

export function writeFiatHintEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY, enabled ? '1' : '0');
    window.dispatchEvent(new Event(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_EVENT));
  } catch {
    // ignore
  }
}

export function resolveFiatHintEnabledToastKey(enabled: boolean): MessageKey {
  return enabled
    ? SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_TOAST_KEY
    : SETTINGS_PREFERENCES_FIAT_HINT_DISABLED_TOAST_KEY;
}
