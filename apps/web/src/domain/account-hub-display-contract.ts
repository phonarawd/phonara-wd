/**
 * `/account` hub — profile · KYC · RG links · TopBar avatar target (P8).
 * ENGINE:exists — `profiles` RLS · `rpc_get_earn_hub_status` · `rpc_request_account_deletion`.
 * Authority: plan §12.13 · §12.19 Account chrome · ONBOARDING_JOURNEY_CANON
 */

import type { MessageKey } from '@phonara/i18n';

import { ACCOUNT_PROFILE_ROUTE } from './account-profile-display-contract';
import {
  NOTIFICATIONS_CENTER_ROUTE,
  NOTIFICATIONS_INSTALL_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  resolveNotificationsCenterVisible,
  type NotificationLocalPrefKey,
  readNotificationLocalPref,
  writeNotificationLocalPref,
} from './notifications-pwa-display-contract';
import {
  resolveNotificationPrefHintKey,
  resolveNotificationPrefLabelKey,
  resolveNotificationPrefToastKey,
} from './settings-notifications-display-contract';
import { SETTINGS_HUB_ROUTE, SETTINGS_SECURITY_ROUTE } from './settings-hub-display-contract';
import { TIER_ME_ROUTE } from './tier-me-display-contract';
import { ACCOUNT_ROUTE, WALLET_ROUTE } from './unified-tier-display-contract';

export const ACCOUNT_HUB_ROUTE = ACCOUNT_ROUTE;

export const ACCOUNT_KYC_ROUTE = '/account/kyc' as const;
export const ACCOUNT_RG_ROUTE = '/account/responsible-gaming' as const;

export const ACCOUNT_HUB_P8_TODO = 'p8-page-account' as const;

/** §12.19.6 P8 gate manifest entry — TanStack route registered in same session. */
export const ACCOUNT_HUB_P8_MANIFEST_ROUTES = [ACCOUNT_HUB_ROUTE] as const;

export const ACCOUNT_HUB_READ_HOOK = 'use-profile' as const;
export const ACCOUNT_HUB_TIER_RPC = 'rpc_get_earn_hub_status' as const;
export const ACCOUNT_HUB_DELETE_RPC = 'rpc_request_account_deletion' as const;

export const ACCOUNT_DELETE_REASON_MIN = 8 as const;

export const ACCOUNT_HUB_SEO_TITLE_KEY = 'seo.account.title' as const satisfies MessageKey;
export const ACCOUNT_HUB_SEO_DESCRIPTION_KEY =
  'account.hub.identity.body' as const satisfies MessageKey;

export type AccountHubNavGroup = 'profile' | 'money' | 'help';

export type AccountHubNavItem = {
  id: string;
  route: string;
  labelKey: MessageKey;
  hintKey?: MessageKey;
  group: AccountHubNavGroup;
};

export const ACCOUNT_HUB_NAV_ITEMS: readonly AccountHubNavItem[] = [
  {
    id: 'profile',
    route: ACCOUNT_PROFILE_ROUTE,
    labelKey: 'account.menu.profile',
    hintKey: 'account.hub.identity.body',
    group: 'profile',
  },
  {
    id: 'kyc',
    route: ACCOUNT_KYC_ROUTE,
    labelKey: 'account.menu.kyc',
    group: 'profile',
  },
  {
    id: 'responsible-gaming',
    route: ACCOUNT_RG_ROUTE,
    labelKey: 'more.menu.responsibleGaming',
    group: 'profile',
  },
  {
    id: 'security',
    route: SETTINGS_SECURITY_ROUTE,
    labelKey: 'account.menu.security',
    group: 'profile',
  },
  {
    id: 'wallet',
    route: WALLET_ROUTE,
    labelKey: 'account.hub.wallet',
    group: 'money',
  },
  {
    id: 'tier',
    route: TIER_ME_ROUTE,
    labelKey: 'shell.account.menu.tier',
    group: 'money',
  },
  {
    id: 'settings',
    route: SETTINGS_HUB_ROUTE,
    labelKey: 'account.menu.settings',
    group: 'money',
  },
  {
    id: 'notifications',
    route: NOTIFICATIONS_CENTER_ROUTE,
    labelKey: 'more.menu.notifications',
    group: 'money',
  },
  {
    id: 'install',
    route: NOTIFICATIONS_INSTALL_ROUTE,
    labelKey: 'more.menu.install',
    group: 'help',
  },
] as const;

/** Quick toggles on hub — full topic list lives on `/settings`. */
export const ACCOUNT_HUB_NOTIFICATION_PREF_KEYS: readonly NotificationLocalPrefKey[] = [
  'deposit',
  'mission',
] as const;

export function resolveAccountHubNavItems(): AccountHubNavItem[] {
  const notificationsVisible = resolveNotificationsCenterVisible();
  return ACCOUNT_HUB_NAV_ITEMS.filter((item) => {
    if (item.id === 'notifications' && !notificationsVisible) return false;
    return true;
  });
}

export function resolveAccountHubGroupLabelKey(group: AccountHubNavGroup): MessageKey {
  switch (group) {
    case 'profile':
      return 'account.hub.group.profile';
    case 'money':
      return 'account.hub.group.money';
    case 'help':
      return 'account.hub.group.help';
    default:
      return 'account.hub.group.profile';
  }
}

export function resolveAccountAvatarInitial(params: {
  displayName: string | null | undefined;
  username: string | null | undefined;
  email: string | null | undefined;
  guestInitial: string;
}): string {
  const displayName = params.displayName?.trim();
  if (displayName) return displayName.charAt(0).toUpperCase();

  const username = params.username?.trim();
  if (username) return username.charAt(0).toUpperCase();

  const email = params.email?.trim();
  if (email) return email.charAt(0).toUpperCase();

  return params.guestInitial;
}

export function accountDeleteReasonGateKey(reason: string): MessageKey | null {
  if (reason.trim().length >= ACCOUNT_DELETE_REASON_MIN) return null;
  return 'account.delete.reasonTooShort';
}

export function readAccountHubNotificationPref(key: NotificationLocalPrefKey): boolean {
  return readNotificationLocalPref(key);
}

export function writeAccountHubNotificationPref(
  key: NotificationLocalPrefKey,
  enabled: boolean,
): void {
  writeNotificationLocalPref(key, enabled);
}

export {
  resolveNotificationPrefHintKey,
  resolveNotificationPrefLabelKey,
  resolveNotificationPrefToastKey,
  NOTIFICATIONS_SETTINGS_ROUTE,
};
