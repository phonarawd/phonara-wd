/**
 * P12 Trust+marketing hub bundle — owner contract for gate:ai-impl (#222).
 * Routes: `/tier` · `/features` · `/features/earn` · `/features/vip` · `/fees` · `/security`.
 * Authority: Plan §3.5 · §12.0β Public · PLATFORM_NARRATIVE_CANON · prerequisite:p11-gate-side-income.
 */

export const P12_TRUST_MARKETING_HUB_TODO = 'p12-trust-marketing-hub' as const;

export const P12_TRUST_MARKETING_HUB_PREREQUISITE_TODO = 'p11-gate-side-income' as const;

/** Canonical public marketing routes shipped in this bundle. */
export const P12_TRUST_MARKETING_HUB_ROUTES = [
  '/tier',
  '/features',
  '/features/earn',
  '/features/vip',
  '/fees',
  '/security',
] as const;

export const P12_TRUST_MARKETING_HUB_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts',
  'apps/web/src/domain/__tests__/tier-guide-display-contract.test.ts',
  'apps/web/src/domain/__tests__/features-hub-display-contract.test.ts',
  'apps/web/src/domain/__tests__/fees-page-display-contract.test.ts',
  'apps/web/src/domain/__tests__/trust-hub-display-contract.test.ts',
  'apps/web/src/product/surfaces/marketing/__tests__/tier-guide-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/features-hub-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/features-earn-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/features-vip-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/fees-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/trust-security-page.test.tsx',
  'apps/web/src/product/shell/__tests__/shell-route-matchers.test.ts',
] as const;

export const P12_TRUST_MARKETING_HUB_ARTIFACT_PATHS = [
  'domain/p12-trust-marketing-hub-display-contract.ts',
  'domain/tier-guide-display-contract.ts',
  'domain/features-hub-display-contract.ts',
  'domain/fees-page-display-contract.ts',
  'domain/trust-hub-display-contract.ts',
  'product/surfaces/marketing/tier-guide-page.tsx',
  'product/surfaces/marketing/features-hub-page.tsx',
  'product/surfaces/marketing/features-earn-page.tsx',
  'product/surfaces/marketing/features-vip-page.tsx',
  'product/surfaces/marketing/fees-page.tsx',
  'product/surfaces/marketing/trust-security-page.tsx',
  'routes/tier.index.tsx',
  'routes/features.index.tsx',
  'routes/features.earn.tsx',
  'routes/features.vip.tsx',
  'routes/fees.tsx',
  'routes/security.tsx',
] as const;

/** Non-waivable sync for P12 Trust+marketing hub closeout. */
export function assertP12TrustMarketingHubSync(): void {
  if (P12_TRUST_MARKETING_HUB_TODO !== 'p12-trust-marketing-hub') {
    throw new Error('p12-trust-marketing-hub: todo id drift');
  }

  if (P12_TRUST_MARKETING_HUB_PREREQUISITE_TODO !== 'p11-gate-side-income') {
    throw new Error('p12-trust-marketing-hub: prerequisite drift');
  }

  if (P12_TRUST_MARKETING_HUB_ROUTES.length !== 6) {
    throw new Error('p12-trust-marketing-hub: must cover exactly 6 routes');
  }

  const expected = [
    '/tier',
    '/features',
    '/features/earn',
    '/features/vip',
    '/fees',
    '/security',
  ] as const;
  for (const route of expected) {
    if (!(P12_TRUST_MARKETING_HUB_ROUTES as readonly string[]).includes(route)) {
      throw new Error(`p12-trust-marketing-hub: missing route ${route}`);
    }
  }

  if (P12_TRUST_MARKETING_HUB_TEST_PATHS.length < 8) {
    throw new Error('p12-trust-marketing-hub: owner test paths incomplete');
  }

  if (P12_TRUST_MARKETING_HUB_ARTIFACT_PATHS.length < 10) {
    throw new Error('p12-trust-marketing-hub: artifact paths incomplete');
  }
}
