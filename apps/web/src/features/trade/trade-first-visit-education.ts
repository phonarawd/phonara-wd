import { FIRST_TRADE_EDUCATION_STORAGE_KEY } from '@/domain/operator-trust-pages-display-contract';

const DISMISSED_VALUE = '1' as const;

/** User acknowledged trade first-visit education — permanent until cleared (§32.5). */
export function isTradeFirstVisitEducationDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(FIRST_TRADE_EDUCATION_STORAGE_KEY) === DISMISSED_VALUE;
  } catch {
    return false;
  }
}

export function dismissTradeFirstVisitEducation(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FIRST_TRADE_EDUCATION_STORAGE_KEY, DISMISSED_VALUE);
  } catch {
    // privacy mode
  }
}

export function clearTradeFirstVisitEducationDismiss(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(FIRST_TRADE_EDUCATION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
