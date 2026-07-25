/**
 * Phase 3 Sports polish + VIP stub re-verify
 * (`phase3-sports` · `resume-phase3-sports`).
 *
 * Canon: SPORTS_UX_CANON.md · DESIGN_PRINCIPLES touch floor.
 * Scope: presentation only — no RPC/controller signature changes.
 * Engine-blocked: sport_code tree (league chips only until RPC lands).
 */

import { PQA_DEAD_CONTROL_DEFER_REGISTRY } from '@/domain/dead-controls-display-contract';
import {
  canBrowseSportsVipMarkets,
  SPORTS_VIP_PAGE_EXPOSURE,
} from '@/domain/sports-rules-and-vip-display-contract';
import { DS_TOUCH_TARGET_MIN_HEIGHT_CLASS } from '@/domain/touch-target-display-contract';
import { VIEWPORT_SMOKE_WIDTHS } from '@/product/tokens/viewport-contract';

export const PHASE3_SPORTS_TODO = 'phase3-sports' as const;
export const RESUME_PHASE3_SPORTS_TODO = 'resume-phase3-sports' as const;

/** Dead-controls registry id — historical name; mitigatedBy must stay live. */
export const PHASE3_SPORTS_VIP_DEAD_CONTROL_ID = 'sports-vip-coming-soon' as const;

export const PHASE3_SPORTS_PART_ORDER = [
  'vip-reverify',
  'layout-density',
  'mobile-slip-sheet',
  'hi-qa',
] as const;

export type Phase3SportsPart = (typeof PHASE3_SPORTS_PART_ORDER)[number];

export const PHASE3_SPORTS_OWNER_PATHS = [
  'product/surfaces/sports/sports-page.tsx',
  'product/surfaces/sports/sports-bet-slip-panel.tsx',
  'product/surfaces/sports/sports-vip-stub-panel.tsx',
  'product/tokens/layout.css',
] as const;

/**
 * Human Interaction QA matrix — sportsbook scan + slip sheet.
 * Source-level contracts below prove wiring; 390/768/1024/2560 capture
 * remains operator/CDP evidence (G13 — no agent-local E2E).
 */
export const PHASE3_SPORTS_HI_QA_MATRIX = [
  {
    id: 'vip-mitigated-live',
    surface: 'sports-vip',
    interaction: 'read',
    ownerHint: 'dead-controls sports-vip-coming-soon',
    pass: 'mitigatedBy=live · LAUNCH_GATES.sportsVipSurface browse open',
  },
  {
    id: 'desktop-grid-no-empty-gutter',
    surface: 'sports-hub',
    interaction: 'layout',
    ownerHint: 'sports-page.tsx resolveSportsHubGridClass',
    pass: 'grid cols collapse when league rail and/or slip absent',
  },
  {
    id: 'mobile-league-chip-scroll',
    surface: 'sports-league',
    interaction: 'horizontal-scroll',
    ownerHint: 'sports-league-rail-mobile + ds-shell-subnav-scroller',
    pass: 'league chips horizontal scroll-snap; page root overflow-x hidden',
  },
  {
    id: 'mobile-slip-bottom-sheet',
    surface: 'sports-slip',
    interaction: 'tap',
    ownerHint: 'sports-slip-mobile-open + Sheet',
    pass: 'sticky open bar ≥48px; slip panel in bottom sheet (not end-of-flex bury)',
  },
  {
    id: 'slip-howto-helptip',
    surface: 'sports-slip',
    interaction: 'tap',
    ownerHint: 'HelpTip on slip header',
    pass: '? collapsed howto — no full-width plain-language strip',
  },
  {
    id: 'desktop-slip-rail',
    surface: 'sports-slip',
    interaction: 'read',
    ownerHint: 'sports-slip-rail lg:block',
    pass: 'lg+ slip rail mounted on list/fixture/vip browse modes',
  },
] as const;

export type Phase3SportsHiQaId = (typeof PHASE3_SPORTS_HI_QA_MATRIX)[number]['id'];

/** Viewport smoke widths — canonical 4-tier (do not extend with 3440+). */
export const PHASE3_SPORTS_VIEWPORT_WIDTHS = VIEWPORT_SMOKE_WIDTHS;

export const PHASE3_SPORTS_THEMES = ['light', 'dark'] as const;

export const PHASE3_SPORTS_MOBILE_SLIP_OPEN_TEST_ID = 'sports-slip-mobile-open' as const;
export const PHASE3_SPORTS_LEAGUE_MOBILE_TEST_ID = 'sports-league-rail-mobile' as const;
export const PHASE3_SPORTS_LEAGUE_DESKTOP_TEST_ID = 'sports-league-rail-desktop' as const;

/** Source markers proving mobile league chips use shell scroller (not vertical stack). */
export const PHASE3_SPORTS_MOBILE_LEAGUE_MARKERS = [
  'ds-shell-subnav-scroller',
  'ds-shell-subnav-chip',
  PHASE3_SPORTS_LEAGUE_MOBILE_TEST_ID,
] as const;

/** Source markers proving mobile slip is sheet-backed. */
export const PHASE3_SPORTS_MOBILE_SLIP_MARKERS = [
  'Sheet',
  'SheetContent',
  PHASE3_SPORTS_MOBILE_SLIP_OPEN_TEST_ID,
  'sports-slip-mobile-sheet',
] as const;

export function assertSportsPhase3PolishContractSync(): void {
  if (PHASE3_SPORTS_PART_ORDER[0] !== 'vip-reverify') {
    throw new Error('phase3-sports: VIP re-verify must run first');
  }

  if (PHASE3_SPORTS_HI_QA_MATRIX.length < 6) {
    throw new Error('phase3-sports: HI-QA matrix incomplete');
  }

  const hiIds = PHASE3_SPORTS_HI_QA_MATRIX.map((row) => row.id);
  if (new Set(hiIds).size !== hiIds.length) {
    throw new Error('phase3-sports: HI-QA ids must be unique');
  }

  if (PHASE3_SPORTS_VIEWPORT_WIDTHS.length !== 4) {
    throw new Error('phase3-sports: keep 4-tier smoke widths (no ultrawide push)');
  }

  if (!PHASE3_SPORTS_VIEWPORT_WIDTHS.includes(390)) {
    throw new Error('phase3-sports: mobile 390 required');
  }

  const vip = PQA_DEAD_CONTROL_DEFER_REGISTRY.find(
    (row) => row.id === PHASE3_SPORTS_VIP_DEAD_CONTROL_ID,
  );
  if (!vip) {
    throw new Error('phase3-sports: sports-vip-coming-soon registry row missing');
  }
  if (vip.mitigatedBy !== 'live') {
    throw new Error('phase3-sports: VIP stub must stay mitigatedBy=live');
  }
  if (!canBrowseSportsVipMarkets()) {
    throw new Error('phase3-sports: VIP markets browse must remain open after E5');
  }
  if (SPORTS_VIP_PAGE_EXPOSURE !== 'live') {
    throw new Error('phase3-sports: VIP page exposure must stay live');
  }

  if (!DS_TOUCH_TARGET_MIN_HEIGHT_CLASS.includes('--ds-touch-target-min')) {
    throw new Error('phase3-sports: mobile slip open must share touch-target token class');
  }
}
