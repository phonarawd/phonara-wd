import { describe, expect, it } from 'vitest';

import {
  REFERRAL_HUB_VIRAL_MISSION_UI_IDS,
  REFERRAL_INVITE_ROUTE,
  buildReferralInvitePath,
  buildReferralInviteUrl,
  maskReferredUserLabel,
  parseEarnHubReferralSnapshot,
  resolveReferralShareCode,
  resolveReferralTreeStateLabelKey,
  sumPaidReferralRewards,
} from '../referral-hub-display-contract';

describe('referral-hub-display-contract', () => {
  it('locks invite route and viral mission curation', () => {
    expect(REFERRAL_INVITE_ROUTE).toBe('/referral/invite');
    expect(REFERRAL_HUB_VIRAL_MISSION_UI_IDS).toEqual([
      'viral-shareLink',
      'viral-invite3',
      'viral-inviteWeekly',
    ]);
  });

  it('resolves share code from username or uuid prefix', () => {
    expect(resolveReferralShareCode('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'phon_user')).toBe(
      'phon_user',
    );
    expect(resolveReferralShareCode('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', null)).toBe('aaaaaaaa');
  });

  it('builds invite path and absolute url', () => {
    expect(buildReferralInvitePath('phon_user')).toBe('/r/phon_user');
    expect(buildReferralInviteUrl('https://phonara.net', 'abc123')).toBe(
      'https://phonara.net/r/abc123',
    );
  });

  it('masks referred user labels without exposing full uuid', () => {
    expect(maskReferredUserLabel('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe('···eeee');
  });

  it('maps referral tree states to i18n keys', () => {
    expect(resolveReferralTreeStateLabelKey('paid')).toBe('referral.paid');
    expect(resolveReferralTreeStateLabelKey('qualified')).toBe('referral.approved');
    expect(resolveReferralTreeStateLabelKey('pending')).toBe('referral.pending');
  });

  it('sums paid referral rewards with Decimal only', () => {
    expect(
      sumPaidReferralRewards([
        { state: 'paid', referrerPhon: '1000.000000' },
        { state: 'pending', referrerPhon: '500.000000' },
        { state: 'paid', referrerPhon: '250.500000' },
      ]),
    ).toBe('1250.500000');
  });

  it('parses earn hub referral snapshot from rpc payload', () => {
    expect(
      parseEarnHubReferralSnapshot({
        referral: {
          total_invited: 5,
          qualified_total: 2,
          pending_review: 1,
          per_friend_bonus_multiplier: '1.25',
          payout_today: { used: 1, max: 3, remaining: 2 },
        },
      }),
    ).toEqual({
      totalInvited: 5,
      qualifiedTotal: 2,
      pendingReview: 1,
      payoutTodayUsed: 1,
      payoutTodayMax: 3,
      payoutTodayRemaining: 2,
      perFriendBonusMultiplier: '1.25',
    });
  });
});
