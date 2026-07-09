import { describe, expect, it } from 'vitest';

import { PLATFORM_EWAVE_HIDDEN_ROUTES } from '../platform-narrative-display-contract';
import {
  NOTIFICATIONS_CENTER_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
} from '../notifications-pwa-display-contract';
import {
  readCasinoConfirmPref,
  resolveNotificationPrefToastKey,
  resolveSettingsHubNavItems,
  SETTINGS_BANK_ACCOUNTS_ROUTE,
  SETTINGS_CASINO_CONFIRM_PREF_KEY,
  SETTINGS_HUB_NAV_ITEMS,
  SETTINGS_HUB_NOTIFICATION_PREF_KEYS,
  SETTINGS_HUB_ROUTE,
  SETTINGS_ACCOUNT_ROUTE,
  SETTINGS_NOTIFICATIONS_ROUTE,
  SETTINGS_PREFERENCES_ROUTE,
  SETTINGS_SECURITY_ROUTE,
  writeCasinoConfirmPref,
  writeSettingsHubNotificationPref,
} from '../settings-hub-display-contract';

describe('settings-hub-display-contract', () => {
  it('locks hub route to /settings (E17 settings_local_prefs owner)', () => {
    expect(SETTINGS_HUB_ROUTE).toBe(NOTIFICATIONS_SETTINGS_ROUTE);
    expect(SETTINGS_HUB_ROUTE).toBe('/settings');
  });

  it('lists canonical sub-routes without E-Wave hidden api-keys', () => {
    const routes = resolveSettingsHubNavItems().map((row) => row.route);
    expect(routes).toContain(SETTINGS_SECURITY_ROUTE);
    expect(routes).toContain(SETTINGS_BANK_ACCOUNTS_ROUTE);
    expect(routes).toContain(SETTINGS_ACCOUNT_ROUTE);
    expect(routes).toContain(SETTINGS_PREFERENCES_ROUTE);
    expect(routes).toContain(SETTINGS_NOTIFICATIONS_ROUTE);
    expect(routes).toContain(NOTIFICATIONS_CENTER_ROUTE);
    expect(routes).not.toContain('/settings/api-keys');
    expect(PLATFORM_EWAVE_HIDDEN_ROUTES).toContain('/settings/api-keys');
  });

  it('exposes five quick notification pref keys on hub', () => {
    expect(SETTINGS_HUB_NOTIFICATION_PREF_KEYS).toEqual([
      'deposit',
      'mission',
      'priceAlert',
      'referral',
      'marketing',
    ]);
    expect(SETTINGS_HUB_NAV_ITEMS.length).toBeGreaterThanOrEqual(6);
  });

  it('maps notification pref toast keys', () => {
    expect(resolveNotificationPrefToastKey('deposit', true)).toBe(
      'settings.notifications.toast.deposit.on',
    );
    expect(resolveNotificationPrefToastKey('marketing', false)).toBe(
      'settings.notifications.toast.marketing.off',
    );
  });

  it('reads and writes casino confirm pref', () => {
    window.localStorage.removeItem(SETTINGS_CASINO_CONFIRM_PREF_KEY);
    expect(readCasinoConfirmPref()).toBe(false);
    writeCasinoConfirmPref(true);
    expect(window.localStorage.getItem(SETTINGS_CASINO_CONFIRM_PREF_KEY)).toBe('1');
    expect(readCasinoConfirmPref()).toBe(true);
    writeCasinoConfirmPref(false);
    expect(readCasinoConfirmPref()).toBe(false);
  });

  it('persists hub notification prefs through shared storage keys', () => {
    writeSettingsHubNotificationPref('mission', false);
    expect(window.localStorage.getItem('phonara.settings.notifications.mission')).toBe('0');
    writeSettingsHubNotificationPref('mission', true);
    expect(window.localStorage.getItem('phonara.settings.notifications.mission')).toBe('1');
  });
});
