/**
 * P12 Community+support hub bundle — owner contract for gate:ai-impl (#223).
 * Routes: `/announcements` · `/status` STUB · `/support/ticket` STUB · `/support` · `/support/faq` · `/feedback`.
 * Authority: Plan §12.12 · §12.16 · §32.5 · prerequisite:p12-trust-marketing-hub.
 */

export const P12_COMMUNITY_SUPPORT_HUB_TODO = 'p12-community-support-hub' as const;

export const P12_COMMUNITY_SUPPORT_HUB_PREREQUISITE_TODO = 'p12-trust-marketing-hub' as const;

/** Canonical community+support routes shipped in this bundle. */
export const P12_COMMUNITY_SUPPORT_HUB_ROUTES = [
  '/announcements',
  '/status',
  '/support',
  '/support/faq',
  '/support/ticket',
  '/feedback',
] as const;

/** Live IA routes — STUBs stay out of footer/nav until engine unlock. */
export const P12_COMMUNITY_SUPPORT_HUB_LIVE_ROUTES = [
  '/announcements',
  '/support',
  '/support/faq',
  '/feedback',
] as const;

export const P12_COMMUNITY_SUPPORT_HUB_STUB_ROUTES = ['/status', '/support/ticket'] as const;

export const P12_COMMUNITY_SUPPORT_HUB_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p12-community-support-hub-display-contract.test.ts',
  'apps/web/src/domain/__tests__/announcements-display-contract.test.ts',
  'apps/web/src/domain/__tests__/support-hub-display-contract.test.ts',
  'apps/web/src/domain/__tests__/system-status-display-contract.test.ts',
  'apps/web/src/domain/__tests__/feedback-display-contract.test.ts',
  'apps/web/src/product/surfaces/marketing/__tests__/announcements-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/support-hub-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/support-faq-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/support-ticket-stub-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/system-status-stub-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/feedback-page.test.tsx',
  'apps/web/src/product/shell/__tests__/shell-route-matchers.test.ts',
] as const;

export const P12_COMMUNITY_SUPPORT_HUB_ARTIFACT_PATHS = [
  'domain/p12-community-support-hub-display-contract.ts',
  'domain/announcements-display-contract.ts',
  'domain/support-hub-display-contract.ts',
  'domain/system-status-display-contract.ts',
  'domain/feedback-display-contract.ts',
  'product/surfaces/marketing/announcements-page.tsx',
  'product/surfaces/marketing/support-hub-page.tsx',
  'product/surfaces/marketing/support-faq-page.tsx',
  'product/surfaces/marketing/support-ticket-stub-page.tsx',
  'product/surfaces/marketing/system-status-stub-page.tsx',
  'product/surfaces/marketing/feedback-page.tsx',
  'routes/announcements.tsx',
  'routes/status.tsx',
  'routes/support.index.tsx',
  'routes/support.faq.tsx',
  'routes/support.ticket.tsx',
  'routes/feedback.tsx',
] as const;

/** Non-waivable sync for P12 Community+support hub closeout. */
export function assertP12CommunitySupportHubSync(): void {
  if (P12_COMMUNITY_SUPPORT_HUB_TODO !== 'p12-community-support-hub') {
    throw new Error('p12-community-support-hub: todo id drift');
  }

  if (P12_COMMUNITY_SUPPORT_HUB_PREREQUISITE_TODO !== 'p12-trust-marketing-hub') {
    throw new Error('p12-community-support-hub: prerequisite drift');
  }

  if (P12_COMMUNITY_SUPPORT_HUB_ROUTES.length !== 6) {
    throw new Error('p12-community-support-hub: must cover exactly 6 routes');
  }

  const expected = [
    '/announcements',
    '/status',
    '/support',
    '/support/faq',
    '/support/ticket',
    '/feedback',
  ] as const;
  for (const route of expected) {
    if (!(P12_COMMUNITY_SUPPORT_HUB_ROUTES as readonly string[]).includes(route)) {
      throw new Error(`p12-community-support-hub: missing route ${route}`);
    }
  }

  if (P12_COMMUNITY_SUPPORT_HUB_STUB_ROUTES.length !== 2) {
    throw new Error('p12-community-support-hub: stub routes drift');
  }

  if (P12_COMMUNITY_SUPPORT_HUB_TEST_PATHS.length < 8) {
    throw new Error('p12-community-support-hub: owner test paths incomplete');
  }

  if (P12_COMMUNITY_SUPPORT_HUB_ARTIFACT_PATHS.length < 10) {
    throw new Error('p12-community-support-hub: artifact paths incomplete');
  }
}
