/** Returning-user marker — set on signup/login success; survives sign-out (§28.4). */
export const HAS_ACCOUNT_STORAGE_KEY = 'pf.hasAccount';

export function markHasAccount(): void {
  try {
    localStorage.setItem(HAS_ACCOUNT_STORAGE_KEY, '1');
  } catch {
    // privacy mode / SSR
  }
}

export function hasAccountMarker(): boolean {
  try {
    return localStorage.getItem(HAS_ACCOUNT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
