/**
 * E5 gap surfaces WIRE pin (YAML #248).
 * Authority: Plan `ew-e5-gap-surfaces-wire` · §22.5.1 STUB→live presentation.
 *
 * Same-PR wire: `/tier/me` decay (E1 already live) · `/referral/leaderboard` rank list ·
 * `/sports/vip` fixture browse. No new migrations — engine gates E1/E3/E4 green.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import { isTierMeDecayFullUnlocked } from './ew-e1-gate-decay-display-contract';
import {
  REFERRAL_LEADERBOARD_ROUTE,
  REFERRAL_LEADERBOARD_UI_UNLOCK_TODO,
  isReferralLeaderboardRankListLive,
  shouldDeferReferralLeaderboard,
} from './referral-leaderboard-display-contract';
import {
  canBrowseSportsVipMarkets,
  resolveSportsVipPageExposure,
  SPORTS_VIP_LIVE_UNLOCK_TODO,
  SPORTS_VIP_STUB_ROUTE,
} from './sports-rules-and-vip-display-contract';
import { TIER_ME_ROUTE } from './tier-me-display-contract';
import { isReferralLeaderboardLiveUnlocked } from './viral-cms-display-contract';
import { isSportsVipSurfaceUnlocked } from './tier-option-b-display-contract';

export const EW_E5_GAP_SURFACES_WIRE_TODO = 'ew-e5-gap-surfaces-wire' as const;
export const EW_E5_GAP_SURFACES_WIRE_PREREQUISITE_TODO = 'ew-e4-gate-tier-option-b' as const;
export const EW_E5_GAP_SURFACES_WIRE_NEXT_TODO = 'ew-e5-gate-gap-surfaces' as const;

export const EW_E5_GAP_SURFACES_WIRE_ROUTES = [
  TIER_ME_ROUTE,
  REFERRAL_LEADERBOARD_ROUTE,
  SPORTS_VIP_STUB_ROUTE,
] as const;

export const EW_E5_GAP_SURFACES_WIRE_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e5-gap-surfaces-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e5-gap-surfaces-display-contract.test.ts',
  'apps/web/src/domain/referral-leaderboard-display-contract.ts',
  'apps/web/src/domain/sports-rules-and-vip-display-contract.ts',
  'apps/web/src/features/earn/use-referral-leaderboard-controller.ts',
  'apps/web/src/product/surfaces/referral/referral-leaderboard-page.tsx',
  'apps/web/src/product/surfaces/sports/sports-vip-stub-panel.tsx',
  'apps/web/src/product/surfaces/sports/sports-page.tsx',
  'apps/web/src/domain/dead-controls-display-contract.ts',
  'docs/OPERATIONS/ENGINE_GAP_E5_GAP_SURFACES.md',
] as const;

export const EW_E5_GAP_SURFACES_WIRE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e5-gap-surfaces-display-contract.test.ts',
  'apps/web/src/domain/__tests__/referral-leaderboard-display-contract.test.ts',
  'apps/web/src/domain/__tests__/sports-rules-and-vip-display-contract.test.ts',
  'apps/web/src/domain/__tests__/dead-controls-display-contract.test.ts',
  'apps/web/src/features/earn/__tests__/use-referral-leaderboard-controller.test.ts',
  'apps/web/src/product/surfaces/referral/__tests__/referral-leaderboard-page.test.tsx',
  'apps/web/src/product/surfaces/sports/__tests__/sports-page.test.tsx',
] as const;

export function isTierMeDecayWireLive(): boolean {
  return isTierMeDecayFullUnlocked() && LAUNCH_GATES.tierDecayEngine === true;
}

export function isReferralLeaderboardWireLive(): boolean {
  return (
    isReferralLeaderboardLiveUnlocked() &&
    isReferralLeaderboardRankListLive() &&
    !shouldDeferReferralLeaderboard() &&
    REFERRAL_LEADERBOARD_UI_UNLOCK_TODO === EW_E5_GAP_SURFACES_WIRE_TODO
  );
}

export function isSportsVipMarketsWireLive(): boolean {
  return (
    isSportsVipSurfaceUnlocked() &&
    canBrowseSportsVipMarkets() &&
    resolveSportsVipPageExposure() === 'live' &&
    SPORTS_VIP_LIVE_UNLOCK_TODO === EW_E5_GAP_SURFACES_WIRE_TODO
  );
}

export function isEwE5GapSurfacesFullyWired(): boolean {
  return (
    isTierMeDecayWireLive() &&
    isReferralLeaderboardWireLive() &&
    isSportsVipMarketsWireLive()
  );
}

export function assertEwE5GapSurfacesWireSync(): void {
  if (EW_E5_GAP_SURFACES_WIRE_TODO !== 'ew-e5-gap-surfaces-wire') {
    throw new Error('E5 WIRE todo id drift');
  }
  if (EW_E5_GAP_SURFACES_WIRE_PREREQUISITE_TODO !== 'ew-e4-gate-tier-option-b') {
    throw new Error('E5 WIRE prerequisite must be ew-e4-gate-tier-option-b');
  }
  if (EW_E5_GAP_SURFACES_WIRE_NEXT_TODO !== 'ew-e5-gate-gap-surfaces') {
    throw new Error('E5 WIRE next must be ew-e5-gate-gap-surfaces');
  }
  if (EW_E5_GAP_SURFACES_WIRE_ROUTES.length !== 3) {
    throw new Error('E5 WIRE must cover 3 routes');
  }
  if (!isEwE5GapSurfacesFullyWired()) {
    throw new Error(
      'E5 WIRE incomplete — /tier/me decay · /referral/leaderboard · /sports/vip',
    );
  }
}
