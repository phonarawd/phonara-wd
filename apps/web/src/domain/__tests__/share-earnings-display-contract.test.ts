import { describe, expect, it } from 'vitest';

import { messages, type MessageKey } from '@phonara/i18n';

import {
  buildShareEarningsSharePayload,
  parseShareEarningsTodaySnapshot,
  resolveReferralShareMissionFromRows,
  resolveShareEarningsCardView,
  resolveShareEarningsStreakMissionSnapshot,
  SHARE_EARNINGS_ROUTE,
  SHARE_EARNINGS_STREAK_MISSION_RPC,
} from '../share-earnings-display-contract';

describe('share-earnings-display-contract', () => {
  it('locks canonical route', () => {
    expect(SHARE_EARNINGS_ROUTE).toBe('/share/earnings');
  });

  it('parses golden earth today earnings snapshot', () => {
    expect(
      parseShareEarningsTodaySnapshot({
        earned_phon_today: '125.500000',
        login_streak: 7,
      }),
    ).toEqual({
      earnedPhonToday: '125.500000',
      loginStreak: 7,
    });
  });

  it('builds card view from hub + golden earth RPC payloads', () => {
    const view = resolveShareEarningsCardView(
      { tier: 'silver', xp: 12000, next_tier_xp: 25000 },
      { earned_phon_today: '50.000000', login_streak: 3 },
    );

    expect(view).toMatchObject({
      tier: { tier: 'silver', xp: 12000, nextTierXp: 25000 },
      today: { earnedPhonToday: '50.000000', loginStreak: 3 },
      earningsLabel: '+50P',
      tierLabelKey: 'earn.tier.silver',
    });
  });

  it('resolves share and streak mission snapshots from viral rows', () => {
    const missions = [
      { mission: 'share_referral_link', used: 1, max: 3, remaining: 2, reward_phon: '25.000000' },
      { mission: 'viral_streak_share', used: 0, max: 1, remaining: 1, reward_phon: '75.000000' },
    ];

    expect(resolveReferralShareMissionFromRows(missions)).toMatchObject({
      rewardPhon: '25.000000',
      canClaim: true,
    });

    expect(resolveShareEarningsStreakMissionSnapshot(missions, 7, 7)).toMatchObject({
      rewardPhon: '75.000000',
      canClaim: true,
      streakDays: 7,
    });

    expect(resolveShareEarningsStreakMissionSnapshot(missions, 3, 7)).toMatchObject({
      canClaim: false,
    });
  });

  it('builds web share payload with invite url', () => {
    expect(
      buildShareEarningsSharePayload({
        shareTitle: 'title',
        shareText: 'text',
        inviteUrl: 'https://phonara.net/r/code',
      }),
    ).toEqual({
      title: 'title',
      text: 'text',
      url: 'https://phonara.net/r/code',
    });
  });

  it('registers i18n keys in ko and en catalogs', () => {
    const keys = [
      'seo.share.earnings.title',
      'seo.share.earnings.description',
      'share.earnings.pageTitle',
      'share.earnings.card.headline',
      'share.earnings.shareCta',
    ] satisfies MessageKey[];

    for (const key of keys) {
      expect(messages.ko[key]).toBeTruthy();
      expect(messages.en[key]).toBeTruthy();
    }

    expect(SHARE_EARNINGS_STREAK_MISSION_RPC).toBe('viral_streak_share');
  });
});
