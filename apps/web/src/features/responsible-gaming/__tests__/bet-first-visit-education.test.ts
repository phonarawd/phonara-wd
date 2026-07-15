import { beforeEach, describe, expect, it } from 'vitest';

import { FIRST_BET_EDUCATION_STORAGE_KEY } from '@/domain/operator-trust-pages-display-contract';
import {
  clearBetFirstVisitEducationDismiss,
  dismissBetFirstVisitEducation,
  isBetFirstVisitEducationDismissed,
} from '../bet-first-visit-education';

describe('bet-first-visit-education §32.5', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts undismissed', () => {
    expect(isBetFirstVisitEducationDismissed()).toBe(false);
  });

  it('persists dismiss in localStorage', () => {
    dismissBetFirstVisitEducation();
    expect(window.localStorage.getItem(FIRST_BET_EDUCATION_STORAGE_KEY)).toBe('1');
    expect(isBetFirstVisitEducationDismissed()).toBe(true);
  });

  it('clears dismiss storage', () => {
    dismissBetFirstVisitEducation();
    clearBetFirstVisitEducationDismiss();
    expect(isBetFirstVisitEducationDismissed()).toBe(false);
  });
});
