import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  assertEwE23UiCasinoLiveUnlocksSync,
  EW_E23_UI_CASINO_LIVE_UNLOCKS_ARTIFACT_PATHS,
  EW_E23_UI_CASINO_LIVE_UNLOCKS_NEXT_TODO,
  EW_E23_UI_CASINO_LIVE_UNLOCKS_PREREQUISITE_TODO,
  EW_E23_UI_CASINO_LIVE_UNLOCKS_TEST_PATHS,
  EW_E23_UI_CASINO_LIVE_UNLOCKS_TODO,
  EW_E23_UI_LIVE_PLAY_GAMES,
  isEwE23CasinoUiLiveUnlocked,
  isEwE23UiLivePlayGame,
} from '../ew-e23-ui-casino-live-unlocks-display-contract';
import {
  EW_E23_GATE_UI_UNLOCK_WIRE_STATUS,
  resolveEwE23GateUiUnlockWireStatus,
} from '../ew-e23-gate-casino-live-display-contract';
import { isEwE23CasinoLiveUiUnlocked } from '../ew-e23-casino-live-display-contract';
import {
  CASINO_FAIRNESS_CLIENT_SEED_MODE,
  CASINO_FAIRNESS_SEED_ROTATION_UI_EXPOSED,
} from '../casino-fairness-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e23-ui-casino-live-unlocks-display-contract (E23 UI)', () => {
  it('pins UI todo · GATE prerequisite · next E8 · unlock sync', () => {
    expect(EW_E23_UI_CASINO_LIVE_UNLOCKS_TODO).toBe('ew-e23-ui-casino-live-unlocks');
    expect(EW_E23_UI_CASINO_LIVE_UNLOCKS_PREREQUISITE_TODO).toBe('ew-e23-gate-casino-live');
    expect(EW_E23_UI_CASINO_LIVE_UNLOCKS_NEXT_TODO).toBe('ew-e8-financial-wave');
    expect([...EW_E23_UI_LIVE_PLAY_GAMES]).toEqual(['crash', 'mines', 'hilo', 'blackjack']);
    expect(isEwE23UiLivePlayGame('crash')).toBe(true);
    expect(isEwE23UiLivePlayGame('dice')).toBe(false);
    expect(() => assertEwE23UiCasinoLiveUnlocksSync()).not.toThrow();
  });

  it('unlocks casinoLiveLive · progressive · live crash · fairness seed live', () => {
    expect(isEwE23CasinoUiLiveUnlocked()).toBe(true);
    expect(isEwE23CasinoLiveUiUnlocked()).toBe(true);
    expect(LAUNCH_GATES.casinoLiveLive).toBe(true);
    expect(LAUNCH_GATES.casinoLiveEngine).toBe(true);
    expect(resolveEwE23GateUiUnlockWireStatus().progressive_rounds_stage).toBe('live');
    expect(resolveEwE23GateUiUnlockWireStatus().live_crash_stage).toBe('live');
    expect(resolveEwE23GateUiUnlockWireStatus().fairness_seed_controls).toBe('live');
    expect(EW_E23_GATE_UI_UNLOCK_WIRE_STATUS.live_crash_stage).toBe('live');
    expect(CASINO_FAIRNESS_SEED_ROTATION_UI_EXPOSED).toBe(true);
    expect(CASINO_FAIRNESS_CLIENT_SEED_MODE).toBe('account_or_per_bet');
  });

  it('requires UI artifacts · ops evidence · surface wires', () => {
    for (const rel of EW_E23_UI_CASINO_LIVE_UNLOCKS_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E23_UI_CASINO_LIVE_UNLOCKS_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E23_UI_CASINO_LIVE_UNLOCKS.md');
    expect(ops).toContain(EW_E23_UI_CASINO_LIVE_UNLOCKS_TODO);
    expect(ops).toContain('casinoLiveLive');
    expect(ops).toContain('progressive');
    expect(ops).toContain('Live crash');
    expect(ops).toContain('Fairness');
    expect(ops).toContain('ew-e8-financial-wave');

    const crash = readRepo('apps/web/src/product/surfaces/games/crash-stage.tsx');
    expect(crash).toContain('casino-crash-live-cashout');
    expect(crash).toContain('liveMode');

    const mines = readRepo('apps/web/src/product/surfaces/games/mines-stage.tsx');
    expect(mines).toContain('casino-mines-live-cashout');
    expect(mines).toContain('liveMode');

    const fairness = readRepo('apps/web/src/product/surfaces/casino/casino-fairness-page.tsx');
    expect(fairness).toContain('casino-fairness-seed-controls');
    expect(fairness).toContain('casino-fairness-seed-rotate');

    const shell = readRepo('apps/web/src/product/surfaces/games/casino-game-shell.tsx');
    expect(shell).toContain('casinoLiveLive');
    expect(shell).toContain('casino-play-mode');
  });
});
