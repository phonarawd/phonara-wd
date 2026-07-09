import { requestPwaInstallBanner } from '@/features/pwa/pwa-install';

const AUTH_NUDGE_KEY = 'phonara.pwa.authNudge';

/** D11 — flag post-login install nudge (session-scoped). */
export function markAuthLoginForPwaInstall(): void {
  try {
    sessionStorage.setItem(AUTH_NUDGE_KEY, '1');
    requestPwaInstallBanner();
  } catch {
    // privacy mode / SSR
  }
}

export function peekAuthLoginPwaNudge(): boolean {
  try {
    return sessionStorage.getItem(AUTH_NUDGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearAuthLoginPwaNudge(): void {
  try {
    sessionStorage.removeItem(AUTH_NUDGE_KEY);
  } catch {
    // ignore
  }
}
