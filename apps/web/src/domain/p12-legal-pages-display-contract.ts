/**
 * P12 Legal pages bundle — owner contract for gate:ai-impl (#224).
 * Routes: `/legal/affiliate` · `/legal/cookies` (+ `/referral/terms` · `/cookies` redirects).
 * Authority: Plan §12.15 · §12.17 · §28.5 · §32.5 · prerequisite:p12-community-support-hub.
 */

export const P12_LEGAL_PAGES_TODO = 'p12-legal-pages' as const;

export const P12_LEGAL_PAGES_PREREQUISITE_TODO = 'p12-community-support-hub' as const;

/** Canonical legal routes shipped in this bundle. */
export const P12_LEGAL_PAGES_ROUTES = ['/legal/affiliate', '/legal/cookies'] as const;

export const P12_LEGAL_PAGES_REDIRECT_ALIASES: Readonly<Record<string, string>> = {
  '/referral/terms': '/legal/affiliate',
  '/cookies': '/legal/cookies',
};

export const P12_LEGAL_PAGES_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p12-legal-pages-display-contract.test.ts',
  'apps/web/src/domain/__tests__/legal-display-contract.test.ts',
  'apps/web/src/product/surfaces/legal/__tests__/affiliate-page.test.tsx',
  'apps/web/src/product/surfaces/legal/__tests__/cookies-page.test.tsx',
  'apps/web/src/product/routing/__tests__/resolve-route-redirect.test.ts',
  'apps/web/src/product/surfaces/landing/__tests__/landing-page.test.tsx',
] as const;

export const P12_LEGAL_PAGES_ARTIFACT_PATHS = [
  'domain/p12-legal-pages-display-contract.ts',
  'domain/legal-display-contract.ts',
  'product/surfaces/legal/affiliate-page.tsx',
  'product/surfaces/legal/affiliate-document-body.tsx',
  'product/surfaces/legal/cookies-page.tsx',
  'product/surfaces/legal/cookies-document-body.tsx',
  'product/surfaces/legal/legal-nav.tsx',
  'routes/legal/affiliate.tsx',
  'routes/legal/cookies.tsx',
] as const;

/** Non-waivable sync for P12 Legal pages closeout. */
export function assertP12LegalPagesSync(): void {
  if (P12_LEGAL_PAGES_TODO !== 'p12-legal-pages') {
    throw new Error('p12-legal-pages: todo id drift');
  }

  if (P12_LEGAL_PAGES_PREREQUISITE_TODO !== 'p12-community-support-hub') {
    throw new Error('p12-legal-pages: prerequisite drift');
  }

  if (P12_LEGAL_PAGES_ROUTES.length !== 2) {
    throw new Error('p12-legal-pages: must cover exactly 2 routes');
  }

  const expected = ['/legal/affiliate', '/legal/cookies'] as const;
  for (const route of expected) {
    if (!(P12_LEGAL_PAGES_ROUTES as readonly string[]).includes(route)) {
      throw new Error(`p12-legal-pages: missing route ${route}`);
    }
  }

  if (P12_LEGAL_PAGES_REDIRECT_ALIASES['/referral/terms'] !== '/legal/affiliate') {
    throw new Error('p12-legal-pages: /referral/terms redirect drift');
  }

  if (P12_LEGAL_PAGES_REDIRECT_ALIASES['/cookies'] !== '/legal/cookies') {
    throw new Error('p12-legal-pages: /cookies redirect drift');
  }

  if (P12_LEGAL_PAGES_TEST_PATHS.length < 4) {
    throw new Error('p12-legal-pages: owner test paths incomplete');
  }

  if (P12_LEGAL_PAGES_ARTIFACT_PATHS.length < 6) {
    throw new Error('p12-legal-pages: artifact paths incomplete');
  }
}
