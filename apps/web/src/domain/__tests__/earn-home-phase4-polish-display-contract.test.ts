import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertEarnHomePhase4PolishContractSync,
  PHASE4_EARN_HOME_HI_QA_MATRIX,
  PHASE4_EARN_HOME_OWNER_PATHS,
  PHASE4_EARN_HOME_PART_ORDER,
  PHASE4_EARN_HOME_VIEWPORT_WIDTHS,
  PHASE4_MISSION_START_CTA_MARKERS,
  PHASE4_REFERRAL_LINK_TEST_IDS,
  PHASE4_SIGNATURE_FLOW_MARKERS,
} from '../earn-home-phase4-polish-display-contract';
import { DS_TOUCH_TARGET_MIN_HEIGHT_CLASS } from '../touch-target-display-contract';

const productRoot = resolve(import.meta.dirname, '../../product');

function readProduct(relativePath: string): string {
  return readFileSync(resolve(productRoot, relativePath.replace(/^product\//, '')), 'utf8');
}

describe('earn-home-phase4-polish-display-contract', () => {
  it('keeps hub→missions→referral-tier→HI-QA part order and 4-tier viewports', () => {
    expect(() => assertEarnHomePhase4PolishContractSync()).not.toThrow();
    expect(PHASE4_EARN_HOME_PART_ORDER).toEqual(['home-hub', 'missions', 'referral-tier', 'hi-qa']);
    expect(PHASE4_EARN_HOME_VIEWPORT_WIDTHS).toEqual([390, 768, 1024, 2560]);
    expect(PHASE4_EARN_HOME_HI_QA_MATRIX.length).toBeGreaterThanOrEqual(6);
    expect(PHASE4_EARN_HOME_OWNER_PATHS.length).toBeGreaterThanOrEqual(6);
  });

  it('signature-flow chips use buttonVariants outline sm (48px + focus ring)', () => {
    const source = readProduct('surfaces/home/earn-home-page.tsx');
    for (const marker of PHASE4_SIGNATURE_FLOW_MARKERS) {
      expect(source).toContain(marker);
    }
    expect(source).not.toContain('min-h-10');
  });

  it('tier progress / back links use ghost buttonVariants', () => {
    const home = readProduct('surfaces/home/earn-home-page.tsx');
    expect(home).toContain('earn-home-tier-link');
    expect(home).toMatch(
      /buttonVariants\(\{\s*variant:\s*'ghost',\s*size:\s*'sm'\s*\}\)[\s\S]{0,120}earn-home-tier-link/,
    );

    const tierMe = readProduct('surfaces/tier/tier-me-page.tsx');
    expect(tierMe).toContain('tier-me-benefits-link');
    expect(tierMe).toMatch(
      /buttonVariants\(\{\s*variant:\s*'ghost',\s*size:\s*'sm'\s*\}\)[\s\S]{0,120}tier-me-benefits-link/,
    );

    const leaderboard = readProduct('surfaces/tier/tier-leaderboard-page.tsx');
    expect(leaderboard).toContain('tier-leaderboard-back');
    expect(leaderboard).toMatch(
      /buttonVariants\(\{\s*variant:\s*'ghost',\s*size:\s*'sm'\s*\}\)[\s\S]{0,160}tier-leaderboard-back/,
    );
  });

  it('Fold4 mission previews stay full-card Links', () => {
    const source = readProduct('surfaces/home/earn-home-page.tsx');
    expect(source).toContain('earn-home-mission-${mission.id}');
    expect(source).toContain('focus-visible:ring-2');
    expect(source).toContain('aria-label={t(mission.titleKey)}');
  });

  it('missions tabs + detail close consume touch-target / IconButton', () => {
    const source = readProduct('surfaces/home/home-missions-page.tsx');
    expect(source).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
    expect(source).toContain('focus-visible:ring-2');
    expect(source).toContain('IconButton');
    expect(source).toContain('home-missions-detail-close');
    expect(source).not.toMatch(/home-missions-detail-close[\s\S]{0,120}className="[^"]*p-1/);
  });

  it('mission start CTAs use outline md buttonVariants on hub lanes', () => {
    for (const relative of [
      'surfaces/home/home-missions-page.tsx',
      'surfaces/home/home-missions-referral-page.tsx',
      'surfaces/home/home-missions-invite-page.tsx',
    ] as const) {
      const source = readProduct(relative);
      expect(source).toContain(PHASE4_MISSION_START_CTA_MARKERS[0]);
      expect(source).not.toMatch(
        /ctaRoute && mission\.state === 'in_progress'[\s\S]{0,280}underline-offset-4 hover:underline/,
      );
    }
  });

  it('referral hub CTAs use router Link (not raw <a href>)', () => {
    const source = readProduct('surfaces/referral/referral-page.tsx');
    expect(source).toContain("from '@tanstack/react-router'");
    expect(source).toContain('<Link');
    for (const testId of PHASE4_REFERRAL_LINK_TEST_IDS) {
      expect(source).toContain(testId);
    }
    expect(source).not.toMatch(/<a\s+href=\{REFERRAL_INVITE_ROUTE\}/);
    expect(source).not.toMatch(/<a\s+href=\{REFERRAL_LEADERBOARD_ROUTE\}/);
    expect(source).not.toMatch(/<a\s+href=\{LEGAL_AFFILIATE_ROUTE\}/);
  });

  it('staking pool cards expose keyboard focus ring', () => {
    const source = readProduct('surfaces/staking/staking-hub-page.tsx');
    expect(source).toContain('staking-pool-${pool.id}');
    expect(source).toContain('focus-visible:ring-2');
    expect(source).toContain("event.key === 'Enter'");
    expect(source).toContain('staking-wizard-step-${step}');
  });
});
