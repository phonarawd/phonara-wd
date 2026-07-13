import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertEwE5GapSurfacesWireSync,
  EW_E5_GAP_SURFACES_WIRE_ARTIFACT_PATHS,
  EW_E5_GAP_SURFACES_WIRE_NEXT_TODO,
  EW_E5_GAP_SURFACES_WIRE_PREREQUISITE_TODO,
  EW_E5_GAP_SURFACES_WIRE_ROUTES,
  EW_E5_GAP_SURFACES_WIRE_TEST_PATHS,
  EW_E5_GAP_SURFACES_WIRE_TODO,
  isEwE5GapSurfacesFullyWired,
  isReferralLeaderboardWireLive,
  isSportsVipMarketsWireLive,
  isTierMeDecayWireLive,
} from '../ew-e5-gap-surfaces-display-contract';
import { PQA_DEAD_CONTROL_DEFER_REGISTRY } from '../dead-controls-display-contract';
import { canBrowseSportsVipMarkets } from '../sports-rules-and-vip-display-contract';
import { isReferralLeaderboardRankListLive } from '../referral-leaderboard-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e5-gap-surfaces-display-contract (E5 WIRE)', () => {
  it('pins WIRE todo · E4 GATE prerequisite · next E5 GATE', () => {
    expect(EW_E5_GAP_SURFACES_WIRE_TODO).toBe('ew-e5-gap-surfaces-wire');
    expect(EW_E5_GAP_SURFACES_WIRE_PREREQUISITE_TODO).toBe('ew-e4-gate-tier-option-b');
    expect(EW_E5_GAP_SURFACES_WIRE_NEXT_TODO).toBe('ew-e5-gate-gap-surfaces');
    expect([...EW_E5_GAP_SURFACES_WIRE_ROUTES]).toEqual([
      '/tier/me',
      '/referral/leaderboard',
      '/sports/vip',
    ]);
    expect(() => assertEwE5GapSurfacesWireSync()).not.toThrow();
  });

  it('wires decay · leaderboard rank list · sports VIP browse', () => {
    expect(isTierMeDecayWireLive()).toBe(true);
    expect(isReferralLeaderboardWireLive()).toBe(true);
    expect(isReferralLeaderboardRankListLive()).toBe(true);
    expect(isSportsVipMarketsWireLive()).toBe(true);
    expect(canBrowseSportsVipMarkets()).toBe(true);
    expect(isEwE5GapSurfacesFullyWired()).toBe(true);

    const vip = PQA_DEAD_CONTROL_DEFER_REGISTRY.find((row) => row.id === 'sports-vip-coming-soon');
    expect(vip?.mitigatedBy).toBe('live');
    const lb = PQA_DEAD_CONTROL_DEFER_REGISTRY.find(
      (row) => row.id === 'referral-leaderboard-stub',
    );
    expect(lb?.mitigatedBy).toBe('live');
  });

  it('requires WIRE artifacts on disk · ops doc', () => {
    for (const rel of EW_E5_GAP_SURFACES_WIRE_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E5_GAP_SURFACES_WIRE_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const page = readRepo('apps/web/src/product/surfaces/referral/referral-leaderboard-page.tsx');
    expect(page).toContain('useReferralLeaderboardController');
    expect(page).toContain('referral-leaderboard-list');

    const vipPanel = readRepo('apps/web/src/product/surfaces/sports/sports-vip-stub-panel.tsx');
    expect(vipPanel).toContain('SportsFixtureBoard');
    expect(vipPanel).toContain('canBrowseSportsVipMarkets');

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E5_GAP_SURFACES.md');
    expect(ops).toContain(EW_E5_GAP_SURFACES_WIRE_TODO);
    expect(ops).toContain('/tier/me');
    expect(ops).toContain('/referral/leaderboard');
    expect(ops).toContain('/sports/vip');
  });
});
