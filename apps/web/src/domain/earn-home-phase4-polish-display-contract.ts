/**
 * Phase 4 Earn/Home polish + Human Interaction QA
 * (`phase4-earn-home` · `resume-phase4-earn-home`).
 *
 * Canon: EARN_UX_CANON.md · HOME_UX_CANON.md · DESIGN_PRINCIPLES touch floor.
 * Scope: presentation only — no RPC/controller signature changes.
 */

import {
  DS_TOUCH_TARGET_MIN_HEIGHT_CLASS,
  DS_TOUCH_TARGET_MIN_PX,
} from '@/domain/touch-target-display-contract';
import { VIEWPORT_SMOKE_WIDTHS } from '@/product/tokens/viewport-contract';

export const PHASE4_EARN_HOME_TODO = 'phase4-earn-home' as const;
export const RESUME_PHASE4_EARN_HOME_TODO = 'resume-phase4-earn-home' as const;

/** Hub → missions → referral/tier → HI-QA execution order (non-waivable). */
export const PHASE4_EARN_HOME_PART_ORDER = [
  'home-hub',
  'missions',
  'referral-tier',
  'hi-qa',
] as const;

export type Phase4EarnHomePart = (typeof PHASE4_EARN_HOME_PART_ORDER)[number];

/** Owner surfaces/primitives touched by this polish pass. */
export const PHASE4_EARN_HOME_OWNER_PATHS = [
  'product/surfaces/home/earn-home-page.tsx',
  'product/surfaces/home/home-missions-page.tsx',
  'product/surfaces/home/home-missions-referral-page.tsx',
  'product/surfaces/home/home-missions-invite-page.tsx',
  'product/surfaces/referral/referral-page.tsx',
  'product/surfaces/tier/tier-leaderboard-page.tsx',
  'product/surfaces/tier/tier-me-page.tsx',
  'product/surfaces/staking/staking-hub-page.tsx',
] as const;

/**
 * Human Interaction QA matrix — mission cards · referral CTAs · tier links.
 * Source-level contracts below prove wiring; 390/768/1024/2560 capture
 * remains operator/CDP evidence (G13 — no agent-local E2E).
 */
export const PHASE4_EARN_HOME_HI_QA_MATRIX = [
  {
    id: 'signature-flow-touch',
    surface: 'earn-home',
    interaction: 'tap+keyboard',
    ownerHint: 'earn-home-page.tsx signature-flow chips',
    pass: `buttonVariants outline sm · ≥${DS_TOUCH_TARGET_MIN_PX}px + focus-visible ring`,
  },
  {
    id: 'tier-progress-link',
    surface: 'earn-home+tier',
    interaction: 'tap+keyboard',
    ownerHint: 'earn-home-tier-link · tier-me-benefits-link · tier-leaderboard-back',
    pass: 'ghost/sm buttonVariants — not bare text underline',
  },
  {
    id: 'fold4-mission-card-nav',
    surface: 'earn-home',
    interaction: 'tap+keyboard',
    ownerHint: 'earn-home-mission-* full-card Link',
    pass: 'mission preview cards navigate via focusable Link',
  },
  {
    id: 'missions-tab-touch',
    surface: 'home-missions',
    interaction: 'tap+keyboard',
    ownerHint: 'home-missions-tabs',
    pass: `min-h token ${DS_TOUCH_TARGET_MIN_PX}px + focus-visible ring`,
  },
  {
    id: 'missions-start-cta',
    surface: 'home-missions',
    interaction: 'tap',
    ownerHint: 'home-mission-link-* outline md',
    pass: 'in_progress start CTA uses buttonVariants (not tiny text link)',
  },
  {
    id: 'missions-detail-close',
    surface: 'home-missions',
    interaction: 'tap+keyboard',
    ownerHint: 'home-missions-detail-close IconButton',
    pass: '48px IconButton close — not p-1 icon',
  },
  {
    id: 'referral-spa-ctas',
    surface: 'referral',
    interaction: 'tap',
    ownerHint: 'referral-invite-cta · referral-leaderboard-cta Link',
    pass: 'internal routes use router Link (no full reload <a href>)',
  },
  {
    id: 'staking-pool-keyboard',
    surface: 'staking',
    interaction: 'keyboard',
    ownerHint: 'staking-pool-* role=button',
    pass: 'Enter/Space + focus-visible ring on pool cards',
  },
] as const;

export type Phase4EarnHomeHiQaId = (typeof PHASE4_EARN_HOME_HI_QA_MATRIX)[number]['id'];

/** Viewport smoke widths — canonical 4-tier (do not extend with 3440+). */
export const PHASE4_EARN_HOME_VIEWPORT_WIDTHS = VIEWPORT_SMOKE_WIDTHS;

export const PHASE4_EARN_HOME_THEMES = ['light', 'dark'] as const;

/** Signature-flow chip must consume shared Button outline + touch floor. */
export const PHASE4_SIGNATURE_FLOW_MARKERS = [
  'earn-home-signature-flow',
  'buttonVariants',
  'variant: \'outline\'',
  'size: \'sm\'',
] as const;

/** Mission start CTAs must use buttonVariants (not bare underline text). */
export const PHASE4_MISSION_START_CTA_MARKERS = [
  'buttonVariants({ variant: \'outline\', size: \'md\' })',
  'home-mission-link-',
] as const;

/** Referral hub primary CTAs must be router Link, not raw anchors. */
export const PHASE4_REFERRAL_LINK_TEST_IDS = [
  'referral-invite-cta',
  'referral-leaderboard-cta',
  'referral-affiliate-terms-link',
] as const;

export function assertEarnHomePhase4PolishContractSync(): void {
  if (PHASE4_EARN_HOME_PART_ORDER[0] !== 'home-hub') {
    throw new Error('phase4-earn-home: home hub must run first');
  }

  if (PHASE4_EARN_HOME_PART_ORDER[PHASE4_EARN_HOME_PART_ORDER.length - 1] !== 'hi-qa') {
    throw new Error('phase4-earn-home: HI-QA must close the part order');
  }

  if (PHASE4_EARN_HOME_HI_QA_MATRIX.length < 6) {
    throw new Error('phase4-earn-home: HI-QA matrix incomplete');
  }

  const hiIds = PHASE4_EARN_HOME_HI_QA_MATRIX.map((row) => row.id);
  if (new Set(hiIds).size !== hiIds.length) {
    throw new Error('phase4-earn-home: HI-QA ids must be unique');
  }

  if (PHASE4_EARN_HOME_VIEWPORT_WIDTHS.length !== 4) {
    throw new Error('phase4-earn-home: keep 4-tier smoke widths (no ultrawide push)');
  }

  if (!PHASE4_EARN_HOME_VIEWPORT_WIDTHS.includes(390)) {
    throw new Error('phase4-earn-home: mobile 390 required');
  }

  if (!DS_TOUCH_TARGET_MIN_HEIGHT_CLASS.includes('--ds-touch-target-min')) {
    throw new Error('phase4-earn-home: missions tabs must share touch-target token class');
  }

  if (DS_TOUCH_TARGET_MIN_PX !== 48) {
    throw new Error('phase4-earn-home: touch floor must remain 48px');
  }
}
