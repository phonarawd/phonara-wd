import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  isPartialEngineNotificationPref,
  resolveSettingsNotificationsGroupPrefKeys,
  resolveSettingsNotificationsPrefKeys,
  resolveTierDecayWarningPrefVisible,
  SETTINGS_NOTIFICATIONS_PARTIAL_ENGINE_KEYS,
  SETTINGS_NOTIFICATIONS_ROUTE,
  writeSettingsNotificationPref,
} from '../settings-notifications-display-contract';

describe('settings-notifications-display-contract', () => {
  it('locks prefs route to /settings/notifications', () => {
    expect(SETTINGS_NOTIFICATIONS_ROUTE).toBe('/settings/notifications');
  });

  it('exposes growth partial-engine keys for mission · referral · tierUpgrade', () => {
    expect(SETTINGS_NOTIFICATIONS_PARTIAL_ENGINE_KEYS).toEqual([
      'mission',
      'referral',
      'tierUpgrade',
    ]);
    expect(isPartialEngineNotificationPref('mission')).toBe(true);
    expect(isPartialEngineNotificationPref('deposit')).toBe(false);
  });

  it('hides tierDecayWarning until E1 tierDecayEngine gate is true', () => {
    expect(resolveTierDecayWarningPrefVisible()).toBe(false);
    expect(resolveSettingsNotificationsPrefKeys()).toEqual([
      'deposit',
      'priceAlert',
      'mission',
      'referral',
      'tierUpgrade',
      'marketing',
    ]);
    expect(
      resolveSettingsNotificationsPrefKeys({ ...LAUNCH_GATES, tierDecayEngine: true }),
    ).toContain('tierDecayWarning');
    expect(
      resolveSettingsNotificationsGroupPrefKeys('growth', {
        ...LAUNCH_GATES,
        tierDecayEngine: true,
      }),
    ).toContain('tierDecayWarning');
  });

  it('persists tier prefs through shared storage keys', () => {
    writeSettingsNotificationPref('tierUpgrade', false);
    expect(window.localStorage.getItem('phonara.settings.notifications.tierUpgrade')).toBe('0');
    writeSettingsNotificationPref('tierUpgrade', true);
    expect(window.localStorage.getItem('phonara.settings.notifications.tierUpgrade')).toBe('1');
  });
});
