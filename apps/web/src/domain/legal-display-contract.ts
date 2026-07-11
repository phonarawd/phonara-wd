/**
 * Legal document surfaces — Phase R P3 + P12 display contract (ui_only · i18n-first).
 * Copy authority: `@phonara/i18n` `legal.*` keys · CMS override defer until E3.
 *
 * Authority: REBUILD_PLAN_v1 §12.15 · §28.5 · §32.5 · onboarding consent doc version parity.
 */

import { ONBOARDING_CONSENT_DOC_VERSION } from '@/lib/onboarding-consent';

export const LEGAL_TERMS_ROUTE = '/legal/terms' as const;
export const LEGAL_PRIVACY_ROUTE = '/legal/privacy' as const;
export const LEGAL_RESPONSIBLE_GAMING_ROUTE = '/legal/responsible-gaming' as const;
export const LEGAL_RISK_DISCLOSURE_ROUTE = '/legal/risk-disclosure' as const;
export const LEGAL_AFFILIATE_ROUTE = '/legal/affiliate' as const;
export const LEGAL_COOKIES_ROUTE = '/legal/cookies' as const;

export type LegalDocId = 'terms' | 'privacy' | 'rg' | 'risk' | 'affiliate' | 'cookies';

export const LEGAL_DOC_ROUTES: Readonly<Record<LegalDocId, string>> = {
  terms: LEGAL_TERMS_ROUTE,
  privacy: LEGAL_PRIVACY_ROUTE,
  rg: LEGAL_RESPONSIBLE_GAMING_ROUTE,
  risk: LEGAL_RISK_DISCLOSURE_ROUTE,
  affiliate: LEGAL_AFFILIATE_ROUTE,
  cookies: LEGAL_COOKIES_ROUTE,
};

/** Matches `rpc_record_consent` doc_version for terms/privacy onboarding. */
export const LEGAL_DOC_EFFECTIVE_DATE = ONBOARDING_CONSENT_DOC_VERSION;

export const LEGAL_TERMS_SECTION_IDS = [
  's1',
  's2',
  's3',
  's4',
  's5',
  's6',
  's7',
  's8',
  's9',
  's10',
  's11',
  's12',
] as const;

export type LegalTermsSectionId = (typeof LEGAL_TERMS_SECTION_IDS)[number];

/** P3 auth-cluster legal pages — presentation only (no CMS RPC on read path). */
export const LEGAL_TERMS_ENGINE_STATUS = 'ui_only' as const;

export const LEGAL_TERMS_SURFACE = 'apps/web/src/product/surfaces/legal/terms-page.tsx' as const;

export const LEGAL_PRIVACY_SECTION_IDS = [
  's1',
  's2',
  's3',
  's4',
  's5',
  's6',
  's7',
  's8',
  's9',
  's10',
  's11',
] as const;

export type LegalPrivacySectionId = (typeof LEGAL_PRIVACY_SECTION_IDS)[number];

export const LEGAL_PRIVACY_ENGINE_STATUS = 'ui_only' as const;

export const LEGAL_PRIVACY_SURFACE =
  'apps/web/src/product/surfaces/legal/privacy-page.tsx' as const;

export const LEGAL_RG_SECTION_IDS = ['s1', 's2'] as const;

export type LegalRgSectionId = (typeof LEGAL_RG_SECTION_IDS)[number];

export const LEGAL_RG_ENGINE_STATUS = 'ui_only' as const;

export const LEGAL_RG_SURFACE =
  'apps/web/src/product/surfaces/legal/responsible-gaming-page.tsx' as const;

export const LEGAL_RISK_CARD_IDS = ['trade', 'game', 'tech'] as const;

export type LegalRiskCardId = (typeof LEGAL_RISK_CARD_IDS)[number];

export const LEGAL_RISK_RG_ITEM_IDS = ['limit', 'cooldown', 'exclude', 'support'] as const;

export type LegalRiskRgItemId = (typeof LEGAL_RISK_RG_ITEM_IDS)[number];

export const LEGAL_RISK_ENGINE_STATUS = 'ui_only' as const;

export const LEGAL_RISK_SURFACE =
  'apps/web/src/product/surfaces/legal/risk-disclosure-page.tsx' as const;

/** P12 — referral / affiliate eligibility · commission copy (ui_only · no client math). */
export const LEGAL_AFFILIATE_SECTION_IDS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

export type LegalAffiliateSectionId = (typeof LEGAL_AFFILIATE_SECTION_IDS)[number];

export const LEGAL_AFFILIATE_ENGINE_STATUS = 'ui_only' as const;

export const LEGAL_AFFILIATE_SURFACE =
  'apps/web/src/product/surfaces/legal/affiliate-page.tsx' as const;

/** P12 — cookies · local storage · §28.5 ad pixels (ui_only). */
export const LEGAL_COOKIES_SECTION_IDS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

export type LegalCookiesSectionId = (typeof LEGAL_COOKIES_SECTION_IDS)[number];

export const LEGAL_COOKIES_ENGINE_STATUS = 'ui_only' as const;

export const LEGAL_COOKIES_SURFACE =
  'apps/web/src/product/surfaces/legal/cookies-page.tsx' as const;

export function legalTermsSectionKey(
  sectionId: LegalTermsSectionId,
  field: 'title' | 'body',
): `legal.terms.${LegalTermsSectionId}.${typeof field}` {
  return `legal.terms.${sectionId}.${field}`;
}

export function legalPrivacySectionKey(
  sectionId: LegalPrivacySectionId,
  field: 'title' | 'body',
): `legal.privacy.${LegalPrivacySectionId}.${typeof field}` {
  return `legal.privacy.${sectionId}.${field}`;
}

export function legalRgSectionKey(
  sectionId: LegalRgSectionId,
  field: 'title' | 'body',
): `legal.rg.${LegalRgSectionId}.${typeof field}` {
  return `legal.rg.${sectionId}.${field}`;
}

export function legalRiskCardKey(
  cardId: LegalRiskCardId,
  field: 'title' | 'body',
): `legal.risk.card.${LegalRiskCardId}.${typeof field}` {
  return `legal.risk.card.${cardId}.${field}`;
}

export function legalRiskRgItemKey(
  itemId: LegalRiskRgItemId,
): `legal.risk.rg.item.${LegalRiskRgItemId}` {
  return `legal.risk.rg.item.${itemId}`;
}

export function legalAffiliateSectionKey(
  sectionId: LegalAffiliateSectionId,
  field: 'title' | 'body',
): `legal.affiliate.${LegalAffiliateSectionId}.${typeof field}` {
  return `legal.affiliate.${sectionId}.${field}`;
}

export function legalCookiesSectionKey(
  sectionId: LegalCookiesSectionId,
  field: 'title' | 'body',
): `legal.cookies.${LegalCookiesSectionId}.${typeof field}` {
  return `legal.cookies.${sectionId}.${field}`;
}

export function resolveLegalDocRoute(docId: LegalDocId): string {
  return LEGAL_DOC_ROUTES[docId];
}
