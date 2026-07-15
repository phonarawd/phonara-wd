import { describe, expect, it } from 'vitest';

import {
  assertP12LegalPagesSync,
  P12_LEGAL_PAGES_PREREQUISITE_TODO,
  P12_LEGAL_PAGES_REDIRECT_ALIASES,
  P12_LEGAL_PAGES_ROUTES,
  P12_LEGAL_PAGES_TODO,
} from '../p12-legal-pages-display-contract';

describe('p12-legal-pages-display-contract', () => {
  it('binds P12 todo, prerequisite, two routes, and redirect aliases', () => {
    expect(P12_LEGAL_PAGES_TODO).toBe('p12-legal-pages');
    expect(P12_LEGAL_PAGES_PREREQUISITE_TODO).toBe('p12-community-support-hub');
    expect([...P12_LEGAL_PAGES_ROUTES]).toEqual(['/legal/affiliate', '/legal/cookies']);
    expect(P12_LEGAL_PAGES_REDIRECT_ALIASES['/referral/terms']).toBe('/legal/affiliate');
    expect(P12_LEGAL_PAGES_REDIRECT_ALIASES['/cookies']).toBe('/legal/cookies');
    expect(() => assertP12LegalPagesSync()).not.toThrow();
  });
});
