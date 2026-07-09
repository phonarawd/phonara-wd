import { PWA_INSTALL_DISMISS_STORAGE_KEY } from '@/domain/notifications-pwa-display-contract';

export type PwaInstallPlatform = 'ios' | 'android' | 'desktop';

export const PWA_INSTALL_BANNER_SESSION_KEY = 'pwa.install.banner.session' as const;
export const PWA_INSTALL_BANNER_NUDGE_KEY = 'pwa.install.banner.nudge' as const;
export const PWA_INSTALL_DISMISS_DAYS = 7;

const IOS_UA = /iPad|iPhone|iPod/i;
const ANDROID_UA = /Android/i;

/** Standalone / installed PWA — hides install CTAs (§25.10). */
export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(display-mode: standalone)').matches
      : false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneQuery || iosStandalone;
}

export function detectPwaInstallPlatform(): PwaInstallPlatform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (IOS_UA.test(ua)) return 'ios';
  if (ANDROID_UA.test(ua)) return 'android';
  return 'desktop';
}

function readDismissedAt(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PWA_INSTALL_DISMISS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** User dismissed install banner — 7-day mute (§25.10). */
export function isPwaInstallDismissed(): boolean {
  const dismissedAt = readDismissedAt();
  if (dismissedAt === null) return false;
  const elapsedMs = Date.now() - dismissedAt;
  return elapsedMs < PWA_INSTALL_DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function dismissPwaInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PWA_INSTALL_DISMISS_STORAGE_KEY, String(Date.now()));
  } catch {
    // privacy mode
  }
}

export function clearPwaInstallDismiss(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PWA_INSTALL_DISMISS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function markPwaInstallBannerSessionShown(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PWA_INSTALL_BANNER_SESSION_KEY, '1');
  } catch {
    // ignore
  }
}

export function wasPwaInstallBannerShownThisSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(PWA_INSTALL_BANNER_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** Context nudge — post-login, deposit, reward (§25.10). */
export function requestPwaInstallBanner(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PWA_INSTALL_BANNER_NUDGE_KEY, '1');
  } catch {
    // ignore
  }
}

export function consumePwaInstallBannerNudge(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const active = window.sessionStorage.getItem(PWA_INSTALL_BANNER_NUDGE_KEY) === '1';
    if (active) {
      window.sessionStorage.removeItem(PWA_INSTALL_BANNER_NUDGE_KEY);
    }
    return active;
  } catch {
    return false;
  }
}

export function shouldShowPwaInstallBanner(params: { hasContextNudge: boolean }): boolean {
  if (isPwaStandalone()) return false;
  if (isPwaInstallDismissed()) return false;
  if (wasPwaInstallBannerShownThisSession()) return false;
  return params.hasContextNudge;
}
