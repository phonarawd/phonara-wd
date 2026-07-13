import { FIRST_BET_EDUCATION_STORAGE_KEY } from '@/domain/operator-trust-pages-display-contract';

const DISMISSED_VALUE = '1' as const;

/** User acknowledged sports+casino first-visit education — permanent until cleared (§32.5). */
export function isBetFirstVisitEducationDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(FIRST_BET_EDUCATION_STORAGE_KEY) === DISMISSED_VALUE;
  } catch {
    return false;
  }
}

export function dismissBetFirstVisitEducation(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FIRST_BET_EDUCATION_STORAGE_KEY, DISMISSED_VALUE);
  } catch {
    // privacy mode
  }
}

export function clearBetFirstVisitEducationDismiss(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(FIRST_BET_EDUCATION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
