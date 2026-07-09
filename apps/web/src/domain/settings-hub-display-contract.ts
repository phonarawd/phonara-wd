/**
 * Settings hub (`/settings`) — display contract (local prefs · sub-route IA).
 * Inbox hub: `/notifications` · topic prefs owner: `/settings/notifications` (§3.4.2).
 *
 * Authority: `notifications-pwa-display-contract.ts` · `platform-narrative-display-contract.ts` §12.13
 */

import type { MessageKey } from '@phonara/i18n';

import { PLATFORM_EWAVE_HIDDEN_ROUTES } from './platform-narrative-display-contract';
import {
  NOTIFICATIONS_CENTER_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  type NotificationLocalPrefKey,
  readNotificationLocalPref,
  writeNotificationLocalPref,
} from './notifications-pwa-display-contract';
import { NOTIFICATIONS_PREFS_ROUTE } from './notifications-center-display-contract';

export const SETTINGS_HUB_ROUTE = NOTIFICATIONS_SETTINGS_ROUTE;

export const SETTINGS_SECURITY_ROUTE = '/settings/security' as const;
export const SETTINGS_BANK_ACCOUNTS_ROUTE = '/settings/bank-accounts' as const;
export const SETTINGS_NOTIFICATIONS_ROUTE = NOTIFICATIONS_PREFS_ROUTE;
export const SETTINGS_ACCOUNT_ROUTE = '/settings/account' as const;
export const SETTINGS_PREFERENCES_ROUTE = '/settings/preferences' as const;
export const SETTINGS_REFERRAL_ROUTE = '/settings/referral' as const;

export const SETTINGS_CASINO_CONFIRM_PREF_KEY = 'phonara.settings.casino.confirmDialog' as const;

export type SettingsHubNavGroup = 'account' | 'alerts' | 'display';

export type SettingsHubNavItem = {
  id: string;
  route: string;
  labelKey: MessageKey;
  hintKey?: MessageKey;
  group: SettingsHubNavGroup;
};

export const SETTINGS_HUB_NAV_ITEMS: readonly SettingsHubNavItem[] = [
  {
    id: 'security',
    route: SETTINGS_SECURITY_ROUTE,
    labelKey: 'account.menu.security',
    group: 'account',
  },
  {
    id: 'bank-accounts',
    route: SETTINGS_BANK_ACCOUNTS_ROUTE,
    labelKey: 'bankAccounts.title',
    hintKey: 'bankAccounts.subtitle',
    group: 'account',
  },
  {
    id: 'account',
    route: SETTINGS_ACCOUNT_ROUTE,
    labelKey: 'settings.hub.link.account',
    hintKey: 'settings.hub.link.accountHint',
    group: 'account',
  },
  {
    id: 'referral',
    route: SETTINGS_REFERRAL_ROUTE,
    labelKey: 'settings.hub.link.referral',
    hintKey: 'settings.hub.link.referralHint',
    group: 'account',
  },
  {
    id: 'notifications-prefs',
    route: SETTINGS_NOTIFICATIONS_ROUTE,
    labelKey: 'settings.hub.link.notificationsDetail',
    hintKey: 'settings.hub.link.notificationsDetailHint',
    group: 'alerts',
  },
  {
    id: 'notifications-inbox',
    route: NOTIFICATIONS_CENTER_ROUTE,
    labelKey: 'settings.hub.link.inbox',
    hintKey: 'settings.hub.link.inboxHint',
    group: 'alerts',
  },
  {
    id: 'preferences',
    route: SETTINGS_PREFERENCES_ROUTE,
    labelKey: 'settings.hub.link.preferences',
    hintKey: 'settings.display.sectionHint',
    group: 'display',
  },
] as const;

/** Quick toggles on hub — full topic list lives on `/settings/notifications`. */
export const SETTINGS_HUB_NOTIFICATION_PREF_KEYS: readonly NotificationLocalPrefKey[] = [
  'deposit',
  'mission',
  'priceAlert',
  'referral',
  'marketing',
] as const;

export {
  resolveNotificationPrefHintKey,
  resolveNotificationPrefLabelKey,
  resolveNotificationPrefToastKey,
} from './settings-notifications-display-contract';

export function resolveSettingsHubNavItems(
  hiddenRoutes: readonly string[] = PLATFORM_EWAVE_HIDDEN_ROUTES,
): SettingsHubNavItem[] {
  const hidden = new Set(hiddenRoutes);
  return SETTINGS_HUB_NAV_ITEMS.filter((item) => !hidden.has(item.route));
}

export function resolveSettingsHubGroupLabelKey(group: SettingsHubNavGroup): MessageKey {
  switch (group) {
    case 'account':
      return 'settings.hub.group.account';
    case 'alerts':
      return 'settings.hub.group.alerts';
    case 'display':
      return 'settings.section.display';
    default:
      return 'settings.hub.group.account';
  }
}

export function readSettingsHubNotificationPref(key: NotificationLocalPrefKey): boolean {
  return readNotificationLocalPref(key);
}

export function writeSettingsHubNotificationPref(
  key: NotificationLocalPrefKey,
  enabled: boolean,
): void {
  writeNotificationLocalPref(key, enabled);
}

export function readCasinoConfirmPref(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const value = window.localStorage.getItem(SETTINGS_CASINO_CONFIRM_PREF_KEY);
    if (value === '1' || value === 'true') return true;
    if (value === '0' || value === 'false') return false;
  } catch {
    // privacy mode / SSR
  }
  return false;
}

export function writeCasinoConfirmPref(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_CASINO_CONFIRM_PREF_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}
