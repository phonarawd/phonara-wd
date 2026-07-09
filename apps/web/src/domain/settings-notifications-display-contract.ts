/**
 * `/settings/notifications` — topic pref toggles (§3.4.2 Prefs owner).
 * ENGINE:partial — mission · referral · tierUpgrade local prefs until server dispatch.
 * tierDecayWarning toggle hidden until E1 (`tierDecayEngine` launch gate).
 */

import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '../lib/launch-gates';
import { NOTIFICATIONS_PREFS_ROUTE } from './notifications-center-display-contract';
import {
  type NotificationLocalPrefKey,
  readNotificationLocalPref,
  writeNotificationLocalPref,
} from './notifications-pwa-display-contract';

export const SETTINGS_NOTIFICATIONS_ROUTE = NOTIFICATIONS_PREFS_ROUTE;

export type SettingsNotificationsPrefGroup = 'money' | 'growth' | 'marketing';

export const SETTINGS_NOTIFICATIONS_PARTIAL_ENGINE_KEYS: readonly NotificationLocalPrefKey[] = [
  'mission',
  'referral',
  'tierUpgrade',
] as const;

export const TIER_DECAY_ENGINE_LAUNCH_GATE_KEY = 'tierDecayEngine' as const;

export type TierDecayEngineLaunchGateKey = typeof TIER_DECAY_ENGINE_LAUNCH_GATE_KEY;

const NOTIFICATION_PREF_LABEL_KEYS: Readonly<Record<NotificationLocalPrefKey, MessageKey>> = {
  deposit: 'settings.notifications.deposit.label',
  mission: 'settings.notifications.mission.label',
  priceAlert: 'settings.notifications.priceAlert.label',
  referral: 'settings.notifications.referral.label',
  tierUpgrade: 'settings.notifications.tierUpgrade.label',
  tierDecayWarning: 'settings.notifications.tierDecayWarning.label',
  marketing: 'settings.notifications.marketing.label',
};

const NOTIFICATION_PREF_HINT_KEYS: Partial<Readonly<Record<NotificationLocalPrefKey, MessageKey>>> =
  {
    deposit: 'settings.notifications.deposit.hint',
    priceAlert: 'settings.notifications.priceAlert.hint',
    mission: 'settings.notifications.mission.hint',
    referral: 'settings.notifications.referral.hint',
    tierUpgrade: 'settings.notifications.tierUpgrade.hint',
    tierDecayWarning: 'settings.notifications.tierDecayWarning.hint',
    marketing: 'settings.notifications.marketing.hint',
  };

const NOTIFICATION_PREF_TOAST_KEYS: Readonly<
  Record<NotificationLocalPrefKey, { on: MessageKey; off: MessageKey }>
> = {
  deposit: {
    on: 'settings.notifications.toast.deposit.on',
    off: 'settings.notifications.toast.deposit.off',
  },
  mission: {
    on: 'settings.notifications.toast.mission.on',
    off: 'settings.notifications.toast.mission.off',
  },
  priceAlert: {
    on: 'settings.notifications.toast.priceAlert.on',
    off: 'settings.notifications.toast.priceAlert.off',
  },
  referral: {
    on: 'settings.notifications.toast.referral.on',
    off: 'settings.notifications.toast.referral.off',
  },
  tierUpgrade: {
    on: 'settings.notifications.toast.tierUpgrade.on',
    off: 'settings.notifications.toast.tierUpgrade.off',
  },
  tierDecayWarning: {
    on: 'settings.notifications.toast.tierDecayWarning.on',
    off: 'settings.notifications.toast.tierDecayWarning.off',
  },
  marketing: {
    on: 'settings.notifications.toast.marketing.on',
    off: 'settings.notifications.toast.marketing.off',
  },
};

export const SETTINGS_NOTIFICATIONS_PREF_GROUPS: Readonly<
  Record<SettingsNotificationsPrefGroup, readonly NotificationLocalPrefKey[]>
> = {
  money: ['deposit', 'priceAlert'],
  growth: ['mission', 'referral', 'tierUpgrade', 'tierDecayWarning'],
  marketing: ['marketing'],
} as const;

export function resolveSettingsNotificationsGroupLabelKey(
  group: SettingsNotificationsPrefGroup,
): MessageKey {
  switch (group) {
    case 'money':
      return 'settings.notifications.group.money';
    case 'growth':
      return 'settings.notifications.group.growth';
    case 'marketing':
      return 'settings.notifications.group.marketing';
    default:
      return 'settings.notifications.group.money';
  }
}

export function resolveTierDecayWarningPrefVisible(
  gates: Readonly<Record<TierDecayEngineLaunchGateKey, boolean>> = LAUNCH_GATES,
): boolean {
  return gates.tierDecayEngine === true;
}

export function resolveSettingsNotificationsPrefKeys(
  gates: Readonly<Record<TierDecayEngineLaunchGateKey, boolean>> = LAUNCH_GATES,
): NotificationLocalPrefKey[] {
  const keys: NotificationLocalPrefKey[] = [
    ...SETTINGS_NOTIFICATIONS_PREF_GROUPS.money,
    'mission',
    'referral',
    'tierUpgrade',
  ];
  if (resolveTierDecayWarningPrefVisible(gates)) {
    keys.push('tierDecayWarning');
  }
  keys.push('marketing');
  return keys;
}

export function resolveSettingsNotificationsGroupPrefKeys(
  group: SettingsNotificationsPrefGroup,
  gates: Readonly<Record<TierDecayEngineLaunchGateKey, boolean>> = LAUNCH_GATES,
): NotificationLocalPrefKey[] {
  const allowed = new Set(resolveSettingsNotificationsPrefKeys(gates));
  return SETTINGS_NOTIFICATIONS_PREF_GROUPS[group].filter((key) => allowed.has(key));
}

export function isPartialEngineNotificationPref(key: NotificationLocalPrefKey): boolean {
  return (SETTINGS_NOTIFICATIONS_PARTIAL_ENGINE_KEYS as readonly string[]).includes(key);
}

export function resolveNotificationPrefLabelKey(key: NotificationLocalPrefKey): MessageKey {
  return NOTIFICATION_PREF_LABEL_KEYS[key];
}

export function resolveNotificationPrefHintKey(key: NotificationLocalPrefKey): MessageKey | null {
  return NOTIFICATION_PREF_HINT_KEYS[key] ?? null;
}

export function resolveNotificationPrefToastKey(
  key: NotificationLocalPrefKey,
  enabled: boolean,
): MessageKey {
  return enabled ? NOTIFICATION_PREF_TOAST_KEYS[key].on : NOTIFICATION_PREF_TOAST_KEYS[key].off;
}

export function readSettingsNotificationPref(key: NotificationLocalPrefKey): boolean {
  return readNotificationLocalPref(key);
}

export function writeSettingsNotificationPref(
  key: NotificationLocalPrefKey,
  enabled: boolean,
): void {
  writeNotificationLocalPref(key, enabled);
}
