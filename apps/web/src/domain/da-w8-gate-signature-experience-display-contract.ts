/**
 * DA W8 Signature Experience GATE (§34.2 Emotion Map · §34.21–34.27 · YAML #228).
 * Authority: `da-w8-gate-signature-experience` · PRODUCT_EXPERIENCE_CANON · ADR-009.
 * DoD: Emotion Map spot-check · gate:ai-impl da-w8 bundle · operator VISUAL: da-w8-signature · 82 doc sync.
 */

import {
  DA_W8_SIGNATURE_MOMENTS,
  DA_W8_SIGNATURE_SURFACES,
  DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO,
  DA_W8_SIGNATURE_WIRE_TARGETS,
  type DaW8SignatureSurface,
} from './da-w8-signature-surfaces-display-contract';
import {
  DA_W8_SOUND_DESIGN_SPEC_TODO,
  DA_W8_SOUND_IMPLEMENTATION_WAVE,
  DA_W8_SOUND_TONES,
} from './da-w8-sound-design-display-contract';

export const DA_W8_GATE_SIGNATURE_EXPERIENCE_TODO = 'da-w8-gate-signature-experience' as const;

/** Prerequisite DOC must be closed before this GATE (BUNDLE is transitive via DOC). */
export const DA_W8_GATE_SIGNATURE_EXPERIENCE_PREREQUISITE_TODOS = [
  DA_W8_SOUND_DESIGN_SPEC_TODO,
  DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO,
] as const;

/**
 * §34.2 Emotion Map — target emotion per signature surface (PRODUCT_EXPERIENCE_CANON §2).
 * Spot-check: each W8 signature moment must align with its Emotion Map target.
 */
export const DA_W8_GATE_EMOTION_MAP_TARGETS = {
  home: 'achievement-restrained',
  wallet: 'stability-control',
  trade: 'focus-professional',
  sports: 'scan-tension-restrained',
  casino: 'discovery-delight',
  vip: 'upgrade-celebration-restrained',
} as const satisfies Record<DaW8SignatureSurface, string>;

export type DaW8GateEmotionTarget =
  (typeof DA_W8_GATE_EMOTION_MAP_TARGETS)[DaW8SignatureSurface];

/**
 * §34.2 Emotion Map — forbidden emotions (spot-check must prove absence in signature wire).
 */
export const DA_W8_GATE_EMOTION_MAP_FORBIDDEN = {
  home: ['false_urgency', 'guaranteed_reward'],
  wallet: ['anxiety_nudge', 'fake_urgency_on_withdraw'],
  trade: ['gambling_excitement', 'casino_style_flash'],
  sports: ['guaranteed_win', 'false_odds_hype'],
  casino: ['addiction_loop', 'infinite_decorative_on_bet_submit'],
  vip: ['xp_tick_every_point', 'decay_false_complete'],
} as const satisfies Record<DaW8SignatureSurface, readonly string[]>;

/**
 * §34.21–34.26 GATE scan cues — one unique fingerprint per signature surface + sound DOC.
 * Each cue must be distinguishable without pixel visual gate.
 */
export const DA_W8_GATE_SIGNATURE_SCAN_CUES = {
  home: DA_W8_SIGNATURE_MOMENTS.home,
  wallet: DA_W8_SIGNATURE_MOMENTS.wallet,
  trade: DA_W8_SIGNATURE_MOMENTS.trade,
  casino: DA_W8_SIGNATURE_MOMENTS.casino,
  sports: DA_W8_SIGNATURE_MOMENTS.sports,
  vip: DA_W8_SIGNATURE_MOMENTS.vip,
  sound_doc_defer: 'four-tone-spec-e-wave',
} as const;

export type DaW8GateSignatureScanCue = keyof typeof DA_W8_GATE_SIGNATURE_SCAN_CUES;

/** Structural CSS / data markers that prove signature distinguishability. */
export const DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS = {
  home: ["data-signature='greeting-day-flow'", 'earn-home-greeting', 'earn-home-signature-flow'],
  wallet: ["data-signature='living-balance'", 'wallet-balance-hero'],
  trade: [
    "data-signature='market-heat-volume-pulse'",
    'data-market-heat',
    'data-volume-pulse',
  ],
  casino: [
    "data-signature='tile-float-glow'",
    "data-card-variant='casino-play'",
    'ds-casino-tile-float',
  ],
  sports: ["data-signature='kickoff-countdown'", 'sports-kickoff-countdown'],
  vip: ["data-signature='xp-fill'", 'data-xp-fill', 'fillOnMount'],
  sound_doc_defer: [
    'SOUND_DESIGN_CANON.md',
    'da-w8-sound-design-spec-defer',
    'E-Wave',
    'DA_W8_SOUND_TONES',
  ],
} as const satisfies Record<DaW8GateSignatureScanCue, readonly string[]>;

/** Primary GATE owners — signature surfaces + sound DOC. */
export const DA_W8_GATE_SIGNATURE_PRIMARY_OWNER_PATHS = [
  'product/surfaces/home/earn-home-page.tsx',
  'product/surfaces/wallet/wallet-balance-hero.tsx',
  'product/surfaces/trade/trade-market-ticker-stats.tsx',
  'product/surfaces/casino/casino-lobby-page.tsx',
  'product/surfaces/sports/sports-kickoff-countdown.tsx',
  'product/surfaces/tier/tier-me-page.tsx',
  'product/tokens/signature-surfaces.css',
  'domain/da-w8-sound-design-display-contract.ts',
] as const;

/** On-disk artifacts required for W8 Signature Experience GATE. */
export const DA_W8_GATE_SIGNATURE_EXPERIENCE_ARTIFACT_PATHS = [
  'domain/da-w8-gate-signature-experience-display-contract.ts',
  'domain/da-w8-signature-surfaces-display-contract.ts',
  'domain/da-w8-sound-design-display-contract.ts',
  'product/tokens/signature-surfaces.css',
  'product/surfaces/home/earn-home-page.tsx',
  'product/surfaces/wallet/wallet-balance-hero.tsx',
  'product/surfaces/trade/trade-market-ticker-stats.tsx',
  'product/surfaces/casino/casino-lobby-page.tsx',
  'product/surfaces/sports/sports-kickoff-countdown.tsx',
  'product/surfaces/tier/tier-me-page.tsx',
] as const;

/** gate:ai-impl owner paths — GATE + BUNDLE + DOC companions. */
export const DA_W8_GATE_SIGNATURE_EXPERIENCE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w8-gate-signature-experience-display-contract.test.ts',
  'apps/web/src/domain/__tests__/da-w8-signature-surfaces-display-contract.test.ts',
  'apps/web/src/domain/__tests__/da-w8-sound-design-display-contract.test.ts',
  'apps/web/src/product/tokens/__tests__/signature-surfaces.test.ts',
  'apps/web/src/product/surfaces/__tests__/da-w8-gate-signature-experience.test.tsx',
  'apps/web/src/product/surfaces/home/__tests__/earn-home-page.test.tsx',
  'apps/web/src/product/surfaces/wallet/__tests__/wallet-page.test.tsx',
  'apps/web/src/product/surfaces/trade/__tests__/trade-market-ticker-stats.test.tsx',
  'apps/web/src/product/surfaces/casino/__tests__/casino-lobby-page.test.tsx',
  'apps/web/src/product/surfaces/sports/__tests__/sports-page.test.tsx',
  'apps/web/src/product/surfaces/tier/__tests__/tier-me-page.test.tsx',
] as const;

/** Operator VISUAL: da-w8-signature advisory checklist (§34.21–34.27 · advisory until da-w7 / §20.12 full). */
export const DA_W8_GATE_SIGNATURE_VISUAL_ADVISORY_CHECKLIST = [
  'home-greeting-day-flow',
  'wallet-living-balance-count-up',
  'trade-market-heat-volume-pulse',
  'casino-tile-float-glow',
  'sports-kickoff-countdown',
  'vip-xp-fill',
  'emotion-map-spot-check-six-surfaces',
  'sound-doc-four-tones-e-wave-defer',
  'prefers-reduced-motion-static',
  'check-design-tokens-advisory',
] as const;

/** Map signature surface → Emotion Map target. */
export function daW8GateEmotionTarget(
  surface: DaW8SignatureSurface,
): DaW8GateEmotionTarget {
  return DA_W8_GATE_EMOTION_MAP_TARGETS[surface];
}

/** Map signature surface → signature moment scan cue. */
export function daW8GateSignatureMoment(
  surface: DaW8SignatureSurface,
): (typeof DA_W8_SIGNATURE_MOMENTS)[DaW8SignatureSurface] {
  return DA_W8_SIGNATURE_MOMENTS[surface];
}

/** Non-waivable sync for DA W8 GATE closeout. */
export function assertDaW8GateSignatureExperienceSync(): void {
  if (
    !DA_W8_GATE_SIGNATURE_EXPERIENCE_PREREQUISITE_TODOS.includes(DA_W8_SOUND_DESIGN_SPEC_TODO)
  ) {
    throw new Error(
      'da-w8-gate-signature-experience: missing prerequisite da-w8-sound-design-spec-defer',
    );
  }

  if (
    !DA_W8_GATE_SIGNATURE_EXPERIENCE_PREREQUISITE_TODOS.includes(
      DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO,
    )
  ) {
    throw new Error(
      'da-w8-gate-signature-experience: missing prerequisite da-w8-signature-surfaces-bundle',
    );
  }

  if (DA_W8_SIGNATURE_SURFACES.length !== 6) {
    throw new Error('da-w8-gate-signature-experience: expected 6 signature surfaces from BUNDLE');
  }

  for (const surface of DA_W8_SIGNATURE_SURFACES) {
    if (!(surface in DA_W8_GATE_EMOTION_MAP_TARGETS)) {
      throw new Error(`da-w8-gate-signature-experience: missing Emotion Map target for ${surface}`);
    }
    if (!(surface in DA_W8_GATE_EMOTION_MAP_FORBIDDEN)) {
      throw new Error(
        `da-w8-gate-signature-experience: missing Emotion Map forbidden for ${surface}`,
      );
    }
    if (DA_W8_GATE_SIGNATURE_SCAN_CUES[surface] !== DA_W8_SIGNATURE_MOMENTS[surface]) {
      throw new Error(
        `da-w8-gate-signature-experience: scan cue/moment mismatch for ${surface}`,
      );
    }
  }

  if (DA_W8_SIGNATURE_WIRE_TARGETS.length !== 6) {
    throw new Error('da-w8-gate-signature-experience: wire targets incomplete');
  }

  if (DA_W8_SOUND_TONES.length !== 4) {
    throw new Error('da-w8-gate-signature-experience: sound DOC must pin 4 tones');
  }

  if (DA_W8_SOUND_IMPLEMENTATION_WAVE !== 'E-Wave') {
    throw new Error('da-w8-gate-signature-experience: sound must remain E-Wave defer');
  }

  const cues = Object.values(DA_W8_GATE_SIGNATURE_SCAN_CUES);
  if (new Set(cues).size !== cues.length) {
    throw new Error('da-w8-gate-signature-experience: scan cues must be unique');
  }

  if (DA_W8_GATE_SIGNATURE_PRIMARY_OWNER_PATHS.length < 7) {
    throw new Error('da-w8-gate-signature-experience: primary owners incomplete');
  }

  if (DA_W8_GATE_SIGNATURE_EXPERIENCE_TEST_PATHS.length < 8) {
    throw new Error('da-w8-gate-signature-experience: owner test paths incomplete');
  }

  if (DA_W8_GATE_SIGNATURE_VISUAL_ADVISORY_CHECKLIST.length < 8) {
    throw new Error('da-w8-gate-signature-experience: VISUAL advisory checklist incomplete');
  }
}
