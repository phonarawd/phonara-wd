import { describe, expect, it } from 'vitest';

import {
  BET_EDUCATION_FAIRNESS_ROUTE,
  BET_EDUCATION_I18N_KEYS,
  BET_EDUCATION_RG_ROUTE,
  BET_EDUCATION_RISK_TOPICS,
  FIRST_BET_EDUCATION_STORAGE_KEY,
  FIRST_TRADE_EDUCATION_STORAGE_KEY,
  OPERATOR_TRUST_FOOTER_ROUTES,
  OPERATOR_TRUST_PAGE_ROUTES,
  OPERATOR_TRUST_REDIRECT_ALIASES,
  TRADE_EDUCATION_I18N_KEYS,
  TRADE_EDUCATION_RG_ROUTE,
  TRADE_EDUCATION_RISK_DISCLOSURE_ROUTE,
  TRADE_EDUCATION_RISK_TOPICS,
  betEducationRiskBodyKey,
  betEducationRiskTitleKey,
  tradeEducationRiskBodyKey,
  tradeEducationRiskTitleKey,
} from '../operator-trust-pages-display-contract';

describe('operator-trust-pages-display-contract §32.5', () => {
  it('lists four P12 operator trust routes', () => {
    expect(OPERATOR_TRUST_PAGE_ROUTES).toHaveLength(4);
    expect(OPERATOR_TRUST_PAGE_ROUTES).toContain('/support/faq');
    expect(OPERATOR_TRUST_PAGE_ROUTES).toContain('/legal/cookies');
  });

  it('maps legacy aliases to canonical routes', () => {
    expect(OPERATOR_TRUST_REDIRECT_ALIASES['/faq']).toBe('/support/faq');
    expect(OPERATOR_TRUST_REDIRECT_ALIASES['/referral/terms']).toBe('/legal/affiliate');
  });

  it('exposes footer trust routes matching page routes', () => {
    expect(OPERATOR_TRUST_FOOTER_ROUTES).toEqual(OPERATOR_TRUST_PAGE_ROUTES);
  });

  it('defines trade first-visit education contract', () => {
    expect(FIRST_TRADE_EDUCATION_STORAGE_KEY).toBe('phonara.education.trade.dismissed');
    expect(TRADE_EDUCATION_RISK_TOPICS).toEqual(['fee', 'liquidation', 'rg']);
    expect(TRADE_EDUCATION_RISK_DISCLOSURE_ROUTE).toBe('/legal/risk-disclosure');
    expect(TRADE_EDUCATION_RG_ROUTE).toBe('/legal/responsible-gaming');
    expect(TRADE_EDUCATION_I18N_KEYS.title).toBe('trade.education.title');
    for (const topic of TRADE_EDUCATION_RISK_TOPICS) {
      expect(tradeEducationRiskTitleKey(topic)).toBe(`trade.education.${topic}.title`);
      expect(tradeEducationRiskBodyKey(topic)).toBe(`trade.education.${topic}.body`);
    }
  });

  it('defines bet first-visit education contract', () => {
    expect(FIRST_BET_EDUCATION_STORAGE_KEY).toBe('phonara.education.bet.dismissed');
    expect(BET_EDUCATION_RISK_TOPICS).toEqual(['slip', 'rg', 'fairness']);
    expect(BET_EDUCATION_RG_ROUTE).toBe('/legal/responsible-gaming');
    expect(BET_EDUCATION_FAIRNESS_ROUTE).toBe('/casino/fairness');
    expect(BET_EDUCATION_I18N_KEYS.title).toBe('bet.education.title');
    expect(BET_EDUCATION_I18N_KEYS.fairnessLink).toBe('bet.education.fairnessLink');
    for (const topic of BET_EDUCATION_RISK_TOPICS) {
      expect(betEducationRiskTitleKey(topic)).toBe(`bet.education.${topic}.title`);
      expect(betEducationRiskBodyKey(topic)).toBe(`bet.education.${topic}.body`);
    }
  });
});
