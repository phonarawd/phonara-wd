import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import { isSportsBoardSelectableMarketType } from '../sports-exchange-parity-display-contract';
import {
  assertEwE22UiSportsParityUnlocksSync,
  EW_E22_PARTIAL_CASHOUT_PERCENT_PRESETS,
  EW_E22_UI_DEFAULT_ODDS_ACCEPTANCE,
  EW_E22_UI_SPORTS_PARITY_UNLOCKS_ARTIFACT_PATHS,
  EW_E22_UI_SPORTS_PARITY_UNLOCKS_NEXT_TODO,
  EW_E22_UI_SPORTS_PARITY_UNLOCKS_PREREQUISITE_TODO,
  EW_E22_UI_SPORTS_PARITY_UNLOCKS_TEST_PATHS,
  EW_E22_UI_SPORTS_PARITY_UNLOCKS_TODO,
  isEwE22SportsUiParityUnlocked,
} from '../ew-e22-ui-sports-parity-unlocks-display-contract';
import {
  EW_E22_GATE_UI_UNLOCK_WIRE_STATUS,
  resolveEwE22GateUiUnlockWireStatus,
} from '../ew-e22-gate-sports-parity-display-contract';
import { isEwE22SportsParityLiveUnlocked } from '../ew-e22-sports-parity-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e22-ui-sports-parity-unlocks-display-contract (E22 UI)', () => {
  it('pins UI todo · GATE prerequisite · next E23 · unlock sync', () => {
    expect(EW_E22_UI_SPORTS_PARITY_UNLOCKS_TODO).toBe('ew-e22-ui-sports-parity-unlocks');
    expect(EW_E22_UI_SPORTS_PARITY_UNLOCKS_PREREQUISITE_TODO).toBe('ew-e22-gate-sports-parity');
    expect(EW_E22_UI_SPORTS_PARITY_UNLOCKS_NEXT_TODO).toBe('ew-e23-casino-live-wave');
    expect(EW_E22_UI_DEFAULT_ODDS_ACCEPTANCE).toBe('accept_better');
    expect(EW_E22_PARTIAL_CASHOUT_PERCENT_PRESETS).toEqual([25, 50, 75]);
    expect(() => assertEwE22UiSportsParityUnlocksSync()).not.toThrow();
  });

  it('unlocks sportsParityLive · partial · odds · correct_score live', () => {
    expect(isEwE22SportsUiParityUnlocked()).toBe(true);
    expect(isEwE22SportsParityLiveUnlocked()).toBe(true);
    expect(LAUNCH_GATES.sportsParityLive).toBe(true);
    expect(LAUNCH_GATES.sportsParityEngine).toBe(true);
    expect(resolveEwE22GateUiUnlockWireStatus().partial_cashout_control).toBe('live');
    expect(resolveEwE22GateUiUnlockWireStatus().odds_acceptance_selector).toBe('live');
    expect(resolveEwE22GateUiUnlockWireStatus().correct_score_market).toBe('live');
    expect(EW_E22_GATE_UI_UNLOCK_WIRE_STATUS.partial_cashout_control).toBe('live');
    expect(isSportsBoardSelectableMarketType('correct_score')).toBe(true);
  });

  it('requires UI artifacts · ops evidence · surface wires', () => {
    for (const rel of EW_E22_UI_SPORTS_PARITY_UNLOCKS_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E22_UI_SPORTS_PARITY_UNLOCKS_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E22_UI_SPORTS_PARITY_UNLOCKS.md');
    expect(ops).toContain(EW_E22_UI_SPORTS_PARITY_UNLOCKS_TODO);
    expect(ops).toContain('sportsParityLive');
    expect(ops).toContain('partial');
    expect(ops).toContain('correct_score');
    expect(ops).toContain('ew-e23-casino-live-wave');

    const cashout = readRepo('apps/web/src/product/surfaces/sports/sports-cashout-card.tsx');
    expect(cashout).toContain('sports-partial-cashout-header');
    expect(cashout).toContain('usePartialCashoutSportsBet');

    const slip = readRepo('apps/web/src/product/surfaces/sports/sports-bet-slip-panel.tsx');
    expect(slip).toContain('sports-odds-acceptance-selector');
    expect(slip).toContain('oddsAcceptance');

    const markets = readRepo(
      'apps/web/src/product/surfaces/sports/sports-fixture-markets-panel.tsx',
    );
    expect(markets).toContain('correct_score');
  });
});
