/**
 * DA W5 Domain card personalities GATE (§34.17 · YAML #195).
 * Authority: `da-w5-gate-domain-cards` · PRODUCT_EXPERIENCE_CANON §4 · Plan §34.17 0.2s scan.
 */

import {
  DA_W5_CARDS_DOMAIN_VARIANTS_TODO,
  DA_W5_DOMAIN_CARD_SIGNATURES,
  DA_W5_DOMAIN_CARD_VARIANTS,
  type DaW5DomainCardVariant,
} from './da-w5-cards-domain-variants-display-contract';

export const DA_W5_GATE_DOMAIN_CARDS_TODO = 'da-w5-gate-domain-cards' as const;

/** Prerequisite BUNDLE must be closed before this GATE. */
export const DA_W5_GATE_DOMAIN_CARDS_PREREQUISITE_TODOS = [
  DA_W5_CARDS_DOMAIN_VARIANTS_TODO,
] as const;

/**
 * §34.17 scan cue ids — each personality must be distinguishable in ≤0.2s.
 * Keys = Card CVA variant · values = English cue ids (operator KR table lives in Plan §34.17).
 */
export const DA_W5_GATE_SCAN_CUES = {
  mission: 'in-progress-mission',
  'wallet-hero': 'balance',
  vip: 'tier',
  'trade-dense': 'book-ticket',
  'sports-odds': 'odds-move',
  'casino-play': 'game-tile',
} as const satisfies Record<DaW5DomainCardVariant, string>;

/** Structural CSS / CVA markers that prove 0.2s distinguishability (no visual pixel gate). */
export const DA_W5_GATE_SCAN_DISTINGUISH_MARKERS = {
  mission: ['ring-accent', "data-card-variant='mission'", 'progress glow'],
  'wallet-hero': ['ring-accent', "data-card-variant='wallet-hero'", 'aurora'],
  vip: ['--ds-card-tier', "data-card-variant='vip'"],
  'trade-dense': ['shadow-none', "data-card-variant='trade-dense'"],
  'sports-odds': ['heatmap', "data-card-variant='sports-odds'", 'data-odds-move'],
  'casino-play': ['hover:shadow-2', "data-card-variant='casino-play'", 'hover:-translate'],
} as const satisfies Record<DaW5DomainCardVariant, readonly string[]>;

/**
 * Primary GATE owners from todo content:
 * gate:ai-impl mission-card + wallet + casino tile.
 */
export const DA_W5_GATE_PRIMARY_OWNER_PATHS = [
  'product/primitives/mission-card.tsx',
  'product/surfaces/wallet/wallet-balance-hero.tsx',
  'product/surfaces/casino/casino-hub-defer-page.tsx',
] as const;

/** On-disk artifacts required for W5 domain cards GATE. */
export const DA_W5_GATE_DOMAIN_CARDS_ARTIFACT_PATHS = [
  'domain/da-w5-gate-domain-cards-display-contract.ts',
  'domain/da-w5-cards-domain-variants-display-contract.ts',
  'product/primitives/card.tsx',
  'product/tokens/domain-card-personalities.css',
  ...DA_W5_GATE_PRIMARY_OWNER_PATHS,
] as const;

/** gate:ai-impl owner paths — 0.2s scan + mission/wallet/casino. */
export const DA_W5_GATE_DOMAIN_CARDS_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w5-gate-domain-cards-display-contract.test.ts',
  'apps/web/src/domain/__tests__/da-w5-cards-domain-variants-display-contract.test.ts',
  'apps/web/src/product/primitives/__tests__/card-variants.test.ts',
  'apps/web/src/product/primitives/__tests__/mission-card.test.tsx',
  'apps/web/src/product/tokens/__tests__/domain-card-personalities.test.ts',
  'apps/web/src/product/surfaces/__tests__/da-w5-gate-domain-cards.test.tsx',
  'apps/web/src/product/surfaces/wallet/__tests__/wallet-page.test.tsx',
  'apps/web/src/product/surfaces/casino/__tests__/casino-hub-defer-page.test.tsx',
] as const;

/** Operator VISUAL advisory checklist (§34.31 · advisory until da-w7 / §20.12 full). */
export const DA_W5_GATE_DOMAIN_CARDS_VISUAL_ADVISORY_CHECKLIST = [
  'mission-accent-ring-progress-glow',
  'wallet-hero-mono-aurora-edge',
  'vip-tier-ramp-border',
  'trade-dense-line-first-no-shadow',
  'sports-odds-heatmap-movement',
  'casino-play-hover-glow-float',
  'scan-0.2s-six-personalities-distinct',
] as const;

/** Non-waivable sync for DA W5 GATE closeout. */
export function assertDaW5GateDomainCardsSync(): void {
  if (!DA_W5_GATE_DOMAIN_CARDS_PREREQUISITE_TODOS.includes(DA_W5_CARDS_DOMAIN_VARIANTS_TODO)) {
    throw new Error('da-w5-gate-domain-cards: missing prerequisite da-w5-cards-domain-variants');
  }

  if (DA_W5_DOMAIN_CARD_VARIANTS.length !== 6) {
    throw new Error('da-w5-gate-domain-cards: expected 6 domain personalities from BUNDLE');
  }

  for (const variant of DA_W5_DOMAIN_CARD_VARIANTS) {
    if (!(variant in DA_W5_GATE_SCAN_CUES)) {
      throw new Error(`da-w5-gate-domain-cards: missing scan cue for ${variant}`);
    }
    if (!(variant in DA_W5_DOMAIN_CARD_SIGNATURES)) {
      throw new Error(`da-w5-gate-domain-cards: missing BUNDLE signature for ${variant}`);
    }
    if (!(variant in DA_W5_GATE_SCAN_DISTINGUISH_MARKERS)) {
      throw new Error(`da-w5-gate-domain-cards: missing distinguish markers for ${variant}`);
    }
  }

  const cues = Object.values(DA_W5_GATE_SCAN_CUES);
  if (new Set(cues).size !== cues.length) {
    throw new Error('da-w5-gate-domain-cards: scan cues must be unique (0.2s distinguish)');
  }

  if (DA_W5_GATE_PRIMARY_OWNER_PATHS.length !== 3) {
    throw new Error('da-w5-gate-domain-cards: mission + wallet + casino owners required');
  }

  if (DA_W5_GATE_DOMAIN_CARDS_TEST_PATHS.length < 6) {
    throw new Error('da-w5-gate-domain-cards: owner test paths incomplete');
  }
}
