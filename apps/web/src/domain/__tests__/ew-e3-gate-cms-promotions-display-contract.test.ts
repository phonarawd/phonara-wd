import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  EW_E3_GATE_CMS_PROMOTIONS_ARTIFACT_PATHS,
  EW_E3_GATE_CMS_PROMOTIONS_NEXT_TODO,
  EW_E3_GATE_CMS_PROMOTIONS_PREREQUISITE_TODO,
  EW_E3_GATE_CMS_PROMOTIONS_REMOTE_MIGRATION_NAME,
  EW_E3_GATE_CMS_PROMOTIONS_TEST_PATHS,
  EW_E3_GATE_CMS_PROMOTIONS_TODO,
  EW_E3_GATE_CMS_PROMOTIONS_UNLOCK_ROUTES,
  assertEwE3GateCmsPromotionsSync,
  isAdminCmsPromotionsFullyUnlocked,
  isAnnouncementsFullyUnlocked,
  isViralCmsSurfacesFullyUnlocked,
} from '../ew-e3-gate-cms-promotions-display-contract';
import {
  VIRAL_CMS_NEXT_TODO,
  VIRAL_CMS_TODO,
  isReferralLeaderboardLiveUnlocked,
} from '../viral-cms-display-contract';
import { shouldDeferReferralLeaderboard } from '../referral-leaderboard-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e3-gate-cms-promotions-display-contract (E3 GATE)', () => {
  it('pins GATE todo · wave prerequisite · next E4 wave', () => {
    expect(EW_E3_GATE_CMS_PROMOTIONS_TODO).toBe('ew-e3-gate-cms-promotions');
    expect(EW_E3_GATE_CMS_PROMOTIONS_PREREQUISITE_TODO).toBe(VIRAL_CMS_TODO);
    expect(EW_E3_GATE_CMS_PROMOTIONS_NEXT_TODO).toBe('ew-e4-tier-option-b-wave');
    expect(VIRAL_CMS_NEXT_TODO).toBe('ew-e3-gate-cms-promotions');
    expect([...EW_E3_GATE_CMS_PROMOTIONS_UNLOCK_ROUTES]).toEqual([
      '/referral/leaderboard',
      '/admin/promotions',
      '/admin/cms',
      '/announcements',
    ]);
    expect(EW_E3_GATE_CMS_PROMOTIONS_REMOTE_MIGRATION_NAME).toBe('ew_e3_viral_cms');
    expect(() => assertEwE3GateCmsPromotionsSync()).not.toThrow();
  });

  it('unlocks leaderboard · admin CMS/promotions · announcements with launch gates', () => {
    expect(isViralCmsSurfacesFullyUnlocked()).toBe(true);
    expect(isReferralLeaderboardLiveUnlocked()).toBe(true);
    expect(shouldDeferReferralLeaderboard()).toBe(false);
    expect(isAdminCmsPromotionsFullyUnlocked()).toBe(true);
    expect(isAnnouncementsFullyUnlocked()).toBe(true);
    expect(LAUNCH_GATES.viralCmsEngine).toBe(true);
    expect(LAUNCH_GATES.referralLeaderboardLive).toBe(true);
    expect(LAUNCH_GATES.adminCmsPromotions).toBe(true);
    expect(LAUNCH_GATES.announcementsFull).toBe(true);
  });

  it('requires GATE artifacts on disk · unlock docs', () => {
    for (const rel of EW_E3_GATE_CMS_PROMOTIONS_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E3_GATE_CMS_PROMOTIONS_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const adminContract = readRepo(
      'apps/admin/src/domain/admin-cms-promotions-display-contract.ts',
    );
    expect(adminContract).toContain('ADMIN_CMS_PROMOTIONS_UI_UNLOCKED = true');
    expect(adminContract).toContain('/admin/promotions');
    expect(adminContract).toContain('/admin/cms');
    expect(adminContract).toContain('audience');

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E3_GATE_CMS_PROMOTIONS.md');
    expect(ops).toContain(EW_E3_GATE_CMS_PROMOTIONS_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
    expect(ops).toContain('/referral/leaderboard');
    expect(ops).toContain('/announcements');
  });
});
