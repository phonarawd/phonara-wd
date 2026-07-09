import { describe, expect, it } from 'vitest';

import {
  buildLandingSignupHref,
  LANDING_DIFFERENTIATOR_IDS,
  LANDING_FAQ_ALL_IDS,
  LANDING_FAQ_BONUS_IDS,
  LANDING_FAQ_IDS,
  LANDING_MISSION_PREVIEW_COMPACT_IDS,
  LANDING_MISSION_PREVIEW_FEATURED_ID,
  LANDING_MISSION_TEASERS,
  LANDING_TESTIMONIAL_POOL,
  LANDING_WALLET_PREVIEW_PHON,
  LANDING_WHY_FLOW_STEP_IDS,
  findLandingMissionTeaser,
  parseLandingRewardPhon,
  preserveLandingAttributionSearch,
  sumLandingAvailableRewardsPhon,
} from '@/domain/landing-display-contract';

import { resolveLandingProof } from '@/domain/landing-proof-resolver';

describe('landing-display-contract', () => {
  it('defines CVR fold why flow and differentiator order', () => {
    expect(LANDING_WHY_FLOW_STEP_IDS).toEqual(['signup', 'mission', 'earn', 'withdraw']);

    expect(LANDING_DIFFERENTIATOR_IDS).toEqual([
      'attendance',

      'quiz',

      'referral',

      'variedMissions',

      'withdrawAnytime',
    ]);
  });

  it('defines FAQ 8 core + 3 bonus in anxiety-order', () => {
    expect(LANDING_FAQ_IDS).toEqual([
      'canGetPaid',

      'timeNeeded',

      'withdrawWhen',

      'howEarn',

      'signupFee',

      'privacy',

      'whoCanUse',

      'startNow',
    ]);

    expect(LANDING_FAQ_BONUS_IDS).toEqual(['whereWallet', 'missionsOptional', 'afterWithdraw']);

    expect(LANDING_FAQ_ALL_IDS).toHaveLength(11);

    expect(LANDING_FAQ_ALL_IDS[0]).toBe('canGetPaid');

    expect(LANDING_FAQ_ALL_IDS.at(-1)).toBe('afterWithdraw');
  });

  it('defines presentation wallet preview constant', () => {
    expect(LANDING_WALLET_PREVIEW_PHON).toBe(2900);

    expect(sumLandingAvailableRewardsPhon()).toBe(LANDING_WALLET_PREVIEW_PHON);
  });

  it('exposes operator-approved testimonial pool for L5', () => {
    expect(LANDING_TESTIMONIAL_POOL.length).toBeGreaterThanOrEqual(3);
  });

  it('resolves hero-adjacent mission preview featured + compact ids', () => {
    expect(LANDING_MISSION_PREVIEW_FEATURED_ID).toBe('daily-quiz');

    expect(LANDING_MISSION_PREVIEW_COMPACT_IDS).toEqual([
      'daily-todaySpin',
      'growth-completeProfile',
    ]);

    expect(findLandingMissionTeaser(LANDING_MISSION_PREVIEW_FEATURED_ID).rewardLabel).toBe('+200P');
  });

  it('sums catalog rewards for L2 proof (never zero on cold start)', () => {
    expect(LANDING_MISSION_TEASERS.length).toBeGreaterThanOrEqual(3);

    expect(sumLandingAvailableRewardsPhon()).toBeGreaterThan(0);
  });

  it('parses mission reward labels from catalog display strings', () => {
    expect(parseLandingRewardPhon('+200P')).toBe(200);

    expect(parseLandingRewardPhon('+2,000P')).toBe(2000);
  });

  it('preserves attribution query keys for signup handoff', () => {
    const params = new URLSearchParams(
      'utm_source=tiktok&utm_campaign=beta&ignored=1&fbclid=abc&v=a',
    );

    expect(preserveLandingAttributionSearch(params)).toEqual({
      utm_source: 'tiktok',

      utm_campaign: 'beta',

      fbclid: 'abc',

      v: 'a',
    });

    expect(buildLandingSignupHref(params)).toBe(
      '/signup?utm_source=tiktok&utm_campaign=beta&fbclid=abc&v=a',
    );
  });
});

describe('landing-proof-resolver', () => {
  it('defaults to presentation stats and testimonials when pool has entries', () => {
    const proof = resolveLandingProof();

    expect(proof.stats).toBe('presentation');

    expect(proof.testimonials).toBe('presentation');

    expect(proof.withdrawalMomentum).toBe('hidden');
  });
});
