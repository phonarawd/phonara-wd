import { describe, expect, it } from 'vitest';

import {
  LEGAL_AFFILIATE_ROUTE,
  LEGAL_AFFILIATE_SECTION_IDS,
  LEGAL_AFFILIATE_SURFACE,
  LEGAL_COOKIES_ROUTE,
  LEGAL_COOKIES_SECTION_IDS,
  LEGAL_COOKIES_SURFACE,
  LEGAL_DOC_EFFECTIVE_DATE,
  LEGAL_PRIVACY_ROUTE,
  LEGAL_PRIVACY_SECTION_IDS,
  LEGAL_PRIVACY_SURFACE,
  LEGAL_RG_SECTION_IDS,
  LEGAL_RG_SURFACE,
  LEGAL_RESPONSIBLE_GAMING_ROUTE,
  LEGAL_RISK_CARD_IDS,
  LEGAL_RISK_DISCLOSURE_ROUTE,
  LEGAL_RISK_RG_ITEM_IDS,
  LEGAL_RISK_SURFACE,
  LEGAL_TERMS_ROUTE,
  LEGAL_TERMS_SECTION_IDS,
  LEGAL_TERMS_SURFACE,
  legalAffiliateSectionKey,
  legalCookiesSectionKey,
  legalPrivacySectionKey,
  legalRgSectionKey,
  legalRiskCardKey,
  legalRiskRgItemKey,
  legalTermsSectionKey,
  resolveLegalDocRoute,
} from '../legal-display-contract';

describe('legal-display-contract', () => {
  it('pins canonical terms route and surface path', () => {
    expect(LEGAL_TERMS_ROUTE).toBe('/legal/terms');
    expect(LEGAL_TERMS_SURFACE).toContain('terms-page.tsx');
  });

  it('pins canonical privacy route and surface path', () => {
    expect(LEGAL_PRIVACY_ROUTE).toBe('/legal/privacy');
    expect(LEGAL_PRIVACY_SURFACE).toContain('privacy-page.tsx');
  });

  it('lists twelve terms sections plus services appendix keys', () => {
    expect(LEGAL_TERMS_SECTION_IDS).toHaveLength(12);
    expect(legalTermsSectionKey('s1', 'title')).toBe('legal.terms.s1.title');
    expect(legalTermsSectionKey('s12', 'body')).toBe('legal.terms.s12.body');
  });

  it('lists eleven privacy sections including marketing disclosure', () => {
    expect(LEGAL_PRIVACY_SECTION_IDS).toHaveLength(11);
    expect(legalPrivacySectionKey('s1', 'title')).toBe('legal.privacy.s1.title');
    expect(legalPrivacySectionKey('s11', 'body')).toBe('legal.privacy.s11.body');
  });

  it('pins canonical RG route and surface path', () => {
    expect(LEGAL_RESPONSIBLE_GAMING_ROUTE).toBe('/legal/responsible-gaming');
    expect(LEGAL_RG_SURFACE).toContain('responsible-gaming-page.tsx');
  });

  it('lists two RG policy sections', () => {
    expect(LEGAL_RG_SECTION_IDS).toHaveLength(2);
    expect(legalRgSectionKey('s1', 'title')).toBe('legal.rg.s1.title');
    expect(legalRgSectionKey('s2', 'body')).toBe('legal.rg.s2.body');
  });

  it('pins canonical risk disclosure route and surface path', () => {
    expect(LEGAL_RISK_DISCLOSURE_ROUTE).toBe('/legal/risk-disclosure');
    expect(LEGAL_RISK_SURFACE).toContain('risk-disclosure-page.tsx');
  });

  it('lists three risk cards and four RG policy bullets', () => {
    expect(LEGAL_RISK_CARD_IDS).toHaveLength(3);
    expect(legalRiskCardKey('trade', 'title')).toBe('legal.risk.card.trade.title');
    expect(legalRiskCardKey('tech', 'body')).toBe('legal.risk.card.tech.body');
    expect(LEGAL_RISK_RG_ITEM_IDS).toHaveLength(4);
    expect(legalRiskRgItemKey('support')).toBe('legal.risk.rg.item.support');
  });

  it('pins canonical affiliate and cookies routes (P12)', () => {
    expect(LEGAL_AFFILIATE_ROUTE).toBe('/legal/affiliate');
    expect(LEGAL_AFFILIATE_SURFACE).toContain('affiliate-page.tsx');
    expect(LEGAL_COOKIES_ROUTE).toBe('/legal/cookies');
    expect(LEGAL_COOKIES_SURFACE).toContain('cookies-page.tsx');
  });

  it('lists six affiliate and six cookies sections', () => {
    expect(LEGAL_AFFILIATE_SECTION_IDS).toHaveLength(6);
    expect(legalAffiliateSectionKey('s1', 'title')).toBe('legal.affiliate.s1.title');
    expect(legalAffiliateSectionKey('s6', 'body')).toBe('legal.affiliate.s6.body');
    expect(LEGAL_COOKIES_SECTION_IDS).toHaveLength(6);
    expect(legalCookiesSectionKey('s1', 'title')).toBe('legal.cookies.s1.title');
    expect(legalCookiesSectionKey('s4', 'body')).toBe('legal.cookies.s4.body');
  });

  it('aligns effective date with onboarding consent doc version', () => {
    expect(LEGAL_DOC_EFFECTIVE_DATE).toBe('2026-06-11');
  });

  it('resolves sibling legal doc routes', () => {
    expect(resolveLegalDocRoute('terms')).toBe('/legal/terms');
    expect(resolveLegalDocRoute('privacy')).toBe('/legal/privacy');
    expect(resolveLegalDocRoute('rg')).toBe('/legal/responsible-gaming');
    expect(resolveLegalDocRoute('risk')).toBe('/legal/risk-disclosure');
    expect(resolveLegalDocRoute('affiliate')).toBe('/legal/affiliate');
    expect(resolveLegalDocRoute('cookies')).toBe('/legal/cookies');
  });
});
