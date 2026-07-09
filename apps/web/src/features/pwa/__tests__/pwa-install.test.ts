import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PWA_INSTALL_DISMISS_STORAGE_KEY } from '@/domain/notifications-pwa-display-contract';

import {
  clearPwaInstallDismiss,
  detectPwaInstallPlatform,
  dismissPwaInstallPrompt,
  isPwaInstallDismissed,
  isPwaStandalone,
  markPwaInstallBannerSessionShown,
  PWA_INSTALL_BANNER_NUDGE_KEY,
  PWA_INSTALL_DISMISS_DAYS,
  requestPwaInstallBanner,
  shouldShowPwaInstallBanner,
  wasPwaInstallBannerShownThisSession,
} from '../pwa-install';

describe('pwa-install', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as typeof window.matchMedia;
  });

  it('detects iOS user agents', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });
    expect(detectPwaInstallPlatform()).toBe('ios');
  });

  it('detects Android user agents', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 14) Chrome/120.0',
    });
    expect(detectPwaInstallPlatform()).toBe('android');
  });

  it('treats standalone display mode as installed', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as typeof window.matchMedia;

    expect(isPwaStandalone()).toBe(true);
  });

  it('stores dismiss timestamp for seven-day mute', () => {
    dismissPwaInstallPrompt();
    expect(window.localStorage.getItem(PWA_INSTALL_DISMISS_STORAGE_KEY)).toBeTruthy();
    expect(isPwaInstallDismissed()).toBe(true);

    const stale = Date.now() - (PWA_INSTALL_DISMISS_DAYS + 1) * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(PWA_INSTALL_DISMISS_STORAGE_KEY, String(stale));
    expect(isPwaInstallDismissed()).toBe(false);
  });

  it('clears dismiss storage', () => {
    dismissPwaInstallPrompt();
    clearPwaInstallDismiss();
    expect(isPwaInstallDismissed()).toBe(false);
  });

  it('caps contextual banner to one session nudge', () => {
    requestPwaInstallBanner();
    expect(shouldShowPwaInstallBanner({ hasContextNudge: true })).toBe(true);

    markPwaInstallBannerSessionShown();
    expect(wasPwaInstallBannerShownThisSession()).toBe(true);
    expect(shouldShowPwaInstallBanner({ hasContextNudge: true })).toBe(false);
    expect(window.sessionStorage.getItem(PWA_INSTALL_BANNER_NUDGE_KEY)).toBe('1');
  });

  it('hides banner when dismissed', () => {
    dismissPwaInstallPrompt();
    expect(shouldShowPwaInstallBanner({ hasContextNudge: true })).toBe(false);
  });
});
