import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertEwE23CasinoLiveWaveSync,
  EW_E23_CASINO_LIVE_ADR_PATH,
  EW_E23_CASINO_LIVE_ARTIFACT_PATHS,
  EW_E23_CASINO_LIVE_MIGRATION_IN_THIS_TODO,
  EW_E23_CASINO_LIVE_MIGRATION_NAME,
  EW_E23_CASINO_LIVE_NEXT_TODO,
  EW_E23_CASINO_LIVE_PREREQUISITE_TODO,
  EW_E23_CASINO_LIVE_TODO,
  EW_E23_DEFERRED_FEATURES,
  EW_E23_EXISTS_FEATURES,
  EW_E23_EXISTS_PLACE_GAME_BET_RPC,
  EW_E23_LIVE_CRASH_ADVANCE_RPC,
  EW_E23_LIVE_CRASH_PLACE_RPC,
  EW_E23_LIVE_UI_SAME_PR_FORBIDDEN,
  EW_E23_NEW_ENGINE_FEATURES,
  EW_E23_ONE_SHOT_SEMANTICS_PRESERVED,
  EW_E23_PROGRESSIVE_GAMES,
  EW_E23_PROGRESSIVE_START_RPC,
  EW_E23_ROTATE_SERVER_SEED_RPC,
  EW_E23_SERVER_AUTOBET_FORBIDDEN,
  isEwE23CasinoLiveEngineReady,
  isEwE23CasinoLiveUiUnlocked,
} from '../ew-e23-casino-live-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('ew-e23-casino-live-display-contract (E23 WAVE)', () => {
  it('pins WAVE todo ids · NEW vs EXISTS · engine ready · UI gated', () => {
    assertEwE23CasinoLiveWaveSync();
    expect(EW_E23_CASINO_LIVE_TODO).toBe('ew-e23-casino-live-wave');
    expect(EW_E23_CASINO_LIVE_PREREQUISITE_TODO).toBe('ew-e22-ui-sports-parity-unlocks');
    expect(EW_E23_CASINO_LIVE_NEXT_TODO).toBe('ew-e23-gate-casino-live');
    expect(EW_E23_CASINO_LIVE_MIGRATION_IN_THIS_TODO).toBe(true);
    expect(EW_E23_ONE_SHOT_SEMANTICS_PRESERVED).toBe(true);
    expect(EW_E23_SERVER_AUTOBET_FORBIDDEN).toBe(true);
    expect(EW_E23_LIVE_UI_SAME_PR_FORBIDDEN).toBe(true);
    expect([...EW_E23_NEW_ENGINE_FEATURES]).toEqual([
      'progressive_rounds',
      'live_crash',
      'pf_seed_controls',
    ]);
    expect([...EW_E23_EXISTS_FEATURES]).toEqual(['one_shot_atomic_settle']);
    expect([...EW_E23_DEFERRED_FEATURES]).toEqual(['server_autobet']);
    expect([...EW_E23_PROGRESSIVE_GAMES]).toEqual(['mines', 'hilo', 'blackjack']);
    expect(isEwE23CasinoLiveEngineReady()).toBe(true);
    // UI unlock owns casinoLiveLive — WAVE sync no longer forbids true.
    expect(typeof isEwE23CasinoLiveUiUnlocked()).toBe('boolean');
  });

  it('requires ADR + migration + SQL test · forbids autobet · preserves one-shot', () => {
    for (const rel of EW_E23_CASINO_LIVE_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(EW_E23_CASINO_LIVE_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain(EW_E23_CASINO_LIVE_TODO);
    expect(adr).toContain(EW_E23_PROGRESSIVE_START_RPC);
    expect(adr).toContain(EW_E23_LIVE_CRASH_PLACE_RPC);
    expect(adr).toContain(EW_E23_ROTATE_SERVER_SEED_RPC);
    expect(adr).toContain(EW_E23_EXISTS_PLACE_GAME_BET_RPC);
    expect(adr).toContain('autobet');
    expect(adr).toContain('Σ=0');

    const sql = readRepo('supabase/migrations/20260810000001_ew_e23_casino_live.sql');
    expect(sql).toContain(EW_E23_CASINO_LIVE_MIGRATION_NAME);
    expect(sql).toContain('p_use_account_pf');
    expect(sql).toContain('rpc_progressive_start');
    expect(sql).toContain('rpc_live_crash_advance');
    expect(sql).toContain('user_game_pf_state');
    expect(sql).toContain('live_crash_rounds');
    expect(sql).toContain('ALTER PUBLICATION supabase_realtime');
    expect(sql).not.toMatch(/rpc_server_autobet|CREATE.*FUNCTION.*autobet/i);
    expect(sql).toContain('REVOKE ALL ON user_game_pf_state FROM PUBLIC, anon, authenticated');

    const sqlTest = readRepo('supabase/tests/ew_e23_casino_live_test.sql');
    expect(sqlTest).toContain('E23-0');
    expect(sqlTest).toContain('E23-1');
    expect(sqlTest).toContain('E23-2');
    expect(sqlTest).toContain('E23-3');
    expect(sqlTest).toContain('E23-4');
    expect(sqlTest).toContain(EW_E23_LIVE_CRASH_ADVANCE_RPC);
  });
});
