import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { FileRoutesByFullPath } from '../../routeTree.gen';
import { ROUTE_REDIRECT_RULES } from '../../product/routing/route-redirect-registry';
import {
  assertP12GateMarketingSync,
  DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO,
  P12_GATE_MARKETING_ARTIFACT_PATHS,
  P12_GATE_MARKETING_COMMUNITY_LIVE_ROUTES,
  P12_GATE_MARKETING_EDUCATION_STORAGE_KEYS,
  P12_GATE_MARKETING_FOOTER_REQUIRED_ROUTES,
  P12_GATE_MARKETING_LEGAL_ROUTES,
  P12_GATE_MARKETING_OPERATOR_TRUST_ROUTES,
  P12_GATE_MARKETING_PREREQUISITE_TODOS,
  P12_GATE_MARKETING_REDIRECT_ALIASES,
  P12_GATE_MARKETING_TEST_PATHS,
  P12_GATE_MARKETING_TODO,
  P12_GATE_MARKETING_TRUST_HUB_ROUTES,
} from '../p12-gate-marketing-display-contract';
import { P12_COMMUNITY_SUPPORT_HUB_TODO } from '../p12-community-support-hub-display-contract';
import { P12_LEGAL_PAGES_TODO } from '../p12-legal-pages-display-contract';
import { P12_TRUST_MARKETING_HUB_TODO } from '../p12-trust-marketing-hub-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

/** TanStack Router full paths — compile-time route existence check. */
type RegisteredFullPath = keyof FileRoutesByFullPath;

function assertRegisteredFullPath(path: RegisteredFullPath): RegisteredFullPath {
  return path;
}

function exactRedirectTo(from: string): string | undefined {
  const rule = ROUTE_REDIRECT_RULES.find((entry) => entry.kind === 'exact' && entry.from === from);
  if (!rule || rule.kind !== 'exact') return undefined;
  if (rule.search) {
    const qs = new URLSearchParams(rule.search).toString();
    return `${rule.to}?${qs}`;
  }
  return rule.to;
}

describe('p12-gate-marketing-display-contract §32.5 · YAML #225', () => {
  it('registers GATE todo · P12 prerequisites · next DA W8', () => {
    expect(P12_GATE_MARKETING_TODO).toBe('p12-gate-marketing');
    expect(P12_GATE_MARKETING_PREREQUISITE_TODOS).toEqual([
      P12_TRUST_MARKETING_HUB_TODO,
      P12_COMMUNITY_SUPPORT_HUB_TODO,
      P12_LEGAL_PAGES_TODO,
    ]);
    expect(DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO).toBe('da-w8-signature-surfaces-bundle');
    expect(() => assertP12GateMarketingSync()).not.toThrow();
  });

  it('locks §32.5 operator-trust routes · TanStack fullPath dead link 0', () => {
    expect([...P12_GATE_MARKETING_OPERATOR_TRUST_ROUTES]).toEqual([
      '/support/faq',
      '/feedback',
      '/legal/affiliate',
      '/legal/cookies',
    ]);

    for (const route of P12_GATE_MARKETING_OPERATOR_TRUST_ROUTES) {
      expect(assertRegisteredFullPath(route as RegisteredFullPath)).toBe(route);
    }

    for (const route of P12_GATE_MARKETING_TRUST_HUB_ROUTES) {
      expect(assertRegisteredFullPath(route as RegisteredFullPath)).toBe(route);
    }

    for (const route of P12_GATE_MARKETING_COMMUNITY_LIVE_ROUTES) {
      expect(assertRegisteredFullPath(route as RegisteredFullPath)).toBe(route);
    }

    for (const route of P12_GATE_MARKETING_LEGAL_ROUTES) {
      expect(assertRegisteredFullPath(route as RegisteredFullPath)).toBe(route);
    }
  });

  it('requires footer FAQ·feedback·affiliate·cookies (§32.5 FAIL)', () => {
    expect([...P12_GATE_MARKETING_FOOTER_REQUIRED_ROUTES]).toEqual([
      '/support/faq',
      '/feedback',
      '/legal/affiliate',
      '/legal/cookies',
    ]);

    const footerSrc = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/landing/landing-footer.tsx'),
      'utf8',
    );
    expect(footerSrc).toContain('OPERATOR_TRUST_FAQ_ROUTE');
    expect(footerSrc).toContain('OPERATOR_TRUST_FEEDBACK_ROUTE');
    expect(footerSrc).toContain('LEGAL_AFFILIATE_ROUTE');
    expect(footerSrc).toContain('LEGAL_COOKIES_ROUTE');
    expect(footerSrc).toContain('landing-footer-faq');
    expect(footerSrc).toContain('landing-footer-feedback');
    expect(footerSrc).toContain('landing-footer-affiliate');
    expect(footerSrc).toContain('landing-footer-cookies');
  });

  it('keeps affiliate terms on referral CTA · cookies on ads consent (§32.5 FAIL)', () => {
    const referralSrc = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/referral/referral-page.tsx'),
      'utf8',
    );
    expect(referralSrc).toContain('LEGAL_AFFILIATE_ROUTE');
    expect(referralSrc).toContain('referral-affiliate-terms-link');

    const adsSrc = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/landing/ads-consent-sheet.tsx'),
      'utf8',
    );
    expect(adsSrc).toContain('/legal/cookies');
    expect(adsSrc).toContain('ads.consent.cookiesLink');
  });

  it('maps §12.17 aliases · education uses localStorage dismiss (not every visit)', () => {
    expect(P12_GATE_MARKETING_REDIRECT_ALIASES['/faq']).toBe('/support/faq');
    expect(P12_GATE_MARKETING_REDIRECT_ALIASES['/report-bug']).toBe('/feedback?type=bug');
    expect(P12_GATE_MARKETING_REDIRECT_ALIASES['/referral/terms']).toBe('/legal/affiliate');
    expect(P12_GATE_MARKETING_REDIRECT_ALIASES['/cookies']).toBe('/legal/cookies');

    expect(exactRedirectTo('/faq')).toBe('/support/faq');
    expect(exactRedirectTo('/report-bug')).toBe('/feedback?type=bug');
    expect(exactRedirectTo('/referral/terms')).toBe('/legal/affiliate');
    expect(exactRedirectTo('/cookies')).toBe('/legal/cookies');

    expect([...P12_GATE_MARKETING_EDUCATION_STORAGE_KEYS]).toEqual([
      'phonara.education.trade.dismissed',
      'phonara.education.bet.dismissed',
    ]);

    const betEduSrc = readFileSync(
      resolve(WEB_SRC, 'features/responsible-gaming/bet-first-visit-education.ts'),
      'utf8',
    );
    expect(betEduSrc).toContain('FIRST_BET_EDUCATION_STORAGE_KEY');
    expect(betEduSrc).toContain('localStorage');
  });

  it('requires GATE artifacts and owner test paths on disk', () => {
    for (const rel of P12_GATE_MARKETING_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of P12_GATE_MARKETING_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });
});
