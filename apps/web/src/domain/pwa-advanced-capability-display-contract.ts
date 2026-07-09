/**
 * PWA advanced capabilities — Phase 1 E22 discovery contract.
 * Share Target, App Badging, Periodic Background Sync, File/Protocol Handlers scope lock.
 * All net-new work is front-end only (manifest + SW + client hooks) — no engine/RPC dependency.
 *
 * Authority: plan §21 · `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E22 · E17 cross-ref
 */

import {
  NOTIFICATIONS_INSTALL_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
} from './notifications-pwa-display-contract';

/** Phase 8 net-new implementation owners (ROUTE_ENGINE_CONTRACT). */
export const PWA_ADVANCED_INSTALL_ROUTE = NOTIFICATIONS_INSTALL_ROUTE;
export const PWA_ADVANCED_SETTINGS_ROUTE = NOTIFICATIONS_SETTINGS_ROUTE;

/** Share Target landing — receives OS share sheet POST; no new canonical product URL. */
export const PWA_SHARE_TARGET_ROUTE = '/share' as const;

export const PWA_MANIFEST_SOURCE = 'apps/web/vite.config.ts VitePWA manifest' as const;
export const PWA_MANIFEST_STATIC = 'apps/web/public/manifest.webmanifest' as const;
export const PWA_SW_SOURCE = 'apps/web/src/sw.ts' as const;

export type PwaAdvancedCapabilityBranch =
  | 'share_target'
  | 'app_badging'
  | 'periodic_background_sync'
  | 'one_off_background_sync'
  | 'file_handlers'
  | 'protocol_handlers'
  | 'launch_handler'
  | 'app_shortcuts'
  | 'offline_fallback'
  | 'sw_update_toast'
  | 'web_push_sw';

export type PwaCapabilityEngineStatus = 'exists' | 'partial' | 'missing';

export type PwaAdvancedExposureMode = 'live' | 'built_hidden' | 'defer_stub' | 'backlog';

export type PwaImplementationPriority = 'high' | 'medium' | 'low';

export type PwaBrowserSupportTier = 'full' | 'partial' | 'none';

/** Phase 1 repo audit (2026-07-02) — manifest + SW file grep. */
export const PWA_ADVANCED_CAPABILITY_BRANCHES: Readonly<
  Record<
    PwaAdvancedCapabilityBranch,
    {
      engine: PwaCapabilityEngineStatus;
      source: string;
      moneyPath: boolean;
      implementationPriority: PwaImplementationPriority | null;
      phase8Exposure: PwaAdvancedExposureMode;
    }
  >
> = {
  share_target: {
    engine: 'missing',
    source: 'manifest share_target · POST handler route',
    moneyPath: false,
    implementationPriority: 'high',
    phase8Exposure: 'defer_stub',
  },
  app_badging: {
    engine: 'missing',
    source: 'navigator.setAppBadge · clearAppBadge hook',
    moneyPath: false,
    implementationPriority: 'high',
    phase8Exposure: 'defer_stub',
  },
  periodic_background_sync: {
    engine: 'missing',
    source: 'sw.ts periodicSync · registration.periodicSync.register',
    moneyPath: false,
    implementationPriority: 'medium',
    phase8Exposure: 'defer_stub',
  },
  one_off_background_sync: {
    engine: 'missing',
    source: 'sw.ts sync event · Background Sync API',
    moneyPath: false,
    implementationPriority: 'medium',
    phase8Exposure: 'backlog',
  },
  file_handlers: {
    engine: 'missing',
    source: 'manifest file_handlers (receipt/statement MIME)',
    moneyPath: false,
    implementationPriority: 'low',
    phase8Exposure: 'backlog',
  },
  protocol_handlers: {
    engine: 'missing',
    source: 'manifest protocol_handlers web+phonara',
    moneyPath: false,
    implementationPriority: 'low',
    phase8Exposure: 'backlog',
  },
  launch_handler: {
    engine: 'missing',
    source: 'manifest launch_handler client_mode',
    moneyPath: false,
    implementationPriority: 'low',
    phase8Exposure: 'backlog',
  },
  app_shortcuts: {
    engine: 'exists',
    source: 'vite.config.ts · manifest shortcuts (Trade/Wallet/Casino)',
    moneyPath: false,
    implementationPriority: null,
    phase8Exposure: 'live',
  },
  offline_fallback: {
    engine: 'exists',
    source: 'sw.ts navigate fetch · /offline.html',
    moneyPath: false,
    implementationPriority: null,
    phase8Exposure: 'live',
  },
  sw_update_toast: {
    engine: 'exists',
    source:
      'product/shell/pwa-shell.tsx · virtual:pwa-register onNeedRefresh · productToast strict',
    moneyPath: false,
    implementationPriority: null,
    phase8Exposure: 'live',
  },
  web_push_sw: {
    engine: 'exists',
    source: 'sw.ts push · notificationclick',
    moneyPath: false,
    implementationPriority: null,
    phase8Exposure: 'live',
  },
};

/** Browser support matrix for progressive enhancement (plan §21.1). */
export const PWA_ADVANCED_BROWSER_SUPPORT: Readonly<
  Record<
    PwaAdvancedCapabilityBranch,
    {
      chromeAndroid: PwaBrowserSupportTier;
      chromeDesktop: PwaBrowserSupportTier;
      safariIos: PwaBrowserSupportTier;
      firefox: PwaBrowserSupportTier;
      notes: string;
    }
  >
> = {
  share_target: {
    chromeAndroid: 'full',
    chromeDesktop: 'partial',
    safariIos: 'none',
    firefox: 'none',
    notes: 'Android share sheet → PWA; desktop limited; iOS no Web Share Target',
  },
  app_badging: {
    chromeAndroid: 'full',
    chromeDesktop: 'full',
    safariIos: 'partial',
    firefox: 'none',
    notes: 'Badge on installed icon; iOS 16.4+ PWA only; no Firefox',
  },
  periodic_background_sync: {
    chromeAndroid: 'full',
    chromeDesktop: 'none',
    safariIos: 'none',
    firefox: 'none',
    notes: 'Android Chrome only — balance/notify prefetch optional',
  },
  one_off_background_sync: {
    chromeAndroid: 'partial',
    chromeDesktop: 'partial',
    safariIos: 'none',
    firefox: 'none',
    notes: 'Retry failed fetches; lower priority than periodic',
  },
  file_handlers: {
    chromeAndroid: 'partial',
    chromeDesktop: 'partial',
    safariIos: 'none',
    firefox: 'none',
    notes: 'PDF/CSV receipt open — launch backlog OK',
  },
  protocol_handlers: {
    chromeAndroid: 'partial',
    chromeDesktop: 'partial',
    safariIos: 'none',
    firefox: 'none',
    notes: 'web+phonara:// deep links — launch backlog OK',
  },
  launch_handler: {
    chromeAndroid: 'partial',
    chromeDesktop: 'partial',
    safariIos: 'none',
    firefox: 'none',
    notes: 'Single-instance navigate vs new window',
  },
  app_shortcuts: {
    chromeAndroid: 'full',
    chromeDesktop: 'full',
    safariIos: 'partial',
    firefox: 'partial',
    notes: 'Already shipped — 3 shortcuts',
  },
  offline_fallback: {
    chromeAndroid: 'full',
    chromeDesktop: 'full',
    safariIos: 'full',
    firefox: 'full',
    notes: 'Cache-first navigate fallback',
  },
  sw_update_toast: {
    chromeAndroid: 'full',
    chromeDesktop: 'full',
    safariIos: 'full',
    firefox: 'full',
    notes: 'Prod SW register only',
  },
  web_push_sw: {
    chromeAndroid: 'full',
    chromeDesktop: 'full',
    safariIos: 'partial',
    firefox: 'partial',
    notes: 'iOS 16.4+ installed PWA; VAPID required',
  },
};

export type PwaAdvancedSurfacePlacement = {
  route:
    | typeof PWA_ADVANCED_INSTALL_ROUTE
    | typeof PWA_ADVANCED_SETTINGS_ROUTE
    | typeof PWA_SHARE_TARGET_ROUTE;
  role:
    | 'pwa_install_advanced_docs'
    | 'badge_pref_toggle'
    | 'share_target_receiver'
    | 'background_sync_status';
  hook: string;
  phase8Todo: string;
};

export const PWA_ADVANCED_SURFACE_PLACEMENT: Readonly<PwaAdvancedSurfacePlacement[]> = [
  {
    route: PWA_ADVANCED_INSTALL_ROUTE,
    role: 'pwa_install_advanced_docs',
    hook: 'ImportedPWAInstallPage · net-new DS v2 section',
    phase8Todo: 'p8-route-install',
  },
  {
    route: PWA_ADVANCED_SETTINGS_ROUTE,
    role: 'badge_pref_toggle',
    hook: 'ImportedSettingsPage · app icon badge opt-in',
    phase8Todo: 'p8-route-settings',
  },
  {
    route: PWA_SHARE_TARGET_ROUTE,
    role: 'share_target_receiver',
    hook: 'ShareTargetPage · parse shared URL/text → referral CTA',
    phase8Todo: 'p8-route-install',
  },
  {
    route: PWA_ADVANCED_SETTINGS_ROUTE,
    role: 'background_sync_status',
    hook: 'ImportedSettingsPage · read-only sync support hint',
    phase8Todo: 'p8-route-settings',
  },
];

/** Phase 8 net-new implementation backlog (front-end only). */
export const PWA_ADVANCED_IMPLEMENTATION_BACKLOG: Readonly<
  Array<{
    branch: PwaAdvancedCapabilityBranch;
    priority: PwaImplementationPriority;
    files: readonly string[];
    acceptance: string;
  }>
> = [
  {
    branch: 'share_target',
    priority: 'high',
    files: [
      PWA_MANIFEST_SOURCE,
      PWA_MANIFEST_STATIC,
      'apps/web/src/routes/share.tsx',
      'apps/web/src/features/pwa/use-share-target-intent.ts',
    ],
    acceptance:
      'manifest share_target action/params · POST /share handler · referral link prefill without ledger mutation',
  },
  {
    branch: 'app_badging',
    priority: 'high',
    files: [
      'apps/web/src/features/pwa/use-app-badge.ts',
      'apps/web/src/components/global-notification-subscriptions.tsx',
    ],
    acceptance:
      'setAppBadge from unread count (notificationsCenter gate) · clearAppBadge on read · settings opt-out',
  },
  {
    branch: 'periodic_background_sync',
    priority: 'medium',
    files: [PWA_SW_SOURCE, 'apps/web/src/features/pwa/register-periodic-sync.ts'],
    acceptance:
      'registration.periodicSync when supported · SW tag refresh stub · graceful no-op elsewhere',
  },
  {
    branch: 'file_handlers',
    priority: 'low',
    files: [PWA_MANIFEST_SOURCE, PWA_MANIFEST_STATIC],
    acceptance: 'Defer — optional PDF/CSV open route; no launch blocker',
  },
  {
    branch: 'protocol_handlers',
    priority: 'low',
    files: [PWA_MANIFEST_SOURCE, PWA_MANIFEST_STATIC],
    acceptance: 'Defer — web+phonara:// handler; deep link parity with existing URL routes',
  },
];

/** Phase 1 UI wire — all E22 net-new surfaces unwired until Phase 8. */
export const PWA_ADVANCED_UI_WIRE_STATUS: Readonly<
  Record<
    | 'share_target_receiver'
    | 'app_badge_hook'
    | 'periodic_sync_registration'
    | 'file_handler_route'
    | 'protocol_handler_route',
    PwaAdvancedExposureMode
  >
> = {
  share_target_receiver: 'defer_stub',
  app_badge_hook: 'defer_stub',
  periodic_sync_registration: 'defer_stub',
  file_handler_route: 'backlog',
  protocol_handler_route: 'backlog',
};

export function resolvePwaAdvancedBranchExposure(
  branch: PwaAdvancedCapabilityBranch,
): PwaAdvancedExposureMode {
  const row = PWA_ADVANCED_CAPABILITY_BRANCHES[branch];
  if (row.engine === 'exists') return 'live';
  if (row.phase8Exposure === 'backlog') return 'backlog';
  return 'defer_stub';
}

export function isPwaAdvancedNetNewBranch(branch: PwaAdvancedCapabilityBranch): boolean {
  return PWA_ADVANCED_CAPABILITY_BRANCHES[branch].implementationPriority !== null;
}

export function shouldDeferPwaAdvancedNetNewImplementation(): boolean {
  return PWA_ADVANCED_IMPLEMENTATION_BACKLOG.some(
    (item) => item.priority === 'high' || item.priority === 'medium',
  );
}

export function getPwaAdvancedLaunchBlockers(): readonly PwaAdvancedCapabilityBranch[] {
  return (['share_target', 'app_badging'] as const).filter(
    (branch) => PWA_ADVANCED_CAPABILITY_BRANCHES[branch].engine === 'missing',
  );
}

export function requiresEngineRpcForPwaAdvanced(branch: PwaAdvancedCapabilityBranch): boolean {
  void branch;
  return false;
}

export function countExistingPwaBaselineCapabilities(): number {
  return Object.values(PWA_ADVANCED_CAPABILITY_BRANCHES).filter((row) => row.engine === 'exists')
    .length;
}

export function countMissingPwaAdvancedCapabilities(): number {
  return Object.values(PWA_ADVANCED_CAPABILITY_BRANCHES).filter((row) => row.engine === 'missing')
    .length;
}
