import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_LOCAL_PREF_KEYS,
  NOTIFICATIONS_CENTER_ROUTE,
  NOTIFICATIONS_INSTALL_ROUTE,
  NOTIFICATIONS_LAUNCH_GATE_DEFAULTS,
  NOTIFICATIONS_PWA_ENGINE_BRANCHES,
  NOTIFICATIONS_PWA_PLACEMENT,
  NOTIFICATIONS_PWA_UI_WIRE_STATUS,
  NOTIFICATIONS_SETTINGS_ROUTE,
  NOTIFICATIONS_ACCOUNT_ROUTE,
  PUSH_CONSENT_DOC_TYPE,
  resolveLocalNotifPrefBlocksClientEmit,
  resolveNotificationBranchExposure,
  resolveNotificationsCenterVisible,
  resolvePwaInstallBannerPosition,
  resolvePwaInstallBannerVisible,
  isServerBackedNotificationPref,
  shouldDeferPwaAdvancedCapabilities,
} from '../notifications-pwa-display-contract';

describe('notifications-pwa-display-contract', () => {
  it('locks E17 placement to /settings · /install · /account · /notifications · /trade', () => {
    expect(NOTIFICATIONS_PWA_PLACEMENT).toHaveLength(5);
    const routes = NOTIFICATIONS_PWA_PLACEMENT.map((row) => row.route);
    expect(routes).toContain(NOTIFICATIONS_SETTINGS_ROUTE);
    expect(routes).toContain(NOTIFICATIONS_INSTALL_ROUTE);
    expect(routes).toContain(NOTIFICATIONS_ACCOUNT_ROUTE);
    expect(routes).toContain(NOTIFICATIONS_CENTER_ROUTE);
  });

  it('documents EXISTS push + deposit paths (Phase 1 audit)', () => {
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.push_outbox.engine).toBe('exists');
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.push_subscriptions.engine).toBe('exists');
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.push_consent.source).toContain(PUSH_CONSENT_DOC_TYPE);
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.deposit_realtime.engine).toBe('exists');
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.deposit_push_enqueue.engine).toBe('exists');
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.pwa_install_prompt.engine).toBe('exists');
  });

  it('marks mission/referral/marketing as PARTIAL and center page as EXISTS', () => {
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.mission_push.engine).toBe('partial');
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.referral_push.engine).toBe('partial');
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.marketing_push.engine).toBe('partial');
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.notification_center_page.engine).toBe('exists');
    expect(NOTIFICATIONS_PWA_ENGINE_BRANCHES.pwa_advanced_capabilities.engine).toBe('missing');
  });

  it('hides notification center chrome when launch gate is false', () => {
    expect(NOTIFICATIONS_LAUNCH_GATE_DEFAULTS.notificationsCenter).toBe(false);
    expect(resolveNotificationsCenterVisible()).toBe(false);
    expect(resolveNotificationBranchExposure('notification_center_page')).toBe('built_hidden');
    expect(
      resolveNotificationBranchExposure('notification_center_page', { notificationsCenter: true }),
    ).toBe('live');
    expect(NOTIFICATIONS_PWA_UI_WIRE_STATUS['/notifications']).toBe('wired');
  });

  it('exposes live engine branches independent of notificationsCenter gate', () => {
    expect(resolveNotificationBranchExposure('push_outbox')).toBe('live');
    expect(resolveNotificationBranchExposure('deposit_realtime')).toBe('live');
    expect(resolveNotificationBranchExposure('pwa_install_guide')).toBe('live');
  });

  it('maps local pref keys and server-backed subset', () => {
    expect(NOTIFICATION_LOCAL_PREF_KEYS.deposit).toBe('phonara.settings.notifications.deposit');
    expect(isServerBackedNotificationPref('deposit')).toBe(true);
    expect(isServerBackedNotificationPref('priceAlert')).toBe(true);
    expect(isServerBackedNotificationPref('mission')).toBe(false);
    expect(resolveLocalNotifPrefBlocksClientEmit('deposit', false)).toBe(true);
    expect(resolveLocalNotifPrefBlocksClientEmit('deposit', true)).toBe(false);
  });

  it('hides PWA install banner on /install and when installed or dismissed', () => {
    expect(
      resolvePwaInstallBannerVisible({
        pathname: NOTIFICATIONS_INSTALL_ROUTE,
        isInstalled: false,
        isDismissed: false,
      }),
    ).toBe(false);
    expect(
      resolvePwaInstallBannerVisible({
        pathname: '/home',
        isInstalled: true,
        isDismissed: false,
      }),
    ).toBe(false);
    expect(
      resolvePwaInstallBannerVisible({
        pathname: '/home',
        isInstalled: false,
        isDismissed: false,
      }),
    ).toBe(true);
  });

  it('ZA-10: positions PWA banner above bottom-nav only when AppShell is mounted', () => {
    expect(resolvePwaInstallBannerPosition(true)).toBe('above-bottom-nav');
    expect(resolvePwaInstallBannerPosition(false)).toBe('floating-bottom');
  });

  it('defers E22 advanced PWA capabilities', () => {
    expect(shouldDeferPwaAdvancedCapabilities()).toBe(true);
    expect(resolveNotificationBranchExposure('pwa_advanced_capabilities')).toBe('defer_stub');
  });
});
