import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  EW_E23_GATE_CASINO_LIVE_ARTIFACT_PATHS,
  EW_E23_GATE_CASINO_LIVE_NEXT_TODO,
  EW_E23_GATE_CASINO_LIVE_PREREQUISITE_TODO,
  EW_E23_GATE_CASINO_LIVE_REMOTE_MIGRATION_NAME,
  EW_E23_GATE_CASINO_LIVE_REMOTE_TAIL,
  EW_E23_GATE_CASINO_LIVE_SQL_TEST,
  EW_E23_GATE_CASINO_LIVE_TEST_PATHS,
  EW_E23_GATE_CASINO_LIVE_TODO,
  EW_E23_GATE_CASINO_PARITY_SQL_TEST,
  EW_E23_GATE_UI_UNLOCK_WIRE_STATUS,
  assertEwE23GateCasinoLiveSync,
  isEwE23CasinoLiveGateReady,
  isExistsOneShotPlacePinned,
  isFairnessSeedControlsUiPathUnlocked,
  isLiveCrashUiPathUnlocked,
  isProgressiveRoundsUiPathUnlocked,
} from '../ew-e23-gate-casino-live-display-contract';
import {
  EW_E23_CASINO_LIVE_NEXT_TODO,
  EW_E23_CASINO_LIVE_TODO,
  EW_E23_EXISTS_PLACE_GAME_BET_RPC,
  EW_E23_PROGRESSIVE_START_RPC,
  isEwE23CasinoLiveEngineReady,
} from '../ew-e23-casino-live-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e23-gate-casino-live-display-contract (E23 GATE)', () => {
  it('pins GATE todo · WAVE prerequisite · next UI unlock', () => {
    expect(EW_E23_GATE_CASINO_LIVE_TODO).toBe('ew-e23-gate-casino-live');
    expect(EW_E23_GATE_CASINO_LIVE_PREREQUISITE_TODO).toBe(EW_E23_CASINO_LIVE_TODO);
    expect(EW_E23_GATE_CASINO_LIVE_NEXT_TODO).toBe('ew-e23-ui-casino-live-unlocks');
    expect(EW_E23_CASINO_LIVE_NEXT_TODO).toBe('ew-e23-gate-casino-live');
    expect(EW_E23_GATE_CASINO_LIVE_REMOTE_MIGRATION_NAME).toBe('ew_e23_casino_live');
    expect(EW_E23_GATE_CASINO_LIVE_REMOTE_TAIL).toContain('ew_e23_casino_live');
    expect(EW_E23_GATE_CASINO_LIVE_SQL_TEST).toContain('ew_e23_casino_live_test');
    expect(EW_E23_GATE_CASINO_PARITY_SQL_TEST).toContain('casino_parity_test');
    expect(() => assertEwE23GateCasinoLiveSync()).not.toThrow();
  });

  it('unlocks progressive · live crash · PF paths · casinoLiveLive owned by UI todo', () => {
    expect(isEwE23CasinoLiveGateReady()).toBe(true);
    expect(isEwE23CasinoLiveEngineReady()).toBe(true);
    expect(isProgressiveRoundsUiPathUnlocked()).toBe(true);
    expect(isLiveCrashUiPathUnlocked()).toBe(true);
    expect(isFairnessSeedControlsUiPathUnlocked()).toBe(true);
    expect(isExistsOneShotPlacePinned()).toBe(true);
    expect(LAUNCH_GATES.casinoLiveEngine).toBe(true);
    // UI unlock may flip casinoLiveLive — GATE readiness still holds.
    expect(typeof LAUNCH_GATES.casinoLiveLive).toBe('boolean');
    expect(['live', 'built_hidden']).toContain(
      EW_E23_GATE_UI_UNLOCK_WIRE_STATUS.progressive_rounds_stage,
    );
    expect(['live', 'built_hidden']).toContain(EW_E23_GATE_UI_UNLOCK_WIRE_STATUS.live_crash_stage);
    expect(['live', 'built_hidden']).toContain(
      EW_E23_GATE_UI_UNLOCK_WIRE_STATUS.fairness_seed_controls,
    );
    expect(EW_E23_PROGRESSIVE_START_RPC).toBe('rpc_progressive_start');
    expect(EW_E23_EXISTS_PLACE_GAME_BET_RPC).toBe('rpc_place_game_bet');
  });

  it('requires GATE artifacts · SQL Σ=0 · casino_parity growth · remote/advisor docs', () => {
    for (const rel of EW_E23_GATE_CASINO_LIVE_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E23_GATE_CASINO_LIVE_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const sqlTest = readRepo(EW_E23_GATE_CASINO_LIVE_SQL_TEST);
    expect(sqlTest).toContain('E23-0');
    expect(sqlTest).toContain('E23-4');
    expect(sqlTest).toContain('Σ=0');
    expect(sqlTest).toContain('rpc_progressive_cashout');
    expect(sqlTest).toContain('rpc_live_crash_cashout');

    const parity = readRepo(EW_E23_GATE_CASINO_PARITY_SQL_TEST);
    expect(parity).toContain('CASINO PARITY OK');
    expect(parity).toContain('E23 GROWTH');
    expect(parity).toContain('rpc_progressive_start');
    expect(parity).toContain('rpc_live_crash_place_bet');
    expect(parity).toContain('rpc_rotate_game_server_seed');

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E23_GATE_CASINO_LIVE.md');
    expect(ops).toContain(EW_E23_GATE_CASINO_LIVE_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
    expect(ops).toContain('casino_parity');
    expect(ops).toContain('rpc_progressive_start');
    expect(ops).toContain('ew_e23_casino_live_test');
    expect(ops).toContain('ew-e23-ui-casino-live-unlocks');
    expect(ops).toContain(EW_E23_GATE_CASINO_LIVE_REMOTE_TAIL);
  });
});
