import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  EW_E22_GATE_SPORTS_PARITY_ARTIFACT_PATHS,
  EW_E22_GATE_SPORTS_PARITY_NEXT_TODO,
  EW_E22_GATE_SPORTS_PARITY_PREREQUISITE_TODO,
  EW_E22_GATE_SPORTS_PARITY_REMOTE_MIGRATION_NAME,
  EW_E22_GATE_SPORTS_PARITY_REMOTE_TAIL,
  EW_E22_GATE_SPORTS_PARITY_SQL_TEST,
  EW_E22_GATE_SPORTS_PARITY_TEST_PATHS,
  EW_E22_GATE_SPORTS_PARITY_TODO,
  EW_E22_GATE_UI_UNLOCK_WIRE_STATUS,
  assertEwE22GateSportsParitySync,
  isCorrectScoreUiPathUnlocked,
  isEwE22SportsParityGateReady,
  isExistsFullCashoutPinned,
  isOddsAcceptanceUiPathUnlocked,
  isPartialCashoutUiPathUnlocked,
} from '../ew-e22-gate-sports-parity-display-contract';
import {
  EW_E22_EXISTS_CASHOUT_BET_RPC,
  EW_E22_PARTIAL_CASHOUT_RPC,
  EW_E22_SPORTS_PARITY_NEXT_TODO,
  EW_E22_SPORTS_PARITY_TODO,
  isEwE22SportsParityEngineReady,
} from '../ew-e22-sports-parity-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e22-gate-sports-parity-display-contract (E22 GATE)', () => {
  it('pins GATE todo · WAVE prerequisite · next UI unlock', () => {
    expect(EW_E22_GATE_SPORTS_PARITY_TODO).toBe('ew-e22-gate-sports-parity');
    expect(EW_E22_GATE_SPORTS_PARITY_PREREQUISITE_TODO).toBe(EW_E22_SPORTS_PARITY_TODO);
    expect(EW_E22_GATE_SPORTS_PARITY_NEXT_TODO).toBe('ew-e22-ui-sports-parity-unlocks');
    expect(EW_E22_SPORTS_PARITY_NEXT_TODO).toBe('ew-e22-gate-sports-parity');
    expect(EW_E22_GATE_SPORTS_PARITY_REMOTE_MIGRATION_NAME).toBe('ew_e22_sports_parity');
    expect(EW_E22_GATE_SPORTS_PARITY_REMOTE_TAIL).toContain('ew_e22_sports_parity');
    expect(EW_E22_GATE_SPORTS_PARITY_SQL_TEST).toContain('ew_e22_sports_parity_test');
    expect(() => assertEwE22GateSportsParitySync()).not.toThrow();
  });

  it('unlocks partial · odds · correct-score paths · sportsParityLive owned by UI todo', () => {
    expect(isEwE22SportsParityGateReady()).toBe(true);
    expect(isEwE22SportsParityEngineReady()).toBe(true);
    expect(isPartialCashoutUiPathUnlocked()).toBe(true);
    expect(isOddsAcceptanceUiPathUnlocked()).toBe(true);
    expect(isCorrectScoreUiPathUnlocked()).toBe(true);
    expect(isExistsFullCashoutPinned()).toBe(true);
    expect(LAUNCH_GATES.sportsParityEngine).toBe(true);
    // UI unlock may flip sportsParityLive — GATE readiness still holds.
    expect(typeof LAUNCH_GATES.sportsParityLive).toBe('boolean');
    expect(['live', 'built_hidden']).toContain(
      EW_E22_GATE_UI_UNLOCK_WIRE_STATUS.partial_cashout_control,
    );
    expect(['live', 'built_hidden']).toContain(
      EW_E22_GATE_UI_UNLOCK_WIRE_STATUS.odds_acceptance_selector,
    );
    expect(['live', 'built_hidden']).toContain(
      EW_E22_GATE_UI_UNLOCK_WIRE_STATUS.correct_score_market,
    );
    expect(EW_E22_PARTIAL_CASHOUT_RPC).toBe('rpc_partial_cashout_sports_bet');
    expect(EW_E22_EXISTS_CASHOUT_BET_RPC).toBe('rpc_cashout_sports_bet');
  });

  it('requires GATE artifacts · SQL Σ=0 · remote/advisor evidence docs', () => {
    for (const rel of EW_E22_GATE_SPORTS_PARITY_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E22_GATE_SPORTS_PARITY_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const sqlTest = readRepo(EW_E22_GATE_SPORTS_PARITY_SQL_TEST);
    expect(sqlTest).toContain('E22-0');
    expect(sqlTest).toContain('E22-4');
    expect(sqlTest).toContain('Σ=0');
    expect(sqlTest).toContain('conservation after partial');
    expect(sqlTest).toContain('rpc_partial_cashout_sports_bet');

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E22_GATE_SPORTS_PARITY.md');
    expect(ops).toContain(EW_E22_GATE_SPORTS_PARITY_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
    expect(ops).toContain('partial');
    expect(ops).toContain('rpc_partial_cashout_sports_bet');
    expect(ops).toContain('ew_e22_sports_parity_test');
    expect(ops).toContain('ew-e22-ui-sports-parity-unlocks');
    expect(ops).toContain(EW_E22_GATE_SPORTS_PARITY_REMOTE_TAIL);
  });
});
