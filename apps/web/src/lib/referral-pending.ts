const PENDING_REF_KEY = 'phonara.pendingReferralCode';

export function setPendingReferralCode(code: string): void {
  try {
    const trimmed = code.trim();
    if (!trimmed) return;
    window.sessionStorage.setItem(PENDING_REF_KEY, trimmed);
  } catch {
    // privacy mode
  }
}

export function getPendingReferralCode(): string | null {
  try {
    const value = window.sessionStorage.getItem(PENDING_REF_KEY);
    return value?.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function clearPendingReferralCode(): void {
  try {
    window.sessionStorage.removeItem(PENDING_REF_KEY);
  } catch {
    // ignore
  }
}
