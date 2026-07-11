/**
 * E5 gap surfaces GATE pin (YAML #249).
 * Authority: Plan `ew-e5-gate-gap-surfaces` · §22.5.1 STUB→live closeout.
 *
 * GATE does not re-wire surfaces — asserts E5 WIRE green · dead-controls live ·
 * `/tier/me` decay · `/referral/leaderboard` · `/sports/vip` unlocked → E6.
 * No new migrations (engine E1/E3/E4 already remote).
 */

import { PQA_DEAD_CONTROL_DEFER_REGISTRY } from './dead-controls-display-contract';
import {
  assertEwE5GapSurfacesWireSync,
  EW_E5_GAP_SURFACES_WIRE_ARTIFACT_PATHS,
  EW_E5_GAP_SURFACES_WIRE_NEXT_TODO,
  EW_E5_GAP_SURFACES_WIRE_ROUTES,
  EW_E5_GAP_SURFACES_WIRE_TODO,
  isEwE5GapSurfacesFullyWired,
  isReferralLeaderboardWireLive,
  isSportsVipMarketsWireLive,
  isTierMeDecayWireLive,
} from './ew-e5-gap-surfaces-display-contract';
import { REFERRAL_LEADERBOARD_ROUTE } from './referral-leaderboard-display-contract';
import { SPORTS_VIP_STUB_ROUTE } from './sports-rules-and-vip-display-contract';
import { TIER_ME_ROUTE } from './tier-me-display-contract';

export const EW_E5_GATE_GAP_SURFACES_TODO = 'ew-e5-gate-gap-surfaces' as const;
export const EW_E5_GATE_GAP_SURFACES_PREREQUISITE_TODO = EW_E5_GAP_SURFACES_WIRE_TODO;
export const EW_E5_GATE_GAP_SURFACES_NEXT_TODO = 'ew-e6-admin-desks-wave' as const;

export const EW_E5_GATE_GAP_SURFACES_UNLOCK_ROUTES = [
  TIER_ME_ROUTE,
  REFERRAL_LEADERBOARD_ROUTE,
  SPORTS_VIP_STUB_ROUTE,
] as const;

export const EW_E5_GATE_GAP_SURFACES_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e5-gate-gap-surfaces-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e5-gate-gap-surfaces-display-contract.test.ts',
  'apps/web/src/domain/ew-e5-gap-surfaces-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e5-gap-surfaces-display-contract.test.ts',
  'apps/web/src/domain/dead-controls-display-contract.ts',
  'docs/OPERATIONS/ENGINE_GAP_E5_GAP_SURFACES.md',
  'docs/OPERATIONS/ENGINE_GAP_E5_GATE_GAP_SURFACES.md',
] as const;

export const EW_E5_GATE_GAP_SURFACES_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e5-gate-gap-surfaces-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e5-gap-surfaces-display-contract.test.ts',
  'apps/web/src/domain/__tests__/referral-leaderboard-display-contract.test.ts',
  'apps/web/src/domain/__tests__/sports-rules-and-vip-display-contract.test.ts',
  'apps/web/src/domain/__tests__/dead-controls-display-contract.test.ts',
] as const;

const LIVE_DEAD_CONTROL_IDS = [
  'referral-leaderboard-stub',
  'sports-vip-coming-soon',
] as const;

export function areGapSurfaceDeadControlsLive(): boolean {
  return LIVE_DEAD_CONTROL_IDS.every((id) => {
    const row = PQA_DEAD_CONTROL_DEFER_REGISTRY.find((entry) => entry.id === id);
    return row?.mitigatedBy === 'live';
  });
}

export function isTierMeDecayFullyUnlocked(): boolean {
  return isTierMeDecayWireLive() && TIER_ME_ROUTE === '/tier/me';
}

export function isReferralLeaderboardFullyUnlocked(): boolean {
  return (
    isReferralLeaderboardWireLive() && REFERRAL_LEADERBOARD_ROUTE === '/referral/leaderboard'
  );
}

export function isSportsVipFullyUnlocked(): boolean {
  return isSportsVipMarketsWireLive() && SPORTS_VIP_STUB_ROUTE === '/sports/vip';
}

export function isEwE5GapSurfacesFullyUnlocked(): boolean {
  return (
    isEwE5GapSurfacesFullyWired() &&
    areGapSurfaceDeadControlsLive() &&
    isTierMeDecayFullyUnlocked() &&
    isReferralLeaderboardFullyUnlocked() &&
    isSportsVipFullyUnlocked()
  );
}

export function assertEwE5GateGapSurfacesSync(): void {
  assertEwE5GapSurfacesWireSync();

  if (EW_E5_GATE_GAP_SURFACES_TODO !== 'ew-e5-gate-gap-surfaces') {
    throw new Error('E5 GATE todo id drift');
  }
  if (EW_E5_GATE_GAP_SURFACES_PREREQUISITE_TODO !== 'ew-e5-gap-surfaces-wire') {
    throw new Error('E5 GATE prerequisite must be ew-e5-gap-surfaces-wire');
  }
  if (EW_E5_GATE_GAP_SURFACES_NEXT_TODO !== 'ew-e6-admin-desks-wave') {
    throw new Error('E5 GATE next must be ew-e6-admin-desks-wave');
  }
  if (EW_E5_GAP_SURFACES_WIRE_NEXT_TODO !== 'ew-e5-gate-gap-surfaces') {
    throw new Error('E5 WIRE next must unlock ew-e5-gate-gap-surfaces');
  }
  if (EW_E5_GATE_GAP_SURFACES_UNLOCK_ROUTES.length !== 3) {
    throw new Error('E5 GATE must unlock 3 routes');
  }
  if (EW_E5_GAP_SURFACES_WIRE_ROUTES.length !== 3) {
    throw new Error('E5 WIRE routes missing');
  }
  if (EW_E5_GAP_SURFACES_WIRE_ARTIFACT_PATHS.length < 5) {
    throw new Error('E5 WIRE artifacts missing');
  }
  if (!isEwE5GapSurfacesFullyUnlocked()) {
    throw new Error(
      'E5 GATE unlock not live — /tier/me decay · /referral/leaderboard · /sports/vip',
    );
  }
}
