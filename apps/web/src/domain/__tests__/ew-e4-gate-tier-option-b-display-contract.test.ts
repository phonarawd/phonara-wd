import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  EW_E4_GATE_TIER_OPTION_B_ARTIFACT_PATHS,
  EW_E4_GATE_TIER_OPTION_B_NEXT_TODO,
  EW_E4_GATE_TIER_OPTION_B_PREREQUISITE_TODO,
  EW_E4_GATE_TIER_OPTION_B_REMOTE_MIGRATION_NAME,
  EW_E4_GATE_TIER_OPTION_B_TEST_PATHS,
  EW_E4_GATE_TIER_OPTION_B_TODO,
  EW_E4_GATE_TIER_OPTION_B_UNLOCK_ROUTES,
  TIER_ELITE_ROUTE,
  assertEwE4GateTierOptionBSync,
  isAdminTierWriteFullyUnlocked,
  isFeeDisplayTruthFullyUnlocked,
  isSportsVipAndTierEliteUnlocked,
  isTierOptionBSurfacesFullyUnlocked,
} from '../ew-e4-gate-tier-option-b-display-contract';
import {
  TIER_OPTION_B_NEXT_TODO,
  TIER_OPTION_B_TODO,
  isAdminTierWriteUnlocked,
  isSportsVipSurfaceUnlocked,
  isTierEliteSurfaceUnlocked,
  isTierFeeDisplayTruthUnlocked,
} from '../tier-option-b-display-contract';
import { shouldExposeTierFeeDiscountPercent } from '../tier-fee-display-contract';
import { SPORTS_VIP_MARKETS_ENGINE_STATUS } from '../sports-rules-and-vip-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e4-gate-tier-option-b-display-contract (E4 GATE)', () => {
  it('pins GATE todo · wave prerequisite · next E5 wire', () => {
    expect(EW_E4_GATE_TIER_OPTION_B_TODO).toBe('ew-e4-gate-tier-option-b');
    expect(EW_E4_GATE_TIER_OPTION_B_PREREQUISITE_TODO).toBe(TIER_OPTION_B_TODO);
    expect(EW_E4_GATE_TIER_OPTION_B_NEXT_TODO).toBe('ew-e5-gap-surfaces-wire');
    expect(TIER_OPTION_B_NEXT_TODO).toBe('ew-e4-gate-tier-option-b');
    expect([...EW_E4_GATE_TIER_OPTION_B_UNLOCK_ROUTES]).toEqual([
      '/fees',
      '/tier/me',
      '/tier/elite',
      '/sports/vip',
      '/admin/tiers',
      '/admin/users/$userId/tier',
    ]);
    expect(TIER_ELITE_ROUTE).toBe('/tier/elite');
    expect(EW_E4_GATE_TIER_OPTION_B_REMOTE_MIGRATION_NAME).toBe('ew_e4_tier_option_b');
    expect(() => assertEwE4GateTierOptionBSync()).not.toThrow();
  });

  it('unlocks fee % · admin tier write · /sports/vip · /tier/elite launch gates', () => {
    expect(isTierOptionBSurfacesFullyUnlocked()).toBe(true);
    expect(isFeeDisplayTruthFullyUnlocked()).toBe(true);
    expect(isAdminTierWriteFullyUnlocked()).toBe(true);
    expect(isSportsVipAndTierEliteUnlocked()).toBe(true);
    expect(isTierFeeDisplayTruthUnlocked()).toBe(true);
    expect(isAdminTierWriteUnlocked()).toBe(true);
    expect(isSportsVipSurfaceUnlocked()).toBe(true);
    expect(isTierEliteSurfaceUnlocked()).toBe(true);
    expect(shouldExposeTierFeeDiscountPercent()).toBe(true);
    expect(LAUNCH_GATES.tierOptionBEngine).toBe(true);
    expect(LAUNCH_GATES.tierFeeDisplayTruth).toBe(true);
    expect(LAUNCH_GATES.adminTierWrite).toBe(true);
    expect(LAUNCH_GATES.sportsVipSurface).toBe(true);
    expect(LAUNCH_GATES.tierEliteSurface).toBe(true);
    expect(SPORTS_VIP_MARKETS_ENGINE_STATUS).toBe('exists');
  });

  it('requires GATE artifacts on disk · unlock docs', () => {
    for (const rel of EW_E4_GATE_TIER_OPTION_B_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E4_GATE_TIER_OPTION_B_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const adminContract = readRepo('apps/admin/src/domain/admin-tier-option-b-display-contract.ts');
    expect(adminContract).toContain('ADMIN_TIER_WRITE_UI_UNLOCKED = true');
    expect(adminContract).toContain('/users/$userId/tier');
    expect(adminContract).toContain('/tiers');

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E4_GATE_TIER_OPTION_B.md');
    expect(ops).toContain(EW_E4_GATE_TIER_OPTION_B_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
    expect(ops).toContain('/sports/vip');
    expect(ops).toContain('/tier/elite');
  });
});
