/**
 * E23 Casino UI unlock pin (YAML `ew-e23-ui-casino-live-unlocks`).
 * Authority: ADR-017 §6 · Plan §23.9 E23-6 · GATE `ew-e23-gate-casino-live` DONE.
 *
 * Flips `LAUNCH_GATES.casinoLiveLive` · live crash stage · progressive mines/hilo/blackjack ·
 * fairness seed controls · §23.2.1 replay→live dual-mode.
 * Next: `ew-e8-financial-wave`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  EW_E23_GATE_CASINO_LIVE_TODO,
  EW_E23_GATE_UI_UNLOCK_WIRE_STATUS,
  isEwE23CasinoLiveGateReady,
  isFairnessSeedControlsUiPathUnlocked,
  isLiveCrashUiPathUnlocked,
  isProgressiveRoundsUiPathUnlocked,
  resolveEwE23GateUiUnlockWireStatus,
} from './ew-e23-gate-casino-live-display-contract';
import {
  EW_E23_LIVE_CRASH_CASHOUT_RPC,
  EW_E23_LIVE_CRASH_GET_RPC,
  EW_E23_LIVE_CRASH_PLACE_RPC,
  EW_E23_PROGRESSIVE_CASHOUT_RPC,
  EW_E23_PROGRESSIVE_GAMES,
  EW_E23_PROGRESSIVE_START_RPC,
  EW_E23_PROGRESSIVE_STEP_RPC,
  EW_E23_ROTATE_SERVER_SEED_RPC,
  EW_E23_SET_CLIENT_SEED_RPC,
  isEwE23CasinoLiveEngineReady,
  isEwE23CasinoLiveUiUnlocked,
} from './ew-e23-casino-live-display-contract';

export const EW_E23_UI_CASINO_LIVE_UNLOCKS_TODO = 'ew-e23-ui-casino-live-unlocks' as const;
export const EW_E23_UI_CASINO_LIVE_UNLOCKS_PREREQUISITE_TODO =
  EW_E23_GATE_CASINO_LIVE_TODO;
export const EW_E23_UI_CASINO_LIVE_UNLOCKS_NEXT_TODO = 'ew-e8-financial-wave' as const;

/** Games that unlock progressive / live mid-round controls. */
export const EW_E23_UI_LIVE_PLAY_GAMES = [
  'crash',
  'mines',
  'hilo',
  'blackjack',
] as const;

export type EwE23UiLivePlayGame = (typeof EW_E23_UI_LIVE_PLAY_GAMES)[number];

export const EW_E23_UI_CASINO_LIVE_UNLOCKS_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e23-ui-casino-live-unlocks-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e23-ui-casino-live-unlocks-display-contract.test.ts',
  'apps/web/src/lib/launch-gates.ts',
  'apps/web/src/features/casino/use-game-pf-state.ts',
  'apps/web/src/features/casino/use-progressive-round.ts',
  'apps/web/src/features/casino/use-live-crash.ts',
  'apps/web/src/product/surfaces/games/crash-stage.tsx',
  'apps/web/src/product/surfaces/games/mines-stage.tsx',
  'apps/web/src/product/surfaces/games/hilo-stage.tsx',
  'apps/web/src/product/surfaces/games/blackjack-stage.tsx',
  'apps/web/src/product/surfaces/games/casino-game-shell.tsx',
  'apps/web/src/product/surfaces/casino/casino-fairness-page.tsx',
  'docs/OPERATIONS/ENGINE_GAP_E23_UI_CASINO_LIVE_UNLOCKS.md',
  'docs/PRODUCT/ADR/017-casino-live-progressive-pf.md',
] as const;

export const EW_E23_UI_CASINO_LIVE_UNLOCKS_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e23-ui-casino-live-unlocks-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e23-gate-casino-live-display-contract.test.ts',
  'apps/web/src/domain/__tests__/casino-fairness-display-contract.test.ts',
  'apps/web/src/product/surfaces/games/__tests__/casino-games-batch-a-stages.test.tsx',
  'apps/web/src/product/surfaces/games/__tests__/casino-games-batch-b-stages.test.tsx',
] as const;

export function isEwE23UiLivePlayGame(code: string): code is EwE23UiLivePlayGame {
  return (EW_E23_UI_LIVE_PLAY_GAMES as readonly string[]).includes(code);
}

/** Full Casino live UI unlocked after GATE remote verify. */
export function isEwE23CasinoUiLiveUnlocked(): boolean {
  const wire = resolveEwE23GateUiUnlockWireStatus();
  return (
    LAUNCH_GATES.casinoLiveEngine === true &&
    LAUNCH_GATES.casinoLiveLive === true &&
    isEwE23CasinoLiveEngineReady() &&
    isEwE23CasinoLiveUiUnlocked() &&
    isEwE23CasinoLiveGateReady() &&
    isProgressiveRoundsUiPathUnlocked() &&
    isLiveCrashUiPathUnlocked() &&
    isFairnessSeedControlsUiPathUnlocked() &&
    wire.progressive_rounds_stage === 'live' &&
    wire.live_crash_stage === 'live' &&
    wire.fairness_seed_controls === 'live' &&
    EW_E23_GATE_UI_UNLOCK_WIRE_STATUS.progressive_rounds_stage === 'live' &&
    EW_E23_GATE_UI_UNLOCK_WIRE_STATUS.live_crash_stage === 'live' &&
    EW_E23_GATE_UI_UNLOCK_WIRE_STATUS.fairness_seed_controls === 'live' &&
    EW_E23_PROGRESSIVE_START_RPC === 'rpc_progressive_start' &&
    EW_E23_PROGRESSIVE_STEP_RPC === 'rpc_progressive_step' &&
    EW_E23_PROGRESSIVE_CASHOUT_RPC === 'rpc_progressive_cashout' &&
    EW_E23_LIVE_CRASH_GET_RPC === 'rpc_live_crash_get_current' &&
    EW_E23_LIVE_CRASH_PLACE_RPC === 'rpc_live_crash_place_bet' &&
    EW_E23_LIVE_CRASH_CASHOUT_RPC === 'rpc_live_crash_cashout' &&
    EW_E23_SET_CLIENT_SEED_RPC === 'rpc_set_game_client_seed' &&
    EW_E23_ROTATE_SERVER_SEED_RPC === 'rpc_rotate_game_server_seed' &&
    EW_E23_PROGRESSIVE_GAMES.length === 3 &&
    EW_E23_UI_LIVE_PLAY_GAMES.length === 4
  );
}

export function assertEwE23UiCasinoLiveUnlocksSync(): void {
  if (EW_E23_UI_CASINO_LIVE_UNLOCKS_TODO !== 'ew-e23-ui-casino-live-unlocks') {
    throw new Error('E23 UI todo id drift');
  }
  if (EW_E23_UI_CASINO_LIVE_UNLOCKS_PREREQUISITE_TODO !== 'ew-e23-gate-casino-live') {
    throw new Error('E23 UI prerequisite must be ew-e23-gate-casino-live');
  }
  if (EW_E23_UI_CASINO_LIVE_UNLOCKS_NEXT_TODO !== 'ew-e8-financial-wave') {
    throw new Error('E23 UI next must be ew-e8-financial-wave');
  }
  if (!isEwE23CasinoUiLiveUnlocked()) {
    throw new Error('E23 UI casino live unlock not complete');
  }
  if (LAUNCH_GATES.casinoLiveLive !== true) {
    throw new Error('E23 UI must set casinoLiveLive true');
  }
  if (resolveEwE23GateUiUnlockWireStatus().progressive_rounds_stage !== 'live') {
    throw new Error('E23 UI must wire progressive_rounds_stage live');
  }
  if (resolveEwE23GateUiUnlockWireStatus().live_crash_stage !== 'live') {
    throw new Error('E23 UI must wire live_crash_stage live');
  }
  if (resolveEwE23GateUiUnlockWireStatus().fairness_seed_controls !== 'live') {
    throw new Error('E23 UI must wire fairness_seed_controls live');
  }
}
