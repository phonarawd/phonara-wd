import { describe, expect, it } from 'vitest';

import {
  E12_CARD_LANES,
  E12_MISSION_MATRIX,
  REPEATABLE_UI_TO_RPC,
  VIRAL_CLAIM_RATE_LIMIT,
  VIRAL_MISSIONS_PRIMARY_ROUTE,
  VIRAL_MISSIONS_UI_WIRE_STATUS,
  VIRAL_UI_TO_RPC,
  formatPhonRewardDisplay,
  mapCardStateToMissionStatus,
  mapMissionStatusToCardState,
  mergeE12MissionItems,
  resolveMissionClaimBlocked,
  resolveMissionExposure,
  resolveRepeatableMissionCardState,
  resolveViralMissionCardState,
  shouldDeferMissionRow,
  usesE12MissionCard,
  usesE12MissionCardForItem,
} from '../viral-missions-display-contract';

import { EARN_STATIC_MISSIONS } from '../../data/earn-static-missions';

describe('viral-missions-display-contract', () => {
  it('locks viral/repeatable sections to /home/missions', () => {
    expect(VIRAL_MISSIONS_PRIMARY_ROUTE).toBe('/home/missions');

    expect(VIRAL_MISSIONS_UI_WIRE_STATUS.checklist).toBe('wired');

    expect(VIRAL_MISSIONS_UI_WIRE_STATUS.e12Cards).toBe('wired');
  });

  it('documents mission type matrix with live viral + repeatable RPC rows', () => {
    expect(E12_MISSION_MATRIX.length).toBeGreaterThanOrEqual(19);

    expect(VIRAL_UI_TO_RPC['viral-shareLink']).toBe('share_referral_link');

    expect(REPEATABLE_UI_TO_RPC['daily-quiz']).toBe('daily_quiz');

    expect(resolveMissionExposure('viral-shareLink')).toBe('live');

    expect(resolveMissionExposure('viral-invite1')).toBe('defer_stub');

    expect(shouldDeferMissionRow('viral-invite1')).toBe(true);
  });

  it('maps 3-state card display to MissionStatus', () => {
    expect(mapCardStateToMissionStatus('in_progress')).toBe('todo');

    expect(mapCardStateToMissionStatus('reward_pending')).toBe('claimable');

    expect(mapCardStateToMissionStatus('completed')).toBe('done');

    expect(mapMissionStatusToCardState('claimable')).toBe('reward_pending');
  });

  it('resolves viral card states with streak abuse gate', () => {
    expect(
      resolveViralMissionCardState({
        mission: 'share_referral_link',
        used: 0,
        max: 3,
        remaining: 3,
        reward_phon: '25',
      }),
    ).toBe('reward_pending');

    expect(
      resolveViralMissionCardState({
        mission: 'share_referral_link',
        used: 3,
        max: 3,
        remaining: 0,
        reward_phon: '25',
      }),
    ).toBe('completed');

    expect(
      resolveViralMissionCardState(
        { mission: 'viral_streak_share', used: 0, max: 1, remaining: 1, reward_phon: '75' },

        { streakDays: 3, streakTargetDays: 7 },
      ),
    ).toBe('in_progress');

    expect(
      resolveViralMissionCardState(
        { mission: 'viral_streak_share', used: 0, max: 1, remaining: 1, reward_phon: '75' },

        { streakDays: 7, streakTargetDays: 7 },
      ),
    ).toBe('reward_pending');
  });

  it('resolves repeatable card states from engine row', () => {
    expect(
      resolveRepeatableMissionCardState({
        mission: 'daily_quiz',

        progress: 0,

        target: 1,

        claimed: false,

        claimable: false,

        reward_phon: '200',
      }),
    ).toBe('in_progress');

    expect(
      resolveRepeatableMissionCardState({
        mission: 'daily_quiz',

        progress: 1,

        target: 1,

        claimed: false,

        claimable: true,

        reward_phon: '200',
      }),
    ).toBe('reward_pending');

    expect(
      resolveRepeatableMissionCardState({
        mission: 'daily_quiz',

        progress: 1,

        target: 1,

        claimed: true,

        claimable: false,

        reward_phon: '200',
      }),
    ).toBe('completed');
  });

  it('blocks claim for guest and defer_stub; tier keep claim live after E1', () => {
    expect(resolveMissionClaimBlocked({ authenticated: false, uiId: 'viral-shareLink' })).toBe(
      true,
    );

    expect(resolveMissionClaimBlocked({ authenticated: true, uiId: 'viral-invite1' })).toBe(true);

    expect(resolveMissionClaimBlocked({ authenticated: true, uiId: 'tier-keepStatus' })).toBe(
      false,
    );

    expect(resolveMissionClaimBlocked({ authenticated: true, uiId: 'viral-shareLink' })).toBe(
      false,
    );
  });

  it('merges engine viral/repeatable rows into static checklist items', () => {
    const merged = mergeE12MissionItems({
      staticItems: EARN_STATIC_MISSIONS,

      engineMissions: [],

      viralRows: [
        {
          mission: 'share_referral_link',

          used: 1,

          max: 3,

          remaining: 2,

          reward_phon: '25.000000',
        },
      ],

      repeatableRows: [
        {
          mission: 'daily_quiz',

          progress: 1,

          target: 1,

          claimed: false,

          claimable: true,

          reward_phon: '200.000000',
        },
      ],

      streakDays: 7,

      streakTargetDays: 7,
    });

    const share = merged.find((m) => m.id === 'viral-shareLink');

    expect(share?.status).toBe('claimable');

    expect(share?.soon).toBe(false);

    expect(share?.rewardLabel).toBe('+25P');

    const quiz = merged.find((m) => m.id === 'daily-quiz');

    expect(quiz?.status).toBe('claimable');

    expect(quiz?.progressLabel).toBe('1 / 1');

    const invite1 = merged.find((m) => m.id === 'viral-invite1');

    expect(invite1?.soon).toBe(true);
  });

  it('uses E12 cards on viral/weekly/tier/social lanes and daily repeatable rows', () => {
    expect(E12_CARD_LANES).toEqual(['viral', 'weekly', 'tier', 'social']);

    expect(usesE12MissionCard('viral')).toBe(true);

    expect(usesE12MissionCard('daily')).toBe(false);

    expect(usesE12MissionCardForItem('daily-quiz', 'daily')).toBe(true);

    expect(usesE12MissionCardForItem('growth-firstGame', 'growth')).toBe(false);
  });

  it('formats PHON reward display without client-side payout math', () => {
    expect(formatPhonRewardDisplay('25.000000')).toBe('+25P');

    expect(formatPhonRewardDisplay('0')).toBe('—');

    expect(VIRAL_CLAIM_RATE_LIMIT.capacity).toBe(10);
  });
});
