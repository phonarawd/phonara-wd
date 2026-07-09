import { describe, expect, it } from 'vitest';

import type { MissionItem } from '@phonara/shared-types';

import {
  filterCuratedInviteMissionItems,
  HOME_MISSIONS_INVITE_ENGINE_ONE_SHOT,
  HOME_MISSIONS_INVITE_ROUTE,
  HOME_MISSIONS_INVITE_UI_IDS,
  isHomeMissionsInviteUiId,
  resolveHomeMissionsInviteBackRoute,
} from '../home-missions-invite-display-contract';

const sampleMission = (id: string, overrides: Partial<MissionItem> = {}): MissionItem => ({
  id,
  titleKey: 'mission.viral.shareLink',
  rewardLabel: '+300P',
  progressLabel: '0 / 1',
  status: 'todo',
  lane: 'viral',
  ...overrides,
});

describe('home-missions-invite-display-contract', () => {
  it('locks canonical route and curated invite ui ids', () => {
    expect(HOME_MISSIONS_INVITE_ROUTE).toBe('/home/missions/invite');
    expect(HOME_MISSIONS_INVITE_UI_IDS).toEqual([
      'viral-shareLink',
      'viral-invite3',
      'viral-inviteWeekly',
    ]);
    expect(HOME_MISSIONS_INVITE_ENGINE_ONE_SHOT).toBe('invite_3_friends');
  });

  it('recognizes invite ui ids and excludes defer_stub rows', () => {
    expect(isHomeMissionsInviteUiId('viral-shareLink')).toBe(true);
    expect(isHomeMissionsInviteUiId('viral-invite1')).toBe(false);
    expect(isHomeMissionsInviteUiId('viral-partnerHubVisit')).toBe(false);
  });

  it('filters curated invite missions only', () => {
    const missions = [
      sampleMission('viral-shareLink'),
      sampleMission('viral-invite3'),
      sampleMission('viral-partnerHubVisit'),
      sampleMission('viral-invite1', { soon: true }),
      sampleMission('daily-quiz', { lane: 'daily' }),
    ];

    expect(filterCuratedInviteMissionItems(missions).map((item) => item.id)).toEqual([
      'viral-shareLink',
      'viral-invite3',
    ]);
  });

  it('links back to viral missions hub tab', () => {
    expect(resolveHomeMissionsInviteBackRoute()).toBe('/home/missions?tab=viral');
  });
});
