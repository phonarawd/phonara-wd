import { describe, expect, it } from 'vitest';

import { SETTINGS_ACCOUNT_ROUTE as HUB_ACCOUNT_ROUTE } from '../settings-hub-display-contract';
import {
  assertSettingsAccountHubRouteParity,
  formatSettingsAccountTimezonePreview,
  isSettingsAccountLocale,
  isValidIanaTimezone,
  normalizeSettingsAccountLocale,
  normalizeSettingsAccountTimezone,
  readSettingsAccountTimezone,
  resolveSettingsAccountLocaleLabelKey,
  resolveSettingsAccountLocaleToastKey,
  resolveSettingsAccountTimezoneOptions,
  SETTINGS_ACCOUNT_LOCALE_ENGINE_FIELD,
  SETTINGS_ACCOUNT_LOCALE_ENGINE_TABLE,
  SETTINGS_ACCOUNT_LOCALE_OPTIONS,
  SETTINGS_ACCOUNT_ROUTE,
  SETTINGS_ACCOUNT_TIMEZONE_STORAGE_KEY,
  writeSettingsAccountTimezone,
} from '../settings-account-display-contract';

describe('settings-account-display-contract', () => {
  it('locks route and hub nav parity', () => {
    expect(SETTINGS_ACCOUNT_ROUTE).toBe('/settings/account');
    expect(HUB_ACCOUNT_ROUTE).toBe(SETTINGS_ACCOUNT_ROUTE);
    expect(() => assertSettingsAccountHubRouteParity()).not.toThrow();
  });

  it('documents ENGINE locale field on profiles', () => {
    expect(SETTINGS_ACCOUNT_LOCALE_ENGINE_TABLE).toBe('profiles');
    expect(SETTINGS_ACCOUNT_LOCALE_ENGINE_FIELD).toBe('locale');
    expect(SETTINGS_ACCOUNT_LOCALE_OPTIONS).toEqual(['ko', 'en']);
  });

  it('normalizes locale and maps label/toast keys', () => {
    expect(normalizeSettingsAccountLocale('en')).toBe('en');
    expect(normalizeSettingsAccountLocale('fr')).toBe('ko');
    expect(isSettingsAccountLocale('ko')).toBe(true);
    expect(resolveSettingsAccountLocaleLabelKey('ko')).toBe('settings.account.locale.ko');
    expect(resolveSettingsAccountLocaleToastKey('en')).toBe('settings.toast.langEn');
  });

  it('validates IANA timezones and persists local pref', () => {
    expect(isValidIanaTimezone('Asia/Seoul')).toBe(true);
    expect(isValidIanaTimezone('Not/AZone')).toBe(false);
    expect(normalizeSettingsAccountTimezone('UTC')).toBe('UTC');

    window.localStorage.removeItem(SETTINGS_ACCOUNT_TIMEZONE_STORAGE_KEY);
    writeSettingsAccountTimezone('Europe/London');
    expect(window.localStorage.getItem(SETTINGS_ACCOUNT_TIMEZONE_STORAGE_KEY)).toBe(
      'Europe/London',
    );
    expect(readSettingsAccountTimezone()).toBe('Europe/London');
  });

  it('merges device timezone into selectable options', () => {
    const options = resolveSettingsAccountTimezoneOptions('Asia/Tokyo');
    expect(options).toContain('Asia/Tokyo');
    expect(options).toContain('Asia/Seoul');
  });

  it('formats timezone preview with Intl', () => {
    const preview = formatSettingsAccountTimezonePreview(
      new Date('2026-07-05T12:00:00.000Z'),
      'UTC',
      'en',
    );
    expect(preview.length).toBeGreaterThan(0);
  });
});
