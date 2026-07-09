/**
 * `/settings/account` — account locale · timezone SOT (P8 · GLOBAL_EXPANSION §5).
 * ENGINE:exists — `profiles.locale` read/update via RLS.
 * Timezone — device `Intl` + local pref until engine profile column (E-Wave).
 */

import type { Locale, MessageKey } from '@phonara/i18n';

import { SETTINGS_ACCOUNT_ROUTE as HUB_ACCOUNT_ROUTE } from './settings-hub-display-contract';

export const SETTINGS_ACCOUNT_ROUTE = '/settings/account' as const;

export const SETTINGS_ACCOUNT_P8_TODO = 'p8-page-settings-account' as const;

export const SETTINGS_ACCOUNT_LOCALE_ENGINE_TABLE = 'profiles' as const;
export const SETTINGS_ACCOUNT_LOCALE_ENGINE_FIELD = 'locale' as const;

export const SETTINGS_ACCOUNT_TIMEZONE_STORAGE_KEY = 'phonara.settings.timezone' as const;

export const SETTINGS_ACCOUNT_LOCALE_OPTIONS = ['ko', 'en'] as const satisfies readonly Locale[];

export type SettingsAccountLocaleOption = (typeof SETTINGS_ACCOUNT_LOCALE_OPTIONS)[number];

/** Curated IANA zones — global-ready · device zone merged when absent. */
export const SETTINGS_ACCOUNT_TIMEZONE_OPTIONS = [
  'Asia/Seoul',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Tokyo',
  'Asia/Singapore',
] as const;

export type SettingsAccountTimezoneOption = (typeof SETTINGS_ACCOUNT_TIMEZONE_OPTIONS)[number];

export const SETTINGS_ACCOUNT_SEO_TITLE_KEY =
  'seo.settingsAccount.title' as const satisfies MessageKey;
export const SETTINGS_ACCOUNT_SEO_DESCRIPTION_KEY =
  'seo.settingsAccount.description' as const satisfies MessageKey;

const LOCALE_LABEL_KEYS: Readonly<Record<SettingsAccountLocaleOption, MessageKey>> = {
  ko: 'settings.account.locale.ko',
  en: 'settings.account.locale.en',
};

const LOCALE_TOAST_KEYS: Readonly<Record<SettingsAccountLocaleOption, MessageKey>> = {
  ko: 'settings.toast.langKo',
  en: 'settings.toast.langEn',
};

export function resolveSettingsAccountRoute(): typeof SETTINGS_ACCOUNT_ROUTE {
  return SETTINGS_ACCOUNT_ROUTE;
}

export function assertSettingsAccountHubRouteParity(): void {
  if (HUB_ACCOUNT_ROUTE !== SETTINGS_ACCOUNT_ROUTE) {
    throw new Error('settings-account: hub nav route must match canonical route');
  }
}

export function isSettingsAccountLocale(value: string): value is SettingsAccountLocaleOption {
  return (SETTINGS_ACCOUNT_LOCALE_OPTIONS as readonly string[]).includes(value);
}

export function normalizeSettingsAccountLocale(
  value: string | null | undefined,
): SettingsAccountLocaleOption {
  if (value && isSettingsAccountLocale(value)) return value;
  return 'ko';
}

export function resolveSettingsAccountLocaleLabelKey(
  locale: SettingsAccountLocaleOption,
): MessageKey {
  return LOCALE_LABEL_KEYS[locale];
}

export function resolveSettingsAccountLocaleToastKey(
  locale: SettingsAccountLocaleOption,
): MessageKey {
  return LOCALE_TOAST_KEYS[locale];
}

export function resolveDeviceTimezone(): string {
  if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
    try {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (resolved && isValidIanaTimezone(resolved)) return resolved;
    } catch {
      // unsupported runtime
    }
  }
  return 'UTC';
}

export function isValidIanaTimezone(value: string): boolean {
  if (!value || value.length > 64) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function normalizeSettingsAccountTimezone(value: string | null | undefined): string {
  const candidate = (value ?? '').trim();
  if (candidate && isValidIanaTimezone(candidate)) return candidate;
  return resolveDeviceTimezone();
}

export function resolveSettingsAccountTimezoneOptions(current: string): readonly string[] {
  const normalized = normalizeSettingsAccountTimezone(current);
  const options = new Set<string>(SETTINGS_ACCOUNT_TIMEZONE_OPTIONS);
  options.add(normalized);
  options.add(resolveDeviceTimezone());
  return [...options];
}

export function readSettingsAccountTimezone(): string {
  if (typeof window === 'undefined') return resolveDeviceTimezone();
  try {
    const stored = window.localStorage.getItem(SETTINGS_ACCOUNT_TIMEZONE_STORAGE_KEY);
    if (stored) return normalizeSettingsAccountTimezone(stored);
  } catch {
    // privacy mode / SSR
  }
  return resolveDeviceTimezone();
}

export function writeSettingsAccountTimezone(timezone: string): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeSettingsAccountTimezone(timezone);
  try {
    window.localStorage.setItem(SETTINGS_ACCOUNT_TIMEZONE_STORAGE_KEY, normalized);
  } catch {
    // ignore
  }
}

export function formatSettingsAccountTimezonePreview(
  date: Date,
  timezone: string,
  locale: Locale,
): string {
  const safeTimezone = normalizeSettingsAccountTimezone(timezone);
  const intlLocale = locale === 'ko' ? 'ko-KR' : 'en-US';
  try {
    return new Intl.DateTimeFormat(intlLocale, {
      timeZone: safeTimezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function formatSettingsAccountTimezoneLabel(timezone: string, locale: Locale): string {
  const safeTimezone = normalizeSettingsAccountTimezone(timezone);
  const intlLocale = locale === 'ko' ? 'ko-KR' : 'en-US';
  try {
    const parts = new Intl.DateTimeFormat(intlLocale, {
      timeZone: safeTimezone,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date());
    const offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
    return offset ? `${safeTimezone} (${offset})` : safeTimezone;
  } catch {
    return safeTimezone;
  }
}
