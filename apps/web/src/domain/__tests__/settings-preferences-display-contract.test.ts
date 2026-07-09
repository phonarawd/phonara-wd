import { describe, expect, it } from 'vitest';

import { SETTINGS_PREFERENCES_ROUTE as HUB_PREFERENCES_ROUTE } from '../settings-hub-display-contract';
import {
  applySettingsThemeToDocument,
  assertSettingsPreferencesHubRouteParity,
  isSettingsThemeOption,
  normalizeSettingsPreferencesLocale,
  normalizeSettingsTheme,
  P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO,
  readFiatHintEnabled,
  readSettingsTheme,
  resolveDefaultFiatHintEnabled,
  resolveFiatHintEnabledToastKey,
  resolveSettingsPreferencesLocaleLabelKey,
  resolveSettingsPreferencesLocaleToastKey,
  resolveSettingsThemeColorScheme,
  resolveSettingsThemeLabelKey,
  SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY,
  SETTINGS_PREFERENCES_LOCALE_OPTIONS,
  SETTINGS_PREFERENCES_ROUTE,
  SETTINGS_THEME_DEFAULT,
  SETTINGS_THEME_OPTIONS,
  SETTINGS_THEME_STORAGE_KEY,
  writeFiatHintEnabled,
  writeSettingsTheme,
} from '../settings-preferences-display-contract';

describe('settings-preferences-display-contract', () => {
  it('locks route and hub nav parity', () => {
    expect(SETTINGS_PREFERENCES_ROUTE).toBe('/settings/preferences');
    expect(HUB_PREFERENCES_ROUTE).toBe(SETTINGS_PREFERENCES_ROUTE);
    expect(() => assertSettingsPreferencesHubRouteParity()).not.toThrow();
  });

  it('documents ui_only locale and theme options', () => {
    expect(SETTINGS_PREFERENCES_LOCALE_OPTIONS).toEqual(['ko', 'en']);
    expect(SETTINGS_THEME_OPTIONS).toEqual(['light', 'dark', 'system']);
    expect(SETTINGS_THEME_DEFAULT).toBe('dark');
  });

  it('normalizes locale and maps label/toast keys', () => {
    expect(normalizeSettingsPreferencesLocale('en')).toBe('en');
    expect(normalizeSettingsPreferencesLocale('fr')).toBe('ko');
    expect(resolveSettingsPreferencesLocaleLabelKey('ko')).toBe('settings.preferences.locale.ko');
    expect(resolveSettingsPreferencesLocaleToastKey('en')).toBe('settings.toast.langEn');
  });

  it('normalizes theme and maps label keys', () => {
    expect(normalizeSettingsTheme('system')).toBe('system');
    expect(normalizeSettingsTheme('invalid')).toBe('dark');
    expect(isSettingsThemeOption('light')).toBe(true);
    expect(resolveSettingsThemeLabelKey('dark')).toBe('settings.theme.dark');
  });

  it('resolves color-scheme SOT per theme preference', () => {
    expect(resolveSettingsThemeColorScheme('light')).toBe('light');
    expect(resolveSettingsThemeColorScheme('dark')).toBe('dark');
    expect(resolveSettingsThemeColorScheme('system')).toBe('light dark');
  });

  it('persists theme and applies data-theme + color-scheme to document root', () => {
    window.localStorage.removeItem(SETTINGS_THEME_STORAGE_KEY);
    expect(readSettingsTheme()).toBe('dark');

    writeSettingsTheme('light');
    expect(window.localStorage.getItem(SETTINGS_THEME_STORAGE_KEY)).toBe('light');
    expect(readSettingsTheme()).toBe('light');

    applySettingsThemeToDocument('system');
    expect(document.documentElement.dataset['theme']).toBe('system');
    expect(document.documentElement.style.colorScheme).toBe('light dark');

    applySettingsThemeToDocument('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('defaults fiat hint enabled for ko and disabled for en when unset', () => {
    window.localStorage.removeItem(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY);
    expect(resolveDefaultFiatHintEnabled('ko')).toBe(true);
    expect(resolveDefaultFiatHintEnabled('en')).toBe(false);
    expect(readFiatHintEnabled('ko')).toBe(true);
    expect(readFiatHintEnabled('en')).toBe(false);
  });

  it('persists preferences.fiatHintEnabled and maps toast keys', () => {
    window.localStorage.removeItem(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY);
    writeFiatHintEnabled(false);
    expect(window.localStorage.getItem(SETTINGS_PREFERENCES_FIAT_HINT_ENABLED_KEY)).toBe('0');
    expect(readFiatHintEnabled('ko')).toBe(false);
    expect(resolveFiatHintEnabledToastKey(false)).toBe('settings.toast.fiatHintDisabled');
    writeFiatHintEnabled(true);
    expect(readFiatHintEnabled('en')).toBe(true);
    expect(resolveFiatHintEnabledToastKey(true)).toBe('settings.toast.fiatHintEnabled');
  });

  it('tracks Fiat#9 owner todo id', () => {
    expect(P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO).toBe('p5-page-settings-fiat-reference');
  });
});
