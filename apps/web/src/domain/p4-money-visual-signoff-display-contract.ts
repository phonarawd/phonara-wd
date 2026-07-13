/**
 * P4 Money (Wallet/Ledger/Rewards) operator visual sign-off display contract
 * (§20.12 · §22.2 Wallet · §25.12.6 · §30.3 · Toss·Revolut pattern).
 * Authority: plan `p4-operator-visual-signoff` · YAML #218.
 *
 * Agent gate green ≠ Plan YAML completed — operator preview visual
 * `VISUAL APPROVED: p4-operator-visual-signoff` chat record required (§20.12).
 */

/** Plan todo id — Money surfaces operator visual sign-off. */
export const P4_OPERATOR_VISUAL_SIGNOFF_TODO = 'p4-operator-visual-signoff' as const;

/** Immediate prerequisite — P4 Money GATE must be closed. */
export const P4_VISUAL_PREREQUISITE_TODO = 'p4-gate-money' as const;

/** Mandatory operator viewport smoke widths for P4 VISUAL (§20.12 · §22.2). */
export const P4_MONEY_VISUAL_VIEWPORT_WIDTHS = [390, 768, 1024] as const;

/**
 * Operator smoke routes — `/wallet/*` · `/ledger` · `/rewards/history`
 * (§12.3–12.5 · §25.12.6).
 */
export const P4_MONEY_VISUAL_ROUTES = [
  '/wallet',
  '/wallet/deposit',
  '/wallet/deposit/krw',
  '/wallet/deposit/crypto',
  '/wallet/deposit/giftcard',
  '/wallet/withdraw',
  '/wallet/withdraw/krw',
  '/wallet/withdraw/crypto',
  '/ledger',
  '/rewards/history',
] as const;

export type P4MoneyVisualRoute = (typeof P4_MONEY_VISUAL_ROUTES)[number];

/**
 * §22.2 Wallet · §25.12.6 · §30.3 — structural checklist ids
 * (automated gate companions · operator visual).
 */
export const P4_MONEY_DESIGNER_CHECKLIST = [
  'wallet-balance-hero-card',
  'wallet-cta-deposit-withdraw-ledger',
  'deposit-hub-3-rail-krw-crypto-giftcard',
  'withdraw-hub-2-rail-krw-crypto',
  'rail-fee-sla-eligibility-primary-cta',
  'krw-deposit-auto-convert-expected-phon',
  'krw-withdraw-auto-convert-expected-krw',
  'giftcard-fee-preview-before-pin',
  'history-link-to-ledger',
  'rewards-history-reward-filter',
  'tabular-nums-money-display',
  'wallet-hero-domain-card-variant',
  'responsive-3-tier-390-768-1024',
] as const;

/** §34.17 domain card personality required on Wallet hero. */
export const P4_VISUAL_DOMAIN_CARD_VARIANTS = ['wallet-hero'] as const;

/** Interactive controls that must wire handlers or nav (dead control 0 · §32.7 H8). */
export const P4_MONEY_DEAD_CONTROL_TEST_IDS = [
  'wallet-cta-deposit',
  'wallet-cta-withdraw',
  'wallet-cta-ledger',
  'deposit-rail-krw',
  'deposit-rail-crypto',
  'deposit-rail-giftcard',
  'withdraw-rail-krw',
  'withdraw-rail-crypto',
  'krw-deposit-submit',
  'rewards-history-ledger-link',
] as const;

export const P4_MONEY_VISUAL_PREVIEW_DEPLOY_SCRIPT = 'deploy:pages:web:preview' as const;

/** Operator records preview URL at VISUAL APPROVED closeout (§20.12). */
export const P4_MONEY_VISUAL_PREVIEW_URL = 'https://preview.phonara-web.pages.dev' as const;

/** gate:ai-impl owner paths. */
export const P4_MONEY_VISUAL_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p4-money-visual-signoff-display-contract.test.ts',
  'apps/web/src/product/surfaces/__tests__/p4-money-visual-signoff.test.tsx',
] as const;

/** Non-waivable sync for P4 VISUAL agent companions. */
export function assertP4MoneyVisualSignoffSync(): void {
  if (P4_OPERATOR_VISUAL_SIGNOFF_TODO !== 'p4-operator-visual-signoff') {
    throw new Error('p4-visual: todo id drift');
  }

  if (P4_VISUAL_PREREQUISITE_TODO !== 'p4-gate-money') {
    throw new Error('p4-visual: prerequisite must be p4-gate-money');
  }

  if (P4_MONEY_VISUAL_VIEWPORT_WIDTHS.length !== 3) {
    throw new Error('p4-visual: viewport smoke must be 390/768/1024');
  }

  if (!P4_MONEY_VISUAL_ROUTES.includes('/wallet')) {
    throw new Error('p4-visual: /wallet hub required');
  }

  if (!P4_MONEY_VISUAL_ROUTES.includes('/ledger')) {
    throw new Error('p4-visual: /ledger required');
  }

  if (!P4_MONEY_VISUAL_ROUTES.includes('/rewards/history')) {
    throw new Error('p4-visual: /rewards/history required');
  }

  const depositRails = P4_MONEY_VISUAL_ROUTES.filter((route) =>
    route.startsWith('/wallet/deposit/'),
  );
  if (depositRails.length !== 3) {
    throw new Error('p4-visual: deposit 3-rail routes incomplete');
  }

  const withdrawRails = P4_MONEY_VISUAL_ROUTES.filter((route) =>
    route.startsWith('/wallet/withdraw/'),
  );
  if (withdrawRails.length !== 2) {
    throw new Error('p4-visual: withdraw rail routes incomplete');
  }

  if (P4_MONEY_DEAD_CONTROL_TEST_IDS.length < 8) {
    throw new Error('p4-visual: dead-control test ids incomplete');
  }

  if (P4_MONEY_DESIGNER_CHECKLIST.length < 10) {
    throw new Error('p4-visual: designer checklist incomplete');
  }

  if (P4_MONEY_VISUAL_PREVIEW_DEPLOY_SCRIPT !== 'deploy:pages:web:preview') {
    throw new Error('p4-visual: preview deploy script drift');
  }

  if (!P4_MONEY_VISUAL_PREVIEW_URL.startsWith('https://preview.')) {
    throw new Error('p4-visual: preview URL must be preview host');
  }

  if (P4_VISUAL_DOMAIN_CARD_VARIANTS[0] !== 'wallet-hero') {
    throw new Error('p4-visual: wallet-hero domain card required');
  }
}
