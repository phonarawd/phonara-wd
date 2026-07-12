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

  it('defines presentation wallet preview constant as Decimal string', () => {
    expect(LANDING_WALLET_PREVIEW_PHON).toBe('2900');

    expect(sumLandingAvailableRewardsPhon()).toBe(2900);
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

    expect(findLandingMissionTeaser(LANDING_MISSION_PREVIEW_FEATURED_ID).rewardLabel).toBe(
      '+200 PHON',
    );
  });

  it('sums catalog rewards for L2 proof (never zero on cold start)', () => {
    expect(LANDING_MISSION_TEASERS.length).toBeGreaterThanOrEqual(3);

    expect(sumLandingAvailableRewardsPhon()).toBeGreaterThan(0);
  });

  it('parses mission reward labels from catalog display strings', () => {
    expect(parseLandingRewardPhon('+200P')).toBe(200);

    expect(parseLandingRewardPhon('+2,000P')).toBe(2000);

    expect(parseLandingRewardPhon('+200 PHON')).toBe(200);
  });

  it('formats landing rewards as PHON — never bare P suffix', () => {
    for (const mission of LANDING_MISSION_TEASERS) {
      expect(mission.rewardLabel).toMatch(/^\+[\d,]+ PHON$/);
      expect(mission.rewardLabel).not.toMatch(/P$/);
    }
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
  it('fail-closes synthetic stats and testimonials by default (C-01)', () => {
    const proof = resolveLandingProof();

    expect(proof.stats).toBe('hidden');

    expect(proof.testimonials).toBe('hidden');

    expect(proof.withdrawalMomentum).toBe('hidden');

    expect(proof.withdrawalProof).toBe('hidden');

    expect(proof.ambientSocial).toBe('hidden');
  });

  it('opens live stats only with verified live member threshold', () => {
    const proof = resolveLandingProof({ proofMode: 'live', liveMemberCount: 150 });

    expect(proof.stats).toBe('live');

    expect(proof.testimonials).toBe('verified');

    expect(proof.withdrawalMomentum).toBe('live');

    expect(proof.withdrawalProof).toBe('hidden');

    expect(proof.ambientSocial).toBe('hidden');
  });
});
