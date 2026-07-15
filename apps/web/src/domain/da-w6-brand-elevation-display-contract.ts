/**
 * DA W6 Brand elevation BUNDLE (§34.18–34.20 · YAML #216).
 * Authority: `da-w6-brand-elevation-bundle` · DESIGN_CHARTER §6 · ADR-009 · PRODUCT_EXPERIENCE_CANON.
 * Absorbed (51st merge · same PR): brand-mark-aurora · domain-empty-states · loading-signature.
 */

export const DA_W6_BRAND_ELEVATION_BUNDLE_TODO = 'da-w6-brand-elevation-bundle' as const;

export const P10_OPERATOR_VISUAL_SIGNOFF_TODO = 'p10-operator-visual-signoff' as const;

/** Prerequisite VISUAL must be agent-impl closed before this BUNDLE. */
export const DA_W6_BRAND_ELEVATION_PREREQUISITE_TODOS = [P10_OPERATOR_VISUAL_SIGNOFF_TODO] as const;

/** §34.18 BrandMark aurora — geometric recall + Quad Stream glow. */
export const DA_W6_BRAND_MARK_AURORA_VARIANT = 'aurora' as const;

/** §34.19 Domain empty-state personalities. */
export const DA_W6_DOMAIN_EMPTY_DOMAINS = ['casino', 'trade', 'wallet', 'sports'] as const;

export type DaW6DomainEmptyDomain = (typeof DA_W6_DOMAIN_EMPTY_DOMAINS)[number];

/** Signature illustration id per domain (§34.19 operator table). */
export const DA_W6_DOMAIN_EMPTY_SIGNATURES = {
  casino: 'chips',
  trade: 'pulse',
  wallet: 'vault',
  sports: 'stadium',
} as const satisfies Record<DaW6DomainEmptyDomain, string>;

/** §34.20 Quad Stream loading — 4-axis order (Earn → Trade → Sports → Casino). */
export const DA_W6_QUAD_STREAM_LOADING_AXES = ['earn', 'trading', 'sports', 'casino'] as const;

export type DaW6QuadStreamLoadingAxis = (typeof DA_W6_QUAD_STREAM_LOADING_AXES)[number];

/** Surfaces that must wire W6 brand elevation artifacts. */
export const DA_W6_BRAND_ELEVATION_WIRE_TARGETS = [
  'brand_mark_aurora',
  'landing_hero_aurora',
  'domain_empty_casino',
  'domain_empty_trade',
  'domain_empty_wallet',
  'domain_empty_sports',
  'quad_stream_loading',
  'router_pending',
] as const;

export type DaW6BrandElevationWireTarget = (typeof DA_W6_BRAND_ELEVATION_WIRE_TARGETS)[number];

/** On-disk artifacts required for W6 brand elevation BUNDLE. */
export const DA_W6_BRAND_ELEVATION_ARTIFACT_PATHS = [
  'domain/da-w6-brand-elevation-display-contract.ts',
  'product/primitives/brand-mark.tsx',
  'product/primitives/empty-state.tsx',
  'product/primitives/domain-empty-mark.tsx',
  'product/primitives/quad-stream-loading.tsx',
  'product/tokens/brand-elevation.css',
  'product/surfaces/landing/landing-page.tsx',
  'product/surfaces/casino/casino-lobby-page.tsx',
  'product/surfaces/trade/futures-positions-panel.tsx',
  'product/surfaces/wallet/ledger-page.tsx',
  'product/surfaces/sports/sports-fixture-board.tsx',
  'product/surfaces/sports/sports-vip-stub-panel.tsx',
  'router.ts',
] as const;

/** gate:ai-impl owner paths — contract + primitives + wire consumers. */
export const DA_W6_BRAND_ELEVATION_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w6-brand-elevation-display-contract.test.ts',
  'apps/web/src/product/primitives/__tests__/brand-mark.test.tsx',
  'apps/web/src/product/primitives/__tests__/domain-empty-mark.test.tsx',
  'apps/web/src/product/primitives/__tests__/quad-stream-loading.test.tsx',
  'apps/web/src/product/tokens/__tests__/brand-elevation.test.ts',
  'apps/web/src/product/surfaces/landing/__tests__/landing-page.test.tsx',
  'apps/web/src/product/surfaces/casino/__tests__/casino-lobby-page.test.tsx',
  'apps/web/src/product/surfaces/wallet/__tests__/ledger-page.test.tsx',
  'apps/web/src/product/surfaces/sports/__tests__/sports-page.test.tsx',
  'apps/web/src/product/surfaces/trade/__tests__/futures-positions-panel.test.tsx',
] as const;

/** Non-waivable sync for DA W6 BUNDLE closeout. */
export function assertDaW6BrandElevationSync(): void {
  if (!DA_W6_BRAND_ELEVATION_PREREQUISITE_TODOS.includes(P10_OPERATOR_VISUAL_SIGNOFF_TODO)) {
    throw new Error(
      'da-w6-brand-elevation-bundle: missing prerequisite p10-operator-visual-signoff',
    );
  }

  if (DA_W6_DOMAIN_EMPTY_DOMAINS.length !== 4) {
    throw new Error('da-w6-brand-elevation-bundle: expected 4 domain empty personalities');
  }

  for (const domain of DA_W6_DOMAIN_EMPTY_DOMAINS) {
    if (!(domain in DA_W6_DOMAIN_EMPTY_SIGNATURES)) {
      throw new Error(`da-w6-brand-elevation-bundle: missing signature for ${domain}`);
    }
  }

  if (DA_W6_QUAD_STREAM_LOADING_AXES.length !== 4) {
    throw new Error('da-w6-brand-elevation-bundle: Quad Stream loading requires 4 axes');
  }

  if (DA_W6_BRAND_ELEVATION_WIRE_TARGETS.length < 6) {
    throw new Error('da-w6-brand-elevation-bundle: wire targets incomplete');
  }
}
