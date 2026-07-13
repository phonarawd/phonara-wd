import { describe, expect, it } from 'vitest';

import { DA_W5_DOMAIN_CARD_SIGNATURES } from '../da-w5-cards-domain-variants-display-contract';
import {
  assertP4MoneyVisualSignoffSync,
  P4_MONEY_DEAD_CONTROL_TEST_IDS,
  P4_MONEY_DESIGNER_CHECKLIST,
  P4_MONEY_VISUAL_PREVIEW_DEPLOY_SCRIPT,
  P4_MONEY_VISUAL_PREVIEW_URL,
  P4_MONEY_VISUAL_ROUTES,
  P4_MONEY_VISUAL_TEST_PATHS,
  P4_MONEY_VISUAL_VIEWPORT_WIDTHS,
  P4_OPERATOR_VISUAL_SIGNOFF_TODO,
  P4_VISUAL_DOMAIN_CARD_VARIANTS,
  P4_VISUAL_PREREQUISITE_TODO,
} from '../p4-money-visual-signoff-display-contract';

describe('p4-money-visual-signoff-display-contract §20.12 · §22.2 Wallet', () => {
  it('binds VISUAL todo id and prerequisite GATE', () => {
    expect(P4_OPERATOR_VISUAL_SIGNOFF_TODO).toBe('p4-operator-visual-signoff');
    expect(P4_VISUAL_PREREQUISITE_TODO).toBe('p4-gate-money');
  });

  it('requires 3-tier viewport smoke (390/768/1024)', () => {
    expect(P4_MONEY_VISUAL_VIEWPORT_WIDTHS).toEqual([390, 768, 1024]);
  });

  it('covers /wallet rails + /ledger + /rewards/history', () => {
    expect(P4_MONEY_VISUAL_ROUTES).toContain('/wallet');
    expect(P4_MONEY_VISUAL_ROUTES).toContain('/wallet/deposit');
    expect(P4_MONEY_VISUAL_ROUTES).toContain('/wallet/deposit/krw');
    expect(P4_MONEY_VISUAL_ROUTES).toContain('/wallet/deposit/crypto');
    expect(P4_MONEY_VISUAL_ROUTES).toContain('/wallet/deposit/giftcard');
    expect(P4_MONEY_VISUAL_ROUTES).toContain('/wallet/withdraw');
    expect(P4_MONEY_VISUAL_ROUTES).toContain('/wallet/withdraw/krw');
    expect(P4_MONEY_VISUAL_ROUTES).toContain('/wallet/withdraw/crypto');
    expect(P4_MONEY_VISUAL_ROUTES).toContain('/ledger');
    expect(P4_MONEY_VISUAL_ROUTES).toContain('/rewards/history');
  });

  it('lists §22.2 Wallet checklist + §34.17 wallet-hero', () => {
    expect(P4_MONEY_DESIGNER_CHECKLIST.length).toBeGreaterThanOrEqual(10);
    expect(P4_MONEY_DESIGNER_CHECKLIST).toContain('deposit-hub-3-rail-krw-crypto-giftcard');
    expect(P4_MONEY_DESIGNER_CHECKLIST).toContain('krw-deposit-auto-convert-expected-phon');
    expect(P4_MONEY_DESIGNER_CHECKLIST).toContain('wallet-hero-domain-card-variant');
    expect(P4_VISUAL_DOMAIN_CARD_VARIANTS).toEqual(['wallet-hero']);
    expect(DA_W5_DOMAIN_CARD_SIGNATURES['wallet-hero']).toBe('mono-balance-aurora-edge');
  });

  it('declares dead-control test ids and preview deploy script', () => {
    expect(P4_MONEY_DEAD_CONTROL_TEST_IDS.length).toBeGreaterThanOrEqual(8);
    expect(P4_MONEY_DEAD_CONTROL_TEST_IDS).toContain('wallet-cta-deposit');
    expect(P4_MONEY_DEAD_CONTROL_TEST_IDS).toContain('deposit-rail-krw');
    expect(P4_MONEY_DEAD_CONTROL_TEST_IDS).toContain('krw-deposit-submit');
    expect(P4_MONEY_VISUAL_PREVIEW_DEPLOY_SCRIPT).toBe('deploy:pages:web:preview');
    expect(P4_MONEY_VISUAL_PREVIEW_URL).toMatch(/^https:\/\/preview\./);
    expect(P4_MONEY_VISUAL_TEST_PATHS.length).toBe(2);
  });

  it('assertP4MoneyVisualSignoffSync passes', () => {
    expect(() => assertP4MoneyVisualSignoffSync()).not.toThrow();
  });
});
