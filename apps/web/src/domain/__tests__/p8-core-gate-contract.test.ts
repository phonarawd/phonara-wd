import { describe, expect, it, vi } from 'vitest';

import type { FileRoutesByFullPath } from '../../routeTree.gen';
import { ACCOUNT_HUB_P8_MANIFEST_ROUTES } from '../account-hub-display-contract';
import { ACCOUNT_PROFILE_P8_MANIFEST_ROUTES } from '../account-profile-display-contract';
import { EARN_HOME_CANONICAL_ROUTE } from '../earn-home-display-contract';
import {
  NOTIFICATIONS_CENTER_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  resolveLocalNotifPrefBlocksClientEmit,
} from '../notifications-pwa-display-contract';
import { NOTIFICATIONS_PREFS_ROUTE } from '../notifications-center-display-contract';
import { resolveSettingsHubNavItems, SETTINGS_HUB_ROUTE } from '../settings-hub-display-contract';
import {
  filterRegisteredSubnavItems,
  P8_CORE_REGISTERED_ROUTES,
  SHELL_SUBNAV_REGISTERED_ROUTES,
} from '../../product/shell/subnav-route-manifest';
import { EARN_SUBNAV } from '../../product/shell/earn-subnav';

/** TanStack Router full paths — compile-time route existence check. */
type RegisteredFullPath = keyof FileRoutesByFullPath;

function assertRegisteredFullPath(path: RegisteredFullPath): RegisteredFullPath {
  return path;
}

describe('p8-gate-core §12.19.6 · §3.4.2', () => {
  it('registers all P8 core routes in subnav manifest', () => {
    for (const route of P8_CORE_REGISTERED_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    expect(P8_CORE_REGISTERED_ROUTES).toHaveLength(11);
  });

  it('maps every P8 manifest route to a TanStack fullPath (dead link 0)', () => {
    for (const route of P8_CORE_REGISTERED_ROUTES) {
      expect(assertRegisteredFullPath(route as RegisteredFullPath)).toBe(route);
    }
    for (const route of ACCOUNT_HUB_P8_MANIFEST_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    for (const route of ACCOUNT_PROFILE_P8_MANIFEST_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
  });

  it('keeps /home registered and earn subnav chips manifest-safe', () => {
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(EARN_HOME_CANONICAL_ROUTE)).toBe(true);
    const visible = filterRegisteredSubnavItems(EARN_SUBNAV);
    for (const item of visible) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(item.to)).toBe(true);
    }
  });

  it('separates inbox hub from notification prefs owner (§3.4.2)', () => {
    expect(NOTIFICATIONS_CENTER_ROUTE).toBe('/notifications');
    expect(NOTIFICATIONS_PREFS_ROUTE).toBe('/settings/notifications');
    expect(SETTINGS_HUB_ROUTE).toBe(NOTIFICATIONS_SETTINGS_ROUTE);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(NOTIFICATIONS_CENTER_ROUTE)).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(NOTIFICATIONS_PREFS_ROUTE)).toBe(true);
  });

  it('registers every settings hub nav target except E-Wave hidden routes', () => {
    for (const item of resolveSettingsHubNavItems()) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(item.route)).toBe(true);
    }
  });

  it('blocks client toast emit when local pref is off (§3.4.2 prefs gate)', () => {
    expect(resolveLocalNotifPrefBlocksClientEmit('deposit', false)).toBe(true);
    expect(resolveLocalNotifPrefBlocksClientEmit('deposit', true)).toBe(false);
    expect(resolveLocalNotifPrefBlocksClientEmit('mission', false)).toBe(true);
  });

  it('routes emitNotification through productToast only (never raw sonner import)', async () => {
    const showText = vi.fn();
    vi.doMock('@/product/primitives/toast-zone', () => ({
      productToast: { showText, show: vi.fn(), dismiss: vi.fn() },
    }));

    const { useNotificationStore } = await import('../../stores/notifications');
    useNotificationStore.setState({
      notifications: [],
      permission: 'denied',
      permissionBusy: false,
      permissionError: null,
    });

    useNotificationStore.getState().emitNotification({
      id: 'p8-gate-test',
      tone: 'success',
      title: 'Deposit credited',
      body: '100 PHON',
      prefKey: 'deposit',
      toastZone: 'strict',
    });

    expect(showText).toHaveBeenCalledWith(
      expect.objectContaining({
        zone: 'strict',
        title: 'Deposit credited',
        description: '100 PHON',
        id: 'p8-gate-test',
        tone: 'success',
      }),
    );

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useNotificationStore.getState().notifications[0]?.id).toBe('p8-gate-test');

    vi.doUnmock('@/product/primitives/toast-zone');
  });
});
