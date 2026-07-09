import { describe, expect, it } from 'vitest';

import type { MissionItem } from '@phonara/shared-types';

import {
  filterCuratedReferralMissionItems,
  HOME_MISSIONS_REFERRAL_ENGINE_ONE_SHOT,
  HOME_MISSIONS_REFERRAL_ROUTE,
  HOME_MISSIONS_REFERRAL_UI_IDS,
  isHomeMissionsReferralUiId,
  resolveHomeMissionsReferralBackRoute,
} from '../home-missions-referral-display-contract';

const sampleMission = (id: string, overrides: Partial<MissionItem> = {}): MissionItem => ({
  id,
  titleKey: 'mission.viral.partnerHubVisit',
  rewardLabel: '+200P',
  progressLabel: '0 / 1',
  status: 'todo',
  lane: 'viral',
  ...overrides,
});

describe('home-missions-referral-display-contract', () => {
  it('locks canonical route and curated referral ui ids', () => {
    expect(HOME_MISSIONS_REFERRAL_ROUTE).toBe('/home/missions/referral');
    expect(HOME_MISSIONS_REFERRAL_UI_IDS).toEqual([
      'viral-partnerHubVisit',
      'tier-reachSilver',
      'tier-reachGold',
    ]);
    expect(HOME_MISSIONS_REFERRAL_ENGINE_ONE_SHOT).toBe('invite_3_friends');
  });

  it('recognizes referral ui ids and excludes invite-only rows', () => {
    expect(isHomeMissionsReferralUiId('viral-partnerHubVisit')).toBe(true);
    expect(isHomeMissionsReferralUiId('tier-reachSilver')).toBe(true);
    expect(isHomeMissionsReferralUiId('viral-shareLink')).toBe(false);
    expect(isHomeMissionsReferralUiId('viral-invite3')).toBe(false);
  });

  it('filters curated referral missions only', () => {
    const missions = [
      sampleMission('viral-partnerHubVisit'),
      sampleMission('tier-reachSilver', { lane: 'tier' }),
      sampleMission('viral-shareLink'),
      sampleMission('viral-invite1', { soon: true }),
      sampleMission('daily-quiz', { lane: 'daily' }),
    ];

    expect(filterCuratedReferralMissionItems(missions).map((item) => item.id)).toEqual([
      'viral-partnerHubVisit',
      'tier-reachSilver',
    ]);
  });

  it('links back to viral missions hub tab', () => {
    expect(resolveHomeMissionsReferralBackRoute()).toBe('/home/missions?tab=viral');
  });
});
