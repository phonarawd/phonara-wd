import { describe, expect, it } from 'vitest';

import type { FileRoutesByFullPath } from '../../routeTree.gen';
import { EARN_STATIC_MISSIONS } from '../../data/earn-static-missions';
import { EARN_SUBNAV } from '../../product/shell/earn-subnav';
import {
  filterRegisteredSubnavItems,
  P7_GROWTH_REGISTERED_ROUTES,
  SHELL_SUBNAV_REGISTERED_ROUTES,
} from '../../product/shell/subnav-route-manifest';
import {
  filterHomeMissionsForTab,
  isOnboardingOnlyClaimUiId,
  ONBOARDING_ONLY_CLAIM_UI_IDS,
  shouldRenderHomeMissionRow,
} from '../home-missions-display-contract';
import { ONBOARDING_D0_MISSION_UI_ID } from '../onboarding-journey-display-contract';
import {
  formatPhonRewardDisplay,
  mergeE12MissionItems,
  REPEATABLE_UI_TO_RPC,
  shouldDeferMissionRow,
  VIRAL_UI_TO_RPC,
} from '../viral-missions-display-contract';

/** TanStack Router full paths — compile-time route existence check. */
type RegisteredFullPath = keyof FileRoutesByFullPath;

/** Compile-time + runtime: every P7 path must be a TanStack `fullPath`. */
function assertRegisteredFullPath(path: RegisteredFullPath): RegisteredFullPath {
  return path;
}

describe('p7-gate-growth §12.19.6 · §13.5.5 · §3.4.3', () => {
  it('registers all P7 growth routes in subnav manifest', () => {
    for (const route of P7_GROWTH_REGISTERED_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    expect(P7_GROWTH_REGISTERED_ROUTES).toHaveLength(9);
  });

  it('maps every P7 manifest route to a TanStack fullPath (dead link 0)', () => {
    for (const route of P7_GROWTH_REGISTERED_ROUTES) {
      expect(assertRegisteredFullPath(route as RegisteredFullPath)).toBe(route);
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
  });

  it('filters earnSubnav to registered routes only (no 404 chips)', () => {
    const visible = filterRegisteredSubnavItems(EARN_SUBNAV);
    for (const item of visible) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(item.to)).toBe(true);
    }
    expect(visible.map((item) => item.to)).toEqual([
      '/home',
      '/home/missions',
      '/home/attendance',
      '/referral',
      '/tier/me',
      '/tier/benefits',
      '/earn/cashback',
      '/earn/play',
      '/share/earnings',
      '/staking',
    ]);
    expect(visible.some((item) => item.to === '/earn/cashback')).toBe(true);
    expect(visible.some((item) => item.to === '/staking')).toBe(true);
  });

  it('isolates onboarding D0 welcome claim from hub (duplicate claim 0)', () => {
    expect(ONBOARDING_D0_MISSION_UI_ID).toBe('onboarding-welcome');
    expect(ONBOARDING_ONLY_CLAIM_UI_IDS).toContain('welcome-bonus');
    expect(ONBOARDING_ONLY_CLAIM_UI_IDS).toContain('onboarding-welcome');
    expect(isOnboardingOnlyClaimUiId('welcome-bonus')).toBe(true);
    expect(isOnboardingOnlyClaimUiId('onboarding-welcome')).toBe(true);
    expect(shouldRenderHomeMissionRow('welcome-bonus')).toBe(false);
    expect(shouldRenderHomeMissionRow('onboarding-welcome')).toBe(false);

    const hubMissions = filterHomeMissionsForTab(EARN_STATIC_MISSIONS, 'viral');
    expect(hubMissions.some((m) => m.id === 'welcome-bonus')).toBe(false);
    expect(hubMissions.some((m) => m.id === 'onboarding-welcome')).toBe(false);
  });

  it('merges live mission rewards from RPC reward_phon only (§13.5.5 display=지급)', () => {
    const viralRows = Object.entries(VIRAL_UI_TO_RPC).map(([uiId, rpc]) => ({
      mission: rpc,
      used: 0,
      max: 3,
      remaining: 3,
      reward_phon: `${uiId.length * 10}.000000`,
    }));

    const repeatableRows = Object.entries(REPEATABLE_UI_TO_RPC).map(([uiId, rpc]) => ({
      mission: rpc,
      progress: 0,
      target: 1,
      claimed: false,
      claimable: true,
      reward_phon: `${uiId.length * 20}.000000`,
    }));

    const merged = mergeE12MissionItems({
      staticItems: EARN_STATIC_MISSIONS,
      engineMissions: [],
      viralRows,
      repeatableRows,
    });

    for (const [uiId, rpc] of Object.entries(VIRAL_UI_TO_RPC)) {
      const row = viralRows.find((r) => r.mission === rpc)!;
      const item = merged.find((m) => m.id === uiId);
      expect(item?.rewardLabel).toBe(formatPhonRewardDisplay(row.reward_phon));
    }

    for (const [uiId, rpc] of Object.entries(REPEATABLE_UI_TO_RPC)) {
      const row = repeatableRows.find((r) => r.mission === rpc)!;
      const item = merged.find((m) => m.id === uiId);
      expect(item?.rewardLabel).toBe(formatPhonRewardDisplay(row.reward_phon));
    }
  });

  it('excludes ad-watch and survey missions from earn static catalog', () => {
    const ids = EARN_STATIC_MISSIONS.map((m) => m.id);
    expect(ids.some((id) => id.includes('ad-watch') || id.includes('survey'))).toBe(false);
    expect(EARN_STATIC_MISSIONS.some((m) => shouldDeferMissionRow(m.id) && !m.soon)).toBe(true);
  });
});
