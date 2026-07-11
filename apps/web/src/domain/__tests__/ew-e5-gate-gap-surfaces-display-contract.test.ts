import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  EW_E5_GATE_GAP_SURFACES_ARTIFACT_PATHS,
  EW_E5_GATE_GAP_SURFACES_NEXT_TODO,
  EW_E5_GATE_GAP_SURFACES_PREREQUISITE_TODO,
  EW_E5_GATE_GAP_SURFACES_TEST_PATHS,
  EW_E5_GATE_GAP_SURFACES_TODO,
  EW_E5_GATE_GAP_SURFACES_UNLOCK_ROUTES,
  areGapSurfaceDeadControlsLive,
  assertEwE5GateGapSurfacesSync,
  isEwE5GapSurfacesFullyUnlocked,
  isReferralLeaderboardFullyUnlocked,
  isSportsVipFullyUnlocked,
  isTierMeDecayFullyUnlocked,
} from '../ew-e5-gate-gap-surfaces-display-contract';
import {
  EW_E5_GAP_SURFACES_WIRE_NEXT_TODO,
  EW_E5_GAP_SURFACES_WIRE_TODO,
  isEwE5GapSurfacesFullyWired,
} from '../ew-e5-gap-surfaces-display-contract';
import { PQA_DEAD_CONTROL_DEFER_REGISTRY } from '../dead-controls-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e5-gate-gap-surfaces-display-contract (E5 GATE)', () => {
  it('pins GATE todo · WIRE prerequisite · next E6 wave', () => {
    expect(EW_E5_GATE_GAP_SURFACES_TODO).toBe('ew-e5-gate-gap-surfaces');
    expect(EW_E5_GATE_GAP_SURFACES_PREREQUISITE_TODO).toBe(EW_E5_GAP_SURFACES_WIRE_TODO);
    expect(EW_E5_GATE_GAP_SURFACES_NEXT_TODO).toBe('ew-e6-admin-desks-wave');
    expect(EW_E5_GAP_SURFACES_WIRE_NEXT_TODO).toBe('ew-e5-gate-gap-surfaces');
    expect([...EW_E5_GATE_GAP_SURFACES_UNLOCK_ROUTES]).toEqual([
      '/tier/me',
      '/referral/leaderboard',
      '/sports/vip',
    ]);
    expect(() => assertEwE5GateGapSurfacesSync()).not.toThrow();
  });

  it('unlocks decay · leaderboard · sports VIP with live dead-controls', () => {
    expect(isEwE5GapSurfacesFullyWired()).toBe(true);
    expect(isEwE5GapSurfacesFullyUnlocked()).toBe(true);
    expect(isTierMeDecayFullyUnlocked()).toBe(true);
    expect(isReferralLeaderboardFullyUnlocked()).toBe(true);
    expect(isSportsVipFullyUnlocked()).toBe(true);
    expect(areGapSurfaceDeadControlsLive()).toBe(true);

    const vip = PQA_DEAD_CONTROL_DEFER_REGISTRY.find((row) => row.id === 'sports-vip-coming-soon');
    expect(vip?.mitigatedBy).toBe('live');
    const lb = PQA_DEAD_CONTROL_DEFER_REGISTRY.find((row) => row.id === 'referral-leaderboard-stub');
    expect(lb?.mitigatedBy).toBe('live');
  });

  it('requires GATE artifacts on disk · unlock docs', () => {
    for (const rel of EW_E5_GATE_GAP_SURFACES_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E5_GATE_GAP_SURFACES_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const wireOps = readRepo('docs/OPERATIONS/ENGINE_GAP_E5_GAP_SURFACES.md');
    expect(wireOps).toContain(EW_E5_GAP_SURFACES_WIRE_TODO);
    expect(wireOps).toContain('/tier/me');
    expect(wireOps).toContain('/referral/leaderboard');
    expect(wireOps).toContain('/sports/vip');

    const gateOps = readRepo('docs/OPERATIONS/ENGINE_GAP_E5_GATE_GAP_SURFACES.md');
    expect(gateOps).toContain(EW_E5_GATE_GAP_SURFACES_TODO);
    expect(gateOps).toContain('gate:ai-impl');
    expect(gateOps).toContain('/tier/me');
    expect(gateOps).toContain('/referral/leaderboard');
    expect(gateOps).toContain('/sports/vip');
    expect(gateOps).toContain('ew-e6-admin-desks-wave');
  });
});
