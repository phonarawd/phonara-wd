import { beforeEach, describe, expect, it } from 'vitest';

import { FIRST_TRADE_EDUCATION_STORAGE_KEY } from '@/domain/operator-trust-pages-display-contract';
import {
  clearTradeFirstVisitEducationDismiss,
  dismissTradeFirstVisitEducation,
  isTradeFirstVisitEducationDismissed,
} from '../trade-first-visit-education';

describe('trade-first-visit-education §32.5', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts undismissed', () => {
    expect(isTradeFirstVisitEducationDismissed()).toBe(false);
  });

  it('persists dismiss in localStorage', () => {
    dismissTradeFirstVisitEducation();
    expect(window.localStorage.getItem(FIRST_TRADE_EDUCATION_STORAGE_KEY)).toBe('1');
    expect(isTradeFirstVisitEducationDismissed()).toBe(true);
  });

  it('clears dismiss storage', () => {
    dismissTradeFirstVisitEducation();
    clearTradeFirstVisitEducationDismiss();
    expect(isTradeFirstVisitEducationDismissed()).toBe(false);
  });
});
