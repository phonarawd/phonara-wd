/**
 * P12 Marketing+Community+Operator trust Part GATE (§3.5 · §12.0β · §28.5 · §32.5 · YAML #225).
 * Authority: `p12-gate-marketing` · REBUILD_PLAN_v1 · ACTIVE_WORK_SSOT.
 *
 * Bundle closeout for trust hub + community/support + legal pages.
 * GATE does not re-implement surfaces — asserts manifest · routes · footer · redirects · education.
 */

import {
  assertP12CommunitySupportHubSync,
  P12_COMMUNITY_SUPPORT_HUB_LIVE_ROUTES,
  P12_COMMUNITY_SUPPORT_HUB_TODO,
} from './p12-community-support-hub-display-contract';
import {
  assertP12LegalPagesSync,
  P12_LEGAL_PAGES_REDIRECT_ALIASES,
  P12_LEGAL_PAGES_ROUTES,
  P12_LEGAL_PAGES_TODO,
} from './p12-legal-pages-display-contract';
import {
  assertP12TrustMarketingHubSync,
  P12_TRUST_MARKETING_HUB_ROUTES,
  P12_TRUST_MARKETING_HUB_TODO,
} from './p12-trust-marketing-hub-display-contract';
import {
  FIRST_BET_EDUCATION_STORAGE_KEY,
  FIRST_TRADE_EDUCATION_STORAGE_KEY,
  OPERATOR_TRUST_AFFILIATE_LEGAL_ROUTE,
  OPERATOR_TRUST_COOKIES_ROUTE,
  OPERATOR_TRUST_FAQ_ROUTE,
  OPERATOR_TRUST_FEEDBACK_ROUTE,
  OPERATOR_TRUST_FOOTER_ROUTES,
  OPERATOR_TRUST_PAGE_ROUTES,
  OPERATOR_TRUST_REDIRECT_ALIASES,
} from './operator-trust-pages-display-contract';
import { LEGAL_AFFILIATE_ROUTE, LEGAL_COOKIES_ROUTE } from './legal-display-contract';

export const P12_GATE_MARKETING_TODO = 'p12-gate-marketing' as const;

/** Immediate prerequisites — all three P12 UI hubs must be closed before GATE. */
export const P12_GATE_MARKETING_PREREQUISITE_TODOS = [
  P12_TRUST_MARKETING_HUB_TODO,
  P12_COMMUNITY_SUPPORT_HUB_TODO,
  P12_LEGAL_PAGES_TODO,
] as const;

/** Next Track A todo after this GATE (§20.6 · DA W8). */
export const DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO = 'da-w8-signature-surfaces-bundle' as const;

/**
 * §32.5 P12 GATE operator-trust routes — FAQ · feedback · affiliate · cookies.
 * FAIL if any missing from footer / redirects / surfaces.
 */
export const P12_GATE_MARKETING_OPERATOR_TRUST_ROUTES = OPERATOR_TRUST_PAGE_ROUTES;

/** Existing marketing surfaces from `p12-trust-marketing-hub`. */
export const P12_GATE_MARKETING_TRUST_HUB_ROUTES = P12_TRUST_MARKETING_HUB_ROUTES;

/** Live community+support routes (STUBs excluded from footer requirement). */
export const P12_GATE_MARKETING_COMMUNITY_LIVE_ROUTES = P12_COMMUNITY_SUPPORT_HUB_LIVE_ROUTES;

/** Legal pages shipped in `p12-legal-pages`. */
export const P12_GATE_MARKETING_LEGAL_ROUTES = P12_LEGAL_PAGES_ROUTES;

/** Footer must expose FAQ + feedback (§32.5 FAIL). */
export const P12_GATE_MARKETING_FOOTER_REQUIRED_ROUTES = [
  OPERATOR_TRUST_FAQ_ROUTE,
  OPERATOR_TRUST_FEEDBACK_ROUTE,
  OPERATOR_TRUST_AFFILIATE_LEGAL_ROUTE,
  OPERATOR_TRUST_COOKIES_ROUTE,
] as const;

/** §12.17 / §32.5 redirect aliases owned by this GATE. */
export const P12_GATE_MARKETING_REDIRECT_ALIASES = OPERATOR_TRUST_REDIRECT_ALIASES;

/** First-visit education — localStorage dismiss (not every visit) · §32.5 FAIL. */
export const P12_GATE_MARKETING_EDUCATION_STORAGE_KEYS = [
  FIRST_TRADE_EDUCATION_STORAGE_KEY,
  FIRST_BET_EDUCATION_STORAGE_KEY,
] as const;

/** On-disk artifacts required for P12 GATE. */
export const P12_GATE_MARKETING_ARTIFACT_PATHS = [
  'domain/p12-gate-marketing-display-contract.ts',
  'domain/p12-trust-marketing-hub-display-contract.ts',
  'domain/p12-community-support-hub-display-contract.ts',
  'domain/p12-legal-pages-display-contract.ts',
  'domain/operator-trust-pages-display-contract.ts',
  'domain/legal-display-contract.ts',
  'product/surfaces/landing/landing-footer.tsx',
  'product/surfaces/landing/ads-consent-sheet.tsx',
  'product/surfaces/referral/referral-page.tsx',
  'product/surfaces/marketing/support-faq-page.tsx',
  'product/surfaces/marketing/feedback-page.tsx',
  'product/surfaces/legal/affiliate-page.tsx',
  'product/surfaces/legal/cookies-page.tsx',
  'product/routing/route-redirect-registry.ts',
  'features/responsible-gaming/bet-first-visit-education.ts',
  'routes/support.faq.tsx',
  'routes/feedback.tsx',
  'routes/legal/affiliate.tsx',
  'routes/legal/cookies.tsx',
] as const;

/** gate:ai-impl owner paths — GATE + prerequisite hub owners. */
export const P12_GATE_MARKETING_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p12-gate-marketing-display-contract.test.ts',
  'apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts',
  'apps/web/src/domain/__tests__/p12-community-support-hub-display-contract.test.ts',
  'apps/web/src/domain/__tests__/p12-legal-pages-display-contract.test.ts',
  'apps/web/src/domain/__tests__/operator-trust-pages-display-contract.test.ts',
  'apps/web/src/domain/__tests__/legal-display-contract.test.ts',
  'apps/web/src/product/surfaces/landing/__tests__/landing-page.test.tsx',
  'apps/web/src/product/surfaces/landing/__tests__/ads-consent-sheet.test.tsx',
  'apps/web/src/product/surfaces/legal/__tests__/affiliate-page.test.tsx',
  'apps/web/src/product/surfaces/legal/__tests__/cookies-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/support-faq-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/feedback-page.test.tsx',
  'apps/web/src/product/routing/__tests__/resolve-route-redirect.test.ts',
  'apps/web/src/features/responsible-gaming/__tests__/bet-first-visit-education.test.ts',
] as const;

/** Non-waivable sync for P12 Marketing GATE closeout. */
export function assertP12GateMarketingSync(): void {
  if (P12_GATE_MARKETING_TODO !== 'p12-gate-marketing') {
    throw new Error('p12-gate-marketing: todo id drift');
  }

  if (!P12_GATE_MARKETING_PREREQUISITE_TODOS.includes(P12_TRUST_MARKETING_HUB_TODO)) {
    throw new Error('p12-gate-marketing: missing prerequisite p12-trust-marketing-hub');
  }

  if (!P12_GATE_MARKETING_PREREQUISITE_TODOS.includes(P12_COMMUNITY_SUPPORT_HUB_TODO)) {
    throw new Error('p12-gate-marketing: missing prerequisite p12-community-support-hub');
  }

  if (!P12_GATE_MARKETING_PREREQUISITE_TODOS.includes(P12_LEGAL_PAGES_TODO)) {
    throw new Error('p12-gate-marketing: missing prerequisite p12-legal-pages');
  }

  if (DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO !== 'da-w8-signature-surfaces-bundle') {
    throw new Error('p12-gate-marketing: next DA W8 todo drift');
  }

  if (P12_GATE_MARKETING_OPERATOR_TRUST_ROUTES.length !== 4) {
    throw new Error('p12-gate-marketing: §32.5 must list exactly 4 operator-trust routes');
  }

  const expectedTrust = [
    '/support/faq',
    '/feedback',
    '/legal/affiliate',
    '/legal/cookies',
  ] as const;
  for (const route of expectedTrust) {
    if (!(P12_GATE_MARKETING_OPERATOR_TRUST_ROUTES as readonly string[]).includes(route)) {
      throw new Error(`p12-gate-marketing: missing operator-trust route ${route}`);
    }
  }

  for (const route of P12_GATE_MARKETING_FOOTER_REQUIRED_ROUTES) {
    if (!(OPERATOR_TRUST_FOOTER_ROUTES as readonly string[]).includes(route)) {
      throw new Error(`p12-gate-marketing: footer missing required route ${route}`);
    }
  }

  if (OPERATOR_TRUST_FAQ_ROUTE !== '/support/faq') {
    throw new Error('p12-gate-marketing: FAQ route drift');
  }

  if (OPERATOR_TRUST_FEEDBACK_ROUTE !== '/feedback') {
    throw new Error('p12-gate-marketing: feedback route drift');
  }

  if (LEGAL_AFFILIATE_ROUTE !== OPERATOR_TRUST_AFFILIATE_LEGAL_ROUTE) {
    throw new Error('p12-gate-marketing: affiliate legal route drift');
  }

  if (LEGAL_COOKIES_ROUTE !== OPERATOR_TRUST_COOKIES_ROUTE) {
    throw new Error('p12-gate-marketing: cookies legal route drift');
  }

  if (P12_GATE_MARKETING_REDIRECT_ALIASES['/faq'] !== '/support/faq') {
    throw new Error('p12-gate-marketing: /faq redirect drift');
  }

  if (P12_GATE_MARKETING_REDIRECT_ALIASES['/report-bug'] !== '/feedback?type=bug') {
    throw new Error('p12-gate-marketing: /report-bug redirect drift');
  }

  if (P12_GATE_MARKETING_REDIRECT_ALIASES['/referral/terms'] !== '/legal/affiliate') {
    throw new Error('p12-gate-marketing: /referral/terms redirect drift');
  }

  if (P12_GATE_MARKETING_REDIRECT_ALIASES['/cookies'] !== '/legal/cookies') {
    throw new Error('p12-gate-marketing: /cookies redirect drift');
  }

  if (P12_LEGAL_PAGES_REDIRECT_ALIASES['/referral/terms'] !== '/legal/affiliate') {
    throw new Error('p12-gate-marketing: legal-pages /referral/terms alias drift');
  }

  if (P12_LEGAL_PAGES_REDIRECT_ALIASES['/cookies'] !== '/legal/cookies') {
    throw new Error('p12-gate-marketing: legal-pages /cookies alias drift');
  }

  if (P12_GATE_MARKETING_EDUCATION_STORAGE_KEYS.length !== 2) {
    throw new Error('p12-gate-marketing: education storage keys incomplete');
  }

  if (FIRST_TRADE_EDUCATION_STORAGE_KEY !== 'phonara.education.trade.dismissed') {
    throw new Error('p12-gate-marketing: trade education must use localStorage dismiss key');
  }

  if (FIRST_BET_EDUCATION_STORAGE_KEY !== 'phonara.education.bet.dismissed') {
    throw new Error('p12-gate-marketing: bet education must use localStorage dismiss key');
  }

  if (P12_GATE_MARKETING_TRUST_HUB_ROUTES.length !== 6) {
    throw new Error('p12-gate-marketing: trust hub routes incomplete');
  }

  if (P12_GATE_MARKETING_COMMUNITY_LIVE_ROUTES.length !== 4) {
    throw new Error('p12-gate-marketing: community live routes incomplete');
  }

  if (P12_GATE_MARKETING_LEGAL_ROUTES.length !== 2) {
    throw new Error('p12-gate-marketing: legal routes incomplete');
  }

  assertP12TrustMarketingHubSync();
  assertP12CommunitySupportHubSync();
  assertP12LegalPagesSync();

  if (P12_GATE_MARKETING_TEST_PATHS.length < 10) {
    throw new Error('p12-gate-marketing: owner test paths incomplete');
  }

  if (P12_GATE_MARKETING_ARTIFACT_PATHS.length < 12) {
    throw new Error('p12-gate-marketing: artifact paths incomplete');
  }
}
