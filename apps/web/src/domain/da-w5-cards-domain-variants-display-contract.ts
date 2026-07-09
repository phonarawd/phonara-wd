/**
 * DA W5 Domain card personalities (§34.17 · YAML #194).
 * Authority: `da-w5-cards-domain-variants` · PRODUCT_EXPERIENCE_CANON §4 · ADR-009 Neural Glow.
 */

export const DA_W5_CARDS_DOMAIN_VARIANTS_TODO = 'da-w5-cards-domain-variants' as const;

export const DA_W4_GATE_MOTION_TODO = 'da-w4-gate-motion' as const;

/** Prerequisite GATE must be closed before this BUNDLE. */
export const DA_W5_CARDS_DOMAIN_VARIANTS_PREREQUISITE_TODOS = [DA_W4_GATE_MOTION_TODO] as const;

/**
 * §34.17 domain personalities — CVA-only Card variants (no parallel card primitives).
 * Scan cue = 0.2s visual identity for each domain.
 */
export const DA_W5_DOMAIN_CARD_VARIANTS = [
  'mission',
  'wallet-hero',
  'vip',
  'trade-dense',
  'sports-odds',
  'casino-play',
] as const;

export type DaW5DomainCardVariant = (typeof DA_W5_DOMAIN_CARD_VARIANTS)[number];

/** Signature → scan cue (operator table §34.17). */
export const DA_W5_DOMAIN_CARD_SIGNATURES = {
  mission: 'accent-ring-progress-glow',
  'wallet-hero': 'mono-balance-aurora-edge',
  vip: 'tier-ramp-border',
  'trade-dense': 'line-first-no-shadow',
  'sports-odds': 'heatmap-movement-bg',
  'casino-play': 'hover-glow-float',
} as const satisfies Record<DaW5DomainCardVariant, string>;

/** Surfaces that must wire the matching Card variant (extend Owner only). */
export const DA_W5_DOMAIN_CARD_WIRE_TARGETS = [
  'mission_card',
  'wallet_balance_hero',
  'tier_me_progress',
  'trade_order_ticket',
  'trade_order_book',
  'sports_fixture_row',
  'casino_hub_tile',
] as const;

export type DaW5DomainCardWireTarget = (typeof DA_W5_DOMAIN_CARD_WIRE_TARGETS)[number];

/** On-disk artifacts required for W5 domain cards BUNDLE. */
export const DA_W5_CARDS_DOMAIN_VARIANTS_ARTIFACT_PATHS = [
  'domain/da-w5-cards-domain-variants-display-contract.ts',
  'product/primitives/card.tsx',
  'product/tokens/domain-card-personalities.css',
  'product/primitives/mission-card.tsx',
  'product/surfaces/wallet/wallet-balance-hero.tsx',
  'product/surfaces/tier/tier-me-page.tsx',
  'product/surfaces/trade/spot-order-ticket.tsx',
  'product/surfaces/trade/futures-order-ticket.tsx',
  'product/surfaces/trade/spot-order-book-panel.tsx',
  'product/surfaces/sports/sports-fixture-board.tsx',
  'product/surfaces/casino/casino-hub-defer-page.tsx',
] as const;

/** gate:ai-impl owner paths — CVA + wire consumers. */
export const DA_W5_CARDS_DOMAIN_VARIANTS_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w5-cards-domain-variants-display-contract.test.ts',
  'apps/web/src/product/primitives/__tests__/card-variants.test.ts',
  'apps/web/src/product/tokens/__tests__/domain-card-personalities.test.ts',
  'apps/web/src/product/surfaces/wallet/__tests__/wallet-page.test.tsx',
  'apps/web/src/product/surfaces/tier/__tests__/tier-me-page.test.tsx',
  'apps/web/src/product/surfaces/sports/__tests__/sports-page.test.tsx',
  'apps/web/src/product/surfaces/casino/__tests__/casino-hub-defer-page.test.tsx',
  'apps/web/src/product/surfaces/trade/__tests__/spot-order-ticket.test.tsx',
] as const;

/** Non-waivable sync for DA W5 BUNDLE closeout. */
export function assertDaW5CardsDomainVariantsSync(): void {
  if (!DA_W5_CARDS_DOMAIN_VARIANTS_PREREQUISITE_TODOS.includes(DA_W4_GATE_MOTION_TODO)) {
    throw new Error('da-w5-cards-domain-variants: missing prerequisite da-w4-gate-motion');
  }

  if (DA_W5_DOMAIN_CARD_VARIANTS.length !== 6) {
    throw new Error('da-w5-cards-domain-variants: expected 6 domain personalities');
  }

  for (const variant of DA_W5_DOMAIN_CARD_VARIANTS) {
    if (!(variant in DA_W5_DOMAIN_CARD_SIGNATURES)) {
      throw new Error(`da-w5-cards-domain-variants: missing signature for ${variant}`);
    }
  }

  if (!DA_W5_DOMAIN_CARD_VARIANTS.includes('sports-odds')) {
    throw new Error('da-w5-cards-domain-variants: sports-odds variant required');
  }

  if (DA_W5_DOMAIN_CARD_WIRE_TARGETS.length < 6) {
    throw new Error('da-w5-cards-domain-variants: wire targets incomplete');
  }
}
