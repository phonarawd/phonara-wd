/**
 * E23 Casino live GATE pin (YAML `ew-e23-gate-casino-live`).
 * Authority: Plan §23.9 · ADR-017 · remote verify.
 *
 * GATE does not remigrate EXISTS one-shot place — asserts WAVE green · remote apply ·
 * advisor 0 · casino_parity growth · progressive/live/PF UI path unlock (built_hidden).
 * Full live (`casinoLiveLive`) = `ew-e23-ui-casino-live-unlocks`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  EW_E23_CASINO_LIVE_ARTIFACT_PATHS,
  EW_E23_CASINO_LIVE_MIGRATION_NAME,
  EW_E23_CASINO_LIVE_NEXT_TODO,
  EW_E23_CASINO_LIVE_TODO,
  EW_E23_EXISTS_FEATURES,
  EW_E23_EXISTS_PLACE_GAME_BET_RPC,
  EW_E23_LIVE_CRASH_PLACE_RPC,
  EW_E23_NEW_ENGINE_FEATURES,
  EW_E23_PROGRESSIVE_GAMES,
  EW_E23_PROGRESSIVE_START_RPC,
  EW_E23_ROTATE_SERVER_SEED_RPC,
  assertEwE23CasinoLiveWaveSync,
  isEwE23CasinoLiveEngineReady,
} from './ew-e23-casino-live-display-contract';

export const EW_E23_GATE_CASINO_LIVE_TODO = 'ew-e23-gate-casino-live' as const;
export const EW_E23_GATE_CASINO_LIVE_PREREQUISITE_TODO = EW_E23_CASINO_LIVE_TODO;
export const EW_E23_GATE_CASINO_LIVE_NEXT_TODO =
  'ew-e23-ui-casino-live-unlocks' as const;

export const EW_E23_GATE_CASINO_LIVE_REMOTE_MIGRATION_NAME =
  EW_E23_CASINO_LIVE_MIGRATION_NAME;

export const EW_E23_GATE_CASINO_LIVE_SQL_TEST =
  'supabase/tests/ew_e23_casino_live_test.sql' as const;

export const EW_E23_GATE_CASINO_PARITY_SQL_TEST =
  'supabase/tests/casino_parity_test.sql' as const;

/** Filled after `stack:push-remote` — remote version timestamp ≠ local prefix OK. */
export const EW_E23_GATE_CASINO_LIVE_REMOTE_TAIL =
  '20260711183649_ew_e23_casino_live' as const;

/**
 * Live UI wire — GATE authorized paths; UI unlock flips to `live`.
 * Values follow `LAUNCH_GATES.casinoLiveLive` (GATE readiness still holds).
 */
export function resolveEwE23GateUiUnlockWireStatus(): {
  readonly progressive_rounds_stage: 'live' | 'built_hidden';
  readonly live_crash_stage: 'live' | 'built_hidden';
  readonly fairness_seed_controls: 'live' | 'built_hidden';
} {
  const mode = LAUNCH_GATES.casinoLiveLive ? 'live' : 'built_hidden';
  return {
    progressive_rounds_stage: mode,
    live_crash_stage: mode,
    fairness_seed_controls: mode,
  };
}

/** Snapshot for display contracts / tests — live after `ew-e23-ui-casino-live-unlocks`. */
export const EW_E23_GATE_UI_UNLOCK_WIRE_STATUS =
  resolveEwE23GateUiUnlockWireStatus();

export type EwE23GateUiUnlockWireKey = keyof typeof EW_E23_GATE_UI_UNLOCK_WIRE_STATUS;

function isEwE23UiPathAuthorized(status: 'live' | 'built_hidden'): boolean {
  return status === 'built_hidden' || status === 'live';
}

export const EW_E23_GATE_CASINO_LIVE_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e23-gate-casino-live-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e23-gate-casino-live-display-contract.test.ts',
  'apps/web/src/domain/ew-e23-casino-live-display-contract.ts',
  'apps/web/src/lib/launch-gates.ts',
  'docs/PRODUCT/ADR/017-casino-live-progressive-pf.md',
  'docs/OPERATIONS/ENGINE_GAP_E23_CASINO_LIVE.md',
  'docs/OPERATIONS/ENGINE_GAP_E23_GATE_CASINO_LIVE.md',
  'supabase/migrations/20260810000001_ew_e23_casino_live.sql',
  EW_E23_GATE_CASINO_LIVE_SQL_TEST,
  EW_E23_GATE_CASINO_PARITY_SQL_TEST,
] as const;

export const EW_E23_GATE_CASINO_LIVE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e23-gate-casino-live-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e23-casino-live-display-contract.test.ts',
] as const;

/** Progressive mines/hilo/blackjack stage path authorized (GATE / UI). */
export function isProgressiveRoundsUiPathUnlocked(): boolean {
  return (
    EW_E23_PROGRESSIVE_START_RPC === 'rpc_progressive_start' &&
    EW_E23_PROGRESSIVE_GAMES.length === 3 &&
    isEwE23UiPathAuthorized(
      EW_E23_GATE_UI_UNLOCK_WIRE_STATUS.progressive_rounds_stage,
    ) &&
    LAUNCH_GATES.casinoLiveEngine === true
  );
}

/** Live crash shared-round stage path authorized (GATE / UI). */
export function isLiveCrashUiPathUnlocked(): boolean {
  return (
    EW_E23_LIVE_CRASH_PLACE_RPC === 'rpc_live_crash_place_bet' &&
    isEwE23UiPathAuthorized(EW_E23_GATE_UI_UNLOCK_WIRE_STATUS.live_crash_stage) &&
    LAUNCH_GATES.casinoLiveEngine === true
  );
}

/** Fairness seed get/set/rotate path authorized (GATE / UI). */
export function isFairnessSeedControlsUiPathUnlocked(): boolean {
  return (
    EW_E23_ROTATE_SERVER_SEED_RPC === 'rpc_rotate_game_server_seed' &&
    (EW_E23_NEW_ENGINE_FEATURES as readonly string[]).includes(
      'pf_seed_controls',
    ) &&
    isEwE23UiPathAuthorized(
      EW_E23_GATE_UI_UNLOCK_WIRE_STATUS.fairness_seed_controls,
    ) &&
    LAUNCH_GATES.casinoLiveEngine === true
  );
}

/** EXISTS one-shot place honesty — remigration forbidden. */
export function isExistsOneShotPlacePinned(): boolean {
  return (
    EW_E23_EXISTS_PLACE_GAME_BET_RPC === 'rpc_place_game_bet' &&
    EW_E23_EXISTS_FEATURES.length === 1 &&
    EW_E23_EXISTS_FEATURES[0] === 'one_shot_atomic_settle'
  );
}

/**
 * GATE complete when engine remote-ready + live UI paths unlocked (built_hidden).
 * Full live (`casinoLiveLive`) is owned by `ew-e23-ui-casino-live-unlocks`
 * and may become true after GATE closeout — does not invalidate GATE readiness.
 */
export function isEwE23CasinoLiveGateReady(): boolean {
  return (
    LAUNCH_GATES.casinoLiveEngine === true &&
    isEwE23CasinoLiveEngineReady() &&
    isExistsOneShotPlacePinned() &&
    isProgressiveRoundsUiPathUnlocked() &&
    isLiveCrashUiPathUnlocked() &&
    isFairnessSeedControlsUiPathUnlocked()
  );
}

export function assertEwE23GateCasinoLiveSync(): void {
  assertEwE23CasinoLiveWaveSync();

  if (EW_E23_GATE_CASINO_LIVE_TODO !== 'ew-e23-gate-casino-live') {
    throw new Error('E23 GATE todo id drift');
  }
  if (EW_E23_GATE_CASINO_LIVE_PREREQUISITE_TODO !== 'ew-e23-casino-live-wave') {
    throw new Error('E23 GATE prerequisite must be ew-e23-casino-live-wave');
  }
  if (EW_E23_GATE_CASINO_LIVE_NEXT_TODO !== 'ew-e23-ui-casino-live-unlocks') {
    throw new Error('E23 GATE next must be ew-e23-ui-casino-live-unlocks');
  }
  if (EW_E23_CASINO_LIVE_NEXT_TODO !== 'ew-e23-gate-casino-live') {
    throw new Error('E23 WAVE next must unlock ew-e23-gate-casino-live');
  }
  if (EW_E23_GATE_CASINO_LIVE_REMOTE_MIGRATION_NAME !== 'ew_e23_casino_live') {
    throw new Error('E23 GATE remote migration name drift');
  }
  if (EW_E23_NEW_ENGINE_FEATURES.length !== 3) {
    throw new Error('E23 GATE must pin NEW = progressive+live_crash+pf');
  }
  if (EW_E23_EXISTS_FEATURES.length !== 1) {
    throw new Error('E23 GATE must pin EXISTS = one_shot_atomic_settle only');
  }
  if (!isProgressiveRoundsUiPathUnlocked()) {
    throw new Error('E23 GATE progressive UI path unlock missing');
  }
  if (!isLiveCrashUiPathUnlocked()) {
    throw new Error('E23 GATE live crash UI path unlock missing');
  }
  if (!isFairnessSeedControlsUiPathUnlocked()) {
    throw new Error('E23 GATE fairness seed UI path unlock missing');
  }
  if (!isExistsOneShotPlacePinned()) {
    throw new Error('E23 GATE EXISTS one-shot place pin missing');
  }
  if (!isEwE23CasinoLiveGateReady()) {
    throw new Error('E23 GATE casino live not ready');
  }
  if (EW_E23_CASINO_LIVE_ARTIFACT_PATHS.length < 5) {
    throw new Error('E23 WAVE artifacts missing');
  }
}
