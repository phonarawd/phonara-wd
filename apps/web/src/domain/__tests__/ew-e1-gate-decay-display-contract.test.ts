import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import { isTierKeepStatusClaimEngineLive } from '../dead-controls-display-contract';
import {
  EW_E1_GATE_DECAY_ARTIFACT_PATHS,
  EW_E1_GATE_DECAY_NEXT_TODO,
  EW_E1_GATE_DECAY_PREREQUISITE_TODO,
  EW_E1_GATE_DECAY_REMOTE_MIGRATION_NAME,
  EW_E1_GATE_DECAY_TEST_PATHS,
  EW_E1_GATE_DECAY_TODO,
  EW_E1_GATE_DECAY_UNLOCK_ROUTE,
  assertEwE1GateDecaySync,
  isTierMeDecayFullUnlocked,
} from '../ew-e1-gate-decay-display-contract';
import { TIER_DECAY_NEXT_TODO, TIER_DECAY_TODO } from '../tier-decay-display-contract';
import {
  TIER_DECAY_STATUS_RPC,
  TIER_ME_ROUTE,
  parseTierDecayStatusSnapshot,
  tierMeUsesDecayStatusRpc,
} from '../tier-me-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e1-gate-decay-display-contract (E1 GATE)', () => {
  it('pins GATE todo · wave prerequisite · next E2 wave', () => {
    expect(EW_E1_GATE_DECAY_TODO).toBe('ew-e1-gate-decay');
    expect(EW_E1_GATE_DECAY_PREREQUISITE_TODO).toBe(TIER_DECAY_TODO);
    expect(EW_E1_GATE_DECAY_NEXT_TODO).toBe('ew-e2-missions-wave');
    expect(TIER_DECAY_NEXT_TODO).toBe('ew-e1-gate-decay');
    expect(EW_E1_GATE_DECAY_UNLOCK_ROUTE).toBe(TIER_ME_ROUTE);
    expect(EW_E1_GATE_DECAY_REMOTE_MIGRATION_NAME).toBe('ew_e1_tier_decay');
    expect(() => assertEwE1GateDecaySync()).not.toThrow();
  });

  it('unlocks /tier/me full with live decay status RPC + launch gate', () => {
    expect(isTierMeDecayFullUnlocked()).toBe(true);
    expect(LAUNCH_GATES.tierDecayEngine).toBe(true);
    expect(isTierKeepStatusClaimEngineLive()).toBe(true);
    expect(tierMeUsesDecayStatusRpc()).toBe(TIER_DECAY_STATUS_RPC);
    expect(TIER_DECAY_STATUS_RPC).toBe('rpc_get_tier_decay_status');
  });

  it('requires GATE artifacts on disk', () => {
    for (const rel of EW_E1_GATE_DECAY_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E1_GATE_DECAY_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const controller = readRepo('apps/web/src/features/earn/use-tier-me-page-controller.ts');
    expect(controller).toContain("callRpc('rpc_get_tier_decay_status')");
    expect(controller).toContain('parseTierDecayStatusSnapshot');

    const page = readRepo('apps/web/src/product/surfaces/tier/tier-me-page.tsx');
    expect(page).toContain('tier-me-decay-countdown');
    expect(page).toContain('tier.me.decay.disclaimerLive');

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E1_GATE_DECAY.md');
    expect(ops).toContain(EW_E1_GATE_DECAY_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
  });

  it('parses live decay status payload for countdown unlock', () => {
    const snapshot = parseTierDecayStatusSnapshot({
      tier: 'gold',
      eligible: true,
      grace_days: 45,
      days_left: 12,
      meets_maintenance: false,
      lower_tier: 'silver',
      last_qualifying_at: '2026-06-01T00:00:00Z',
      last_decay_at: null,
    });
    expect(snapshot).toMatchObject({
      tier: 'gold',
      eligible: true,
      graceDays: 45,
      daysLeft: 12,
      meetsMaintenance: false,
      lowerTier: 'silver',
    });
  });
});
