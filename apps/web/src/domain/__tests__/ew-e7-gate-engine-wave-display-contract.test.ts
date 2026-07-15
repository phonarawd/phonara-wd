import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  EW_E7_GATE_ENGINE_WAVE_ARTIFACT_PATHS,
  EW_E7_GATE_ENGINE_WAVE_NEXT_TODO,
  EW_E7_GATE_ENGINE_WAVE_PREREQUISITE_TODO,
  EW_E7_GATE_ENGINE_WAVE_REMOTE_MIGRATION_NAME,
  EW_E7_GATE_ENGINE_WAVE_TEST_PATHS,
  EW_E7_GATE_ENGINE_WAVE_TODO,
  EW_E7_GATE_ENGINE_WAVE_UNLOCK_ROUTE,
  EW_E7_GATE_ENGINE_WAVE_UNLOCK_TAB,
  assertEwE7GateEngineWaveSync,
  isSocialMissionsFullyUnlocked,
} from '../ew-e7-gate-engine-wave-display-contract';
import {
  SOCIAL_CO_MISSION_NEXT_TODO,
  SOCIAL_CO_MISSION_TODO,
  isSocialCoMissionEngineReady,
  isSocialMissionsLiveUnlocked,
} from '../social-co-mission-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e7-gate-engine-wave-display-contract (E7 GATE)', () => {
  it('pins GATE todo · wave prerequisite · next E21 trade parity', () => {
    expect(EW_E7_GATE_ENGINE_WAVE_TODO).toBe('ew-e7-gate-engine-wave');
    expect(EW_E7_GATE_ENGINE_WAVE_PREREQUISITE_TODO).toBe(SOCIAL_CO_MISSION_TODO);
    expect(EW_E7_GATE_ENGINE_WAVE_NEXT_TODO).toBe('ew-e21-trade-parity-wave');
    expect(SOCIAL_CO_MISSION_NEXT_TODO).toBe('ew-e7-gate-engine-wave');
    expect(EW_E7_GATE_ENGINE_WAVE_UNLOCK_ROUTE).toBe('/home/missions');
    expect(EW_E7_GATE_ENGINE_WAVE_UNLOCK_TAB).toBe('social');
    expect(EW_E7_GATE_ENGINE_WAVE_REMOTE_MIGRATION_NAME).toBe('ew_e7_social_co_mission');
    expect(() => assertEwE7GateEngineWaveSync()).not.toThrow();
  });

  it('unlocks /home/missions social with launch gates + co/whale RPCs', () => {
    expect(isSocialMissionsFullyUnlocked()).toBe(true);
    expect(isSocialMissionsLiveUnlocked()).toBe(true);
    expect(isSocialCoMissionEngineReady()).toBe(true);
    expect(LAUNCH_GATES.socialCoMissionEngine).toBe(true);
    expect(LAUNCH_GATES.socialMissionsLive).toBe(true);
  });

  it('requires GATE artifacts on disk · unlock docs', () => {
    for (const rel of EW_E7_GATE_ENGINE_WAVE_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E7_GATE_ENGINE_WAVE_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E7_GATE_ENGINE_WAVE.md');
    expect(ops).toContain(EW_E7_GATE_ENGINE_WAVE_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
    expect(ops).toContain('/home/missions');
    expect(ops).toContain('social');
    expect(ops).toContain('test:engine');
  });
});
