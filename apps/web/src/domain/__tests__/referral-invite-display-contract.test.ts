import { describe, expect, it } from 'vitest';

import {
  REFERRAL_INVITE_ROUTE,
  REFERRAL_WEB_SHARE_MISSION_RPC,
  buildReferralSharePayload,
  canUseWebShare,
  isReferralShareAbortError,
  resolveReferralShareMissionSnapshot,
} from '../referral-invite-display-contract';

describe('referral-invite-display-contract', () => {
  it('locks invite route and share mission rpc', () => {
    expect(REFERRAL_INVITE_ROUTE).toBe('/referral/invite');
    expect(REFERRAL_WEB_SHARE_MISSION_RPC).toBe('share_referral_link');
  });

  it('builds web share payload from i18n strings', () => {
    expect(
      buildReferralSharePayload({
        shareTitle: 'PHONARA invite',
        shareText: 'Join with code abc',
        inviteUrl: 'https://phonara.net/r/abc',
      }),
    ).toEqual({
      title: 'PHONARA invite',
      text: 'Join with code abc',
      url: 'https://phonara.net/r/abc',
    });
  });

  it('resolves share mission snapshot from viral rows', () => {
    expect(
      resolveReferralShareMissionSnapshot([
        {
          mission: 'share_referral_link',
          used: 1,
          max: 3,
          remaining: 2,
          reward_phon: '25.000000',
        },
      ]),
    ).toEqual({
      rewardPhon: '25.000000',
      used: 1,
      max: 3,
      remaining: 2,
      canClaim: true,
    });
  });

  it('detects share abort without treating as failure', () => {
    expect(isReferralShareAbortError(new DOMException('cancel', 'AbortError'))).toBe(true);
    expect(isReferralShareAbortError(new Error('fail'))).toBe(false);
  });

  it('reports web share availability from navigator', () => {
    expect(typeof canUseWebShare()).toBe('boolean');
  });
});
