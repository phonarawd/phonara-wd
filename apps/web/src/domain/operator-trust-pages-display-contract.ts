/**
 * §32.5 Operator trust & education pages — display contract.
 * Authority: Plan §32.5 · docs/SSOT/PLATFORM_NARRATIVE_CANON.md
 */

import type { MessageKey } from '@phonara/i18n';

export const OPERATOR_TRUST_FAQ_ROUTE = '/support/faq' as const;
export const OPERATOR_TRUST_FEEDBACK_ROUTE = '/feedback' as const;
export const OPERATOR_TRUST_AFFILIATE_LEGAL_ROUTE = '/legal/affiliate' as const;
export const OPERATOR_TRUST_COOKIES_ROUTE = '/legal/cookies' as const;

export const OPERATOR_TRUST_PAGE_ROUTES = [
  OPERATOR_TRUST_FAQ_ROUTE,
  OPERATOR_TRUST_FEEDBACK_ROUTE,
  OPERATOR_TRUST_AFFILIATE_LEGAL_ROUTE,
  OPERATOR_TRUST_COOKIES_ROUTE,
] as const;

export const OPERATOR_TRUST_REDIRECT_ALIASES: Readonly<Record<string, string>> = {
  '/faq': OPERATOR_TRUST_FAQ_ROUTE,
  '/cookies': OPERATOR_TRUST_COOKIES_ROUTE,
  '/referral/terms': OPERATOR_TRUST_AFFILIATE_LEGAL_ROUTE,
  '/report-bug': `${OPERATOR_TRUST_FEEDBACK_ROUTE}?type=bug`,
};

export const FIRST_TRADE_EDUCATION_STORAGE_KEY = 'phonara.education.trade.dismissed' as const;
export const FIRST_BET_EDUCATION_STORAGE_KEY = 'phonara.education.bet.dismissed' as const;

export const TRADE_EDUCATION_RISK_DISCLOSURE_ROUTE = '/legal/risk-disclosure' as const;
export const TRADE_EDUCATION_RG_ROUTE = '/legal/responsible-gaming' as const;

export type TradeEducationRiskTopic = 'fee' | 'liquidation' | 'rg';

/** First-visit trade education — fee · liquidation · RG (§32.5 Financial tone). */
/** Beginner how-it-works · HelpTip — §13.1.3 · trade-beginner-language-display-contract (separate layer). */
export const TRADE_EDUCATION_RISK_TOPICS: readonly TradeEducationRiskTopic[] = [
  'fee',
  'liquidation',
  'rg',
] as const;

export const TRADE_EDUCATION_I18N_KEYS = {
  title: 'trade.education.title',
  lead: 'trade.education.lead',
  dismiss: 'trade.education.dismiss',
  riskLink: 'trade.education.riskLink',
  rgLink: 'trade.education.rgLink',
} as const satisfies Record<string, MessageKey>;

export function tradeEducationRiskTitleKey(topic: TradeEducationRiskTopic): MessageKey {
  return `trade.education.${topic}.title` as MessageKey;
}

export function tradeEducationRiskBodyKey(topic: TradeEducationRiskTopic): MessageKey {
  return `trade.education.${topic}.body` as MessageKey;
}

/** Footer trust links — `/legal/*` siblings ship separately; these four are P12 operator trust pages. */
export const OPERATOR_TRUST_FOOTER_ROUTES = OPERATOR_TRUST_PAGE_ROUTES;
