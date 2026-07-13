/**
 * Notifications / PWA — Phase 1 E17 discovery contract.
 * Push dispatch, browser subscribe, local prefs, and install prompt ownership.
 * Display-only prefs must not mutate ledger; server push paths require consent + subscription rows.
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E17 · §E6 deposit notify · E22 scope lock
 */

import { LAUNCH_GATES } from '../lib/launch-gates';

export const NOTIFICATIONS_CONSENT_RPC = 'rpc_record_consent' as const;
export const PUSH_CONSENT_DOC_TYPE = 'push_notification' as const;
export const PUSH_CONSENT_DOC_VERSION = '1.0' as const;

export const NOTIFICATIONS_OUTBOX_TABLE = 'notification_outbox' as const;
export const PUSH_SUBSCRIPTIONS_TABLE = 'push_subscriptions' as const;
export const USER_CONSENTS_TABLE = 'user_consents' as const;

export const NOTIFICATIONS_SETTINGS_ROUTE = '/settings' as const;
export const NOTIFICATIONS_INSTALL_ROUTE = '/install' as const;
export const NOTIFICATIONS_ACCOUNT_ROUTE = '/account' as const;
export const NOTIFICATIONS_CENTER_ROUTE = '/notifications' as const;
export const NOTIFICATIONS_TRADE_ROUTE = '/trade' as const;

/** E2 launch gate — `/notifications` chrome + account menu link exposure only. */
export const NOTIFICATIONS_LAUNCH_GATE_KEY = 'notificationsCenter' as const;

export type NotificationsLaunchGateKey = typeof NOTIFICATIONS_LAUNCH_GATE_KEY;

export const NOTIFICATIONS_LAUNCH_GATE_DEFAULTS: Readonly<
  Record<NotificationsLaunchGateKey, boolean>
> = {
  notificationsCenter: LAUNCH_GATES.notificationsCenter,
};

export type NotificationsPwaEngineBranch =
  | 'push_outbox'
  | 'push_dispatch_edge'
  | 'push_subscriptions'
  | 'push_consent'
  | 'deposit_realtime'
  | 'deposit_push_enqueue'
  | 'price_alert_oracle'
  | 'mission_push'
  | 'referral_push'
  | 'tier_upgrade_push'
  | 'tier_decay_warning_push'
  | 'marketing_push'
  | 'notification_center_page'
  | 'pwa_install_prompt'
  | 'pwa_install_guide'
  | 'pwa_advanced_capabilities';

export type NotificationsPwaEngineStatus = 'exists' | 'partial' | 'missing';

export type NotificationsPwaExposureMode = 'live' | 'built_hidden' | 'defer_stub';

export type NotificationLocalPrefKey =
  | 'deposit'
  | 'priceAlert'
  | 'mission'
  | 'referral'
  | 'tierUpgrade'
  | 'tierDecayWarning'
  | 'marketing';

/** localStorage keys — settings toggles (client-only unless noted). */
export const NOTIFICATION_LOCAL_PREF_KEYS: Readonly<Record<NotificationLocalPrefKey, string>> = {
  deposit: 'phonara.settings.notifications.deposit',
  priceAlert: 'phonara.settings.notifications.priceAlert',
  mission: 'phonara.settings.notifications.mission',
  referral: 'phonara.settings.notifications.referral',
  tierUpgrade: 'phonara.settings.notifications.tierUpgrade',
  tierDecayWarning: 'phonara.settings.notifications.tierDecayWarning',
  marketing: 'phonara.settings.notifications.marketing',
};

export const NOTIFICATION_LOCAL_PREF_DEFAULTS: Readonly<Record<NotificationLocalPrefKey, boolean>> =
  {
    deposit: true,
    priceAlert: true,
    mission: true,
    referral: true,
    tierUpgrade: true,
    tierDecayWarning: true,
    marketing: false,
  };

export const PWA_INSTALL_DISMISS_STORAGE_KEY = 'pwa.install.dismissed' as const;

export const NOTIFICATIONS_PWA_ENGINE_BRANCHES: Readonly<
  Record<
    NotificationsPwaEngineBranch,
    {
      engine: NotificationsPwaEngineStatus;
      source: string;
      moneyPath: boolean;
      launchGate: NotificationsLaunchGateKey | null;
    }
  >
> = {
  push_outbox: {
    engine: 'exists',
    source: NOTIFICATIONS_OUTBOX_TABLE,
    moneyPath: false,
    launchGate: null,
  },
  push_dispatch_edge: {
    engine: 'exists',
    source: 'notification-dispatch',
    moneyPath: false,
    launchGate: null,
  },
  push_subscriptions: {
    engine: 'exists',
    source: PUSH_SUBSCRIPTIONS_TABLE,
    moneyPath: false,
    launchGate: null,
  },
  push_consent: {
    engine: 'exists',
    source: `${NOTIFICATIONS_CONSENT_RPC}(${PUSH_CONSENT_DOC_TYPE})`,
    moneyPath: false,
    launchGate: null,
  },
  deposit_realtime: {
    engine: 'exists',
    source: 'useDepositRealtimeNotify · supabase_realtime deposit tables',
    moneyPath: false,
    launchGate: null,
  },
  deposit_push_enqueue: {
    engine: 'exists',
    source: '_notify_deposit_credited → notification_outbox',
    moneyPath: false,
    launchGate: null,
  },
  price_alert_oracle: {
    engine: 'exists',
    source: 'GlobalNotificationSubscriptions · oracle_prices realtime',
    moneyPath: false,
    launchGate: null,
  },
  mission_push: {
    engine: 'partial',
    source: NOTIFICATION_LOCAL_PREF_KEYS.mission,
    moneyPath: false,
    launchGate: null,
  },
  referral_push: {
    engine: 'partial',
    source: NOTIFICATION_LOCAL_PREF_KEYS.referral,
    moneyPath: false,
    launchGate: null,
  },
  tier_upgrade_push: {
    engine: 'partial',
    source: NOTIFICATION_LOCAL_PREF_KEYS.tierUpgrade,
    moneyPath: false,
    launchGate: null,
  },
  tier_decay_warning_push: {
    engine: 'partial',
    source: NOTIFICATION_LOCAL_PREF_KEYS.tierDecayWarning,
    moneyPath: false,
    launchGate: null,
  },
  marketing_push: {
    engine: 'partial',
    source: NOTIFICATION_LOCAL_PREF_KEYS.marketing,
    moneyPath: false,
    launchGate: null,
  },
  notification_center_page: {
    engine: 'exists',
    source: `${NOTIFICATIONS_CENTER_ROUTE} · notification_outbox read + local inbox`,
    moneyPath: false,
    launchGate: NOTIFICATIONS_LAUNCH_GATE_KEY,
  },
  pwa_install_prompt: {
    engine: 'exists',
    source: 'InstallPromptProvider · PwaInstallBanner',
    moneyPath: false,
    launchGate: null,
  },
  pwa_install_guide: {
    engine: 'exists',
    source: NOTIFICATIONS_INSTALL_ROUTE,
    moneyPath: false,
    launchGate: null,
  },
  pwa_advanced_capabilities: {
    engine: 'missing',
    source: 'pwa-advanced-capability-display-contract.ts §E22',
    moneyPath: false,
    launchGate: null,
  },
};

export type NotificationsPwaSurfacePlacement = {
  route:
    | typeof NOTIFICATIONS_SETTINGS_ROUTE
    | typeof NOTIFICATIONS_INSTALL_ROUTE
    | typeof NOTIFICATIONS_ACCOUNT_ROUTE
    | typeof NOTIFICATIONS_CENTER_ROUTE
    | typeof NOTIFICATIONS_TRADE_ROUTE;
  role:
    | 'settings_local_prefs'
    | 'pwa_install_guide'
    | 'account_menu_entry'
    | 'notification_center_hub'
    | 'trade_push_consent_owner';
  hook: string;
  launchGate: NotificationsLaunchGateKey | null;
};

export const NOTIFICATIONS_PWA_PLACEMENT: Readonly<NotificationsPwaSurfacePlacement[]> = [
  {
    route: NOTIFICATIONS_SETTINGS_ROUTE,
    role: 'settings_local_prefs',
    hook: 'ImportedSettingsPage',
    launchGate: null,
  },
  {
    route: NOTIFICATIONS_INSTALL_ROUTE,
    role: 'pwa_install_guide',
    hook: 'ImportedPWAInstallPage',
    launchGate: null,
  },
  {
    route: NOTIFICATIONS_ACCOUNT_ROUTE,
    role: 'account_menu_entry',
    hook: 'AccountPageBody → /notifications',
    launchGate: NOTIFICATIONS_LAUNCH_GATE_KEY,
  },
  {
    route: NOTIFICATIONS_CENTER_ROUTE,
    role: 'notification_center_hub',
    hook: 'NotificationsPage',
    launchGate: NOTIFICATIONS_LAUNCH_GATE_KEY,
  },
  {
    route: NOTIFICATIONS_TRADE_ROUTE,
    role: 'trade_push_consent_owner',
    hook: 'TradeNotificationCenter · useTradeNotifications',
    launchGate: null,
  },
];

/** Phase 1 audit (2026-07-02). */
export const NOTIFICATIONS_PWA_UI_WIRE_STATUS: Readonly<
  Record<
    | typeof NOTIFICATIONS_SETTINGS_ROUTE
    | typeof NOTIFICATIONS_INSTALL_ROUTE
    | typeof NOTIFICATIONS_ACCOUNT_ROUTE
    | typeof NOTIFICATIONS_CENTER_ROUTE,
    'wired' | 'partial' | 'unwired' | 'built_hidden'
  >
> = {
  '/settings': 'wired',
  '/install': 'wired',
  '/account': 'wired',
  '/notifications': 'wired',
};

export function readNotificationLocalPref(
  key: NotificationLocalPrefKey,
  fallback = NOTIFICATION_LOCAL_PREF_DEFAULTS[key],
): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const storageKey = NOTIFICATION_LOCAL_PREF_KEYS[key];
    const value = window.localStorage.getItem(storageKey);
    if (value === '1' || value === 'true') return true;
    if (value === '0' || value === 'false') return false;
  } catch {
    // privacy mode / SSR
  }
  return fallback;
}

export function writeNotificationLocalPref(key: NotificationLocalPrefKey, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NOTIFICATION_LOCAL_PREF_KEYS[key], enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

export function resolveNotificationsCenterVisible(
  gates: Readonly<Record<NotificationsLaunchGateKey, boolean>> = NOTIFICATIONS_LAUNCH_GATE_DEFAULTS,
): boolean {
  return gates.notificationsCenter === true;
}

export function resolveNotificationBranchExposure(
  branch: NotificationsPwaEngineBranch,
  gates: Readonly<Record<NotificationsLaunchGateKey, boolean>> = NOTIFICATIONS_LAUNCH_GATE_DEFAULTS,
): NotificationsPwaExposureMode {
  const row = NOTIFICATIONS_PWA_ENGINE_BRANCHES[branch];
  if (row.engine === 'missing') return 'defer_stub';
  if (row.launchGate && !gates[row.launchGate]) return 'built_hidden';
  if (row.engine === 'partial') return 'built_hidden';
  return 'live';
}

/**
 * Local pref toggles on `/settings` gate client emit only.
 * Server outbox still queues deposit push when pref off (E6 contract).
 */
export function resolveLocalNotifPrefBlocksClientEmit(
  key: NotificationLocalPrefKey,
  enabled: boolean,
): boolean {
  if (key === 'deposit') return !enabled;
  if (key === 'priceAlert') return !enabled;
  return !enabled;
}

/** Mission/referral/marketing prefs are settings-only until server dispatch branches ship. */
export function isServerBackedNotificationPref(key: NotificationLocalPrefKey): boolean {
  return key === 'deposit' || key === 'priceAlert';
}

export function resolvePwaInstallBannerVisible(params: {
  pathname: string;
  isInstalled: boolean;
  isDismissed: boolean;
}): boolean {
  if (params.isInstalled || params.isDismissed) return false;
  if (params.pathname === NOTIFICATIONS_INSTALL_ROUTE) return false;
  return true;
}

export type PwaInstallBannerPosition = 'above-bottom-nav' | 'floating-bottom';

/**
 * ZA-10 — `PwaInstallBanner` mounts globally (inside `PwaShell`, above the
 * per-route shell branch in `__root.tsx`), so it renders on routes where
 * `shouldMountAppShell(pathname)` is false (e.g. `/tier`, `/features`,
 * `/security`, `/support`, `/feedback`, marketing/auth pages) and no
 * BottomNav is mounted to clear. Callers must pass the same
 * `shouldMountAppShell(pathname)` result the root route already computes —
 * this function only maps that boolean to a banner position, it does not
 * re-derive shell membership.
 */
export function resolvePwaInstallBannerPosition(hasAppShell: boolean): PwaInstallBannerPosition {
  return hasAppShell ? 'above-bottom-nav' : 'floating-bottom';
}

export function shouldDeferPwaAdvancedCapabilities(): boolean {
  return NOTIFICATIONS_PWA_ENGINE_BRANCHES.pwa_advanced_capabilities.engine === 'missing';
}
