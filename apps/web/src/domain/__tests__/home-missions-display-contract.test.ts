import { describe, expect, it } from 'vitest';

import {
  filterHomeMissionsForTab,
  HOME_MISSIONS_DEFAULT_TAB,
  HOME_MISSIONS_HUB_TABS,
  HOME_MISSIONS_ROUTE,
  isOnboardingOnlyClaimUiId,
  parseHomeMissionsHubSearch,
  resolveHomeMissionCtaRoute,
  resolveHomeMissionsTabForMissionId,
  shouldRenderHomeMissionRow,
} from '../home-missions-display-contract';
import { EARN_STATIC_MISSIONS } from '../../data/earn-static-missions';

describe('home-missions-display-contract', () => {
  it('locks hub to /home/missions with viral default tab', () => {
    expect(HOME_MISSIONS_ROUTE).toBe('/home/missions');
    expect(HOME_MISSIONS_DEFAULT_TAB).toBe('viral');
    expect(HOME_MISSIONS_HUB_TABS[0]).toBe('viral');
  });

  it('parses hub search with tab and missionId', () => {
    expect(parseHomeMissionsHubSearch({})).toEqual({ tab: 'viral' });
    expect(parseHomeMissionsHubSearch({ tab: 'weekly', missionId: 'weekly-play5' })).toEqual({
      tab: 'weekly',
      missionId: 'weekly-play5',
    });
    expect(parseHomeMissionsHubSearch({ tab: 'invalid' })).toEqual({ tab: 'viral' });
  });

  it('blocks onboarding-only welcome claim on hub', () => {
    expect(isOnboardingOnlyClaimUiId('welcome-bonus')).toBe(true);
    expect(isOnboardingOnlyClaimUiId('onboarding-welcome')).toBe(true);
    expect(isOnboardingOnlyClaimUiId('viral-shareLink')).toBe(false);
  });

  it('defers stub missions from hub rows', () => {
    expect(shouldRenderHomeMissionRow('viral-invite1')).toBe(false);
    expect(shouldRenderHomeMissionRow('viral-shareLink')).toBe(true);
  });

  it('filters missions by hub tab lane', () => {
    const viral = filterHomeMissionsForTab(EARN_STATIC_MISSIONS, 'viral');
    expect(viral.every((item) => item.lane === 'viral')).toBe(true);
    expect(viral.some((item) => item.id === 'viral-shareLink')).toBe(true);

    const special = filterHomeMissionsForTab(EARN_STATIC_MISSIONS, 'special');
    expect(special).toHaveLength(0);
  });

  it('resolves mission detail tab and CTA routes', () => {
    expect(resolveHomeMissionsTabForMissionId('weekly-play5')).toBe('weekly');
    expect(resolveHomeMissionCtaRoute('viral-shareLink')).toBe('/referral/invite');
    expect(resolveHomeMissionCtaRoute('growth-firstDeposit')).toBe('/wallet/deposit');
  });
});
