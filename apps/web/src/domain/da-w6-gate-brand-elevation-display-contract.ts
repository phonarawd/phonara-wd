/**
 * DA W6 Brand elevation GATE (§34.18–34.20 · YAML #217).
 * Authority: `da-w6-gate-brand-elevation` · DESIGN_CHARTER §6 · ADR-009 · PRODUCT_EXPERIENCE_CANON.
 * DoD: gate:ai-impl brand-mark · check:design-tokens advisory · operator VISUAL advisory.
 */

import {
  DA_W6_BRAND_ELEVATION_BUNDLE_TODO,
  DA_W6_BRAND_MARK_AURORA_VARIANT,
  DA_W6_DOMAIN_EMPTY_DOMAINS,
  DA_W6_DOMAIN_EMPTY_SIGNATURES,
  DA_W6_QUAD_STREAM_LOADING_AXES,
  type DaW6DomainEmptyDomain,
} from './da-w6-brand-elevation-display-contract';

export const DA_W6_GATE_BRAND_ELEVATION_TODO = 'da-w6-gate-brand-elevation' as const;

/** Prerequisite BUNDLE must be closed before this GATE. */
export const DA_W6_GATE_BRAND_ELEVATION_PREREQUISITE_TODOS = [
  DA_W6_BRAND_ELEVATION_BUNDLE_TODO,
] as const;

/**
 * §34.18–34.20 GATE scan cues — BrandMark aurora · 4 domain empties · Quad Stream loading.
 * Each cue must be distinguishable without pixel visual gate.
 */
export const DA_W6_GATE_BRAND_SCAN_CUES = {
  brand_mark_aurora: 'quad-stream-glow-mark',
  domain_empty_casino: 'chips',
  domain_empty_trade: 'pulse',
  domain_empty_wallet: 'vault',
  domain_empty_sports: 'stadium',
  quad_stream_loading: 'four-axis-pulse',
} as const;

export type DaW6GateBrandScanCue = keyof typeof DA_W6_GATE_BRAND_SCAN_CUES;

/** Structural CSS / data markers that prove brand elevation distinguishability. */
export const DA_W6_GATE_BRAND_DISTINGUISH_MARKERS = {
  brand_mark_aurora: [
    'ds-brand-mark-aurora',
    "data-brand-variant='aurora'",
    'ds-brand-mark-aurora__glow',
  ],
  domain_empty_casino: ["data-domain='casino'", "data-signature='chips'"],
  domain_empty_trade: ["data-domain='trade'", "data-signature='pulse'"],
  domain_empty_wallet: ["data-domain='wallet'", "data-signature='vault'"],
  domain_empty_sports: ["data-domain='sports'", "data-signature='stadium'"],
  quad_stream_loading: [
    'ds-quad-stream-loading',
    "data-axis='earn'",
    "data-axis='trading'",
    "data-axis='sports'",
    "data-axis='casino'",
  ],
} as const satisfies Record<DaW6GateBrandScanCue, readonly string[]>;

/**
 * Primary GATE owners from todo content:
 * gate:ai-impl brand-mark (+ domain empty + Quad Stream loading companions).
 */
export const DA_W6_GATE_BRAND_PRIMARY_OWNER_PATHS = [
  'product/primitives/brand-mark.tsx',
  'product/primitives/domain-empty-mark.tsx',
  'product/primitives/quad-stream-loading.tsx',
] as const;

/** On-disk artifacts required for W6 brand elevation GATE. */
export const DA_W6_GATE_BRAND_ELEVATION_ARTIFACT_PATHS = [
  'domain/da-w6-gate-brand-elevation-display-contract.ts',
  'domain/da-w6-brand-elevation-display-contract.ts',
  'product/tokens/brand-elevation.css',
  ...DA_W6_GATE_BRAND_PRIMARY_OWNER_PATHS,
] as const;

/** gate:ai-impl owner paths — brand-mark primary + BUNDLE companions + GATE surface. */
export const DA_W6_GATE_BRAND_ELEVATION_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w6-gate-brand-elevation-display-contract.test.ts',
  'apps/web/src/domain/__tests__/da-w6-brand-elevation-display-contract.test.ts',
  'apps/web/src/product/primitives/__tests__/brand-mark.test.tsx',
  'apps/web/src/product/primitives/__tests__/domain-empty-mark.test.tsx',
  'apps/web/src/product/primitives/__tests__/quad-stream-loading.test.tsx',
  'apps/web/src/product/tokens/__tests__/brand-elevation.test.ts',
  'apps/web/src/product/surfaces/__tests__/da-w6-gate-brand-elevation.test.tsx',
] as const;

/** Operator VISUAL advisory checklist (§34.18–34.20 · advisory until da-w7 / §20.12 full). */
export const DA_W6_GATE_BRAND_ELEVATION_VISUAL_ADVISORY_CHECKLIST = [
  'brand-mark-aurora-quad-stream-glow',
  'landing-hero-aurora-variant',
  'domain-empty-casino-chips',
  'domain-empty-trade-pulse',
  'domain-empty-wallet-vault',
  'domain-empty-sports-stadium',
  'quad-stream-loading-four-axes',
  'router-pending-quad-stream',
  'prefers-reduced-motion-static',
  'check-design-tokens-advisory',
] as const;

/** Map domain empty scan cues back to BUNDLE signatures. */
export function daW6GateDomainEmptySignature(
  domain: DaW6DomainEmptyDomain,
): (typeof DA_W6_DOMAIN_EMPTY_SIGNATURES)[DaW6DomainEmptyDomain] {
  return DA_W6_DOMAIN_EMPTY_SIGNATURES[domain];
}

/** Non-waivable sync for DA W6 GATE closeout. */
export function assertDaW6GateBrandElevationSync(): void {
  if (!DA_W6_GATE_BRAND_ELEVATION_PREREQUISITE_TODOS.includes(DA_W6_BRAND_ELEVATION_BUNDLE_TODO)) {
    throw new Error('da-w6-gate-brand-elevation: missing prerequisite da-w6-brand-elevation-bundle');
  }

  if (DA_W6_BRAND_MARK_AURORA_VARIANT !== 'aurora') {
    throw new Error('da-w6-gate-brand-elevation: BrandMark aurora variant required');
  }

  if (DA_W6_DOMAIN_EMPTY_DOMAINS.length !== 4) {
    throw new Error('da-w6-gate-brand-elevation: expected 4 domain empty personalities from BUNDLE');
  }

  for (const domain of DA_W6_DOMAIN_EMPTY_DOMAINS) {
    const cueKey = `domain_empty_${domain}` as DaW6GateBrandScanCue;
    if (!(cueKey in DA_W6_GATE_BRAND_SCAN_CUES)) {
      throw new Error(`da-w6-gate-brand-elevation: missing scan cue for ${domain}`);
    }
    if (DA_W6_GATE_BRAND_SCAN_CUES[cueKey] !== DA_W6_DOMAIN_EMPTY_SIGNATURES[domain]) {
      throw new Error(`da-w6-gate-brand-elevation: scan cue/signature mismatch for ${domain}`);
    }
  }

  if (DA_W6_QUAD_STREAM_LOADING_AXES.length !== 4) {
    throw new Error('da-w6-gate-brand-elevation: Quad Stream loading requires 4 axes');
  }

  const cues = Object.values(DA_W6_GATE_BRAND_SCAN_CUES);
  if (new Set(cues).size !== cues.length) {
    throw new Error('da-w6-gate-brand-elevation: scan cues must be unique');
  }

  if (DA_W6_GATE_BRAND_PRIMARY_OWNER_PATHS.length !== 3) {
    throw new Error('da-w6-gate-brand-elevation: brand-mark + domain-empty + quad-stream owners required');
  }

  if (DA_W6_GATE_BRAND_ELEVATION_TEST_PATHS.length < 6) {
    throw new Error('da-w6-gate-brand-elevation: owner test paths incomplete');
  }

  if (DA_W6_GATE_BRAND_ELEVATION_VISUAL_ADVISORY_CHECKLIST.length < 8) {
    throw new Error('da-w6-gate-brand-elevation: VISUAL advisory checklist incomplete');
  }
}
