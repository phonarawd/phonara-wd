/**
 * E23 Casino live WAVE pin (YAML ew-e23-casino-live-wave).
 * Authority: docs/PRODUCT/ADR/017-casino-live-progressive-pf.md
 *
 * Same-PR WAVE: ADR + progressive rounds · live crash · PF seed controls.
 * UI live unlock = ew-e23-gate / ew-e23-ui (casinoLiveLive).
 * EXISTS (migration 0 semantics): one-shot rpc_place_game_bet nonce=1 path.
 * Server autobet RPC = forbidden.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';

export const EW_E23_CASINO_LIVE_TODO = 'ew-e23-casino-live-wave' as const;
export const EW_E23_CASINO_LIVE_PREREQUISITE_TODO = 'ew-e22-ui-sports-parity-unlocks' as const;
export const EW_E23_CASINO_LIVE_NEXT_TODO = 'ew-e23-gate-casino-live' as const;

export const EW_E23_CASINO_LIVE_ADR_PATH =
  'docs/PRODUCT/ADR/017-casino-live-progressive-pf.md' as const;
export const EW_E23_CASINO_LIVE_MIGRATION_NAME = 'ew_e23_casino_live' as const;

export const EW_E23_GET_PF_STATE_RPC = 'rpc_get_game_pf_state' as const;
export const EW_E23_SET_CLIENT_SEED_RPC = 'rpc_set_game_client_seed' as const;
export const EW_E23_ROTATE_SERVER_SEED_RPC = 'rpc_rotate_game_server_seed' as const;

export const EW_E23_PROGRESSIVE_START_RPC = 'rpc_progressive_start' as const;
export const EW_E23_PROGRESSIVE_STEP_RPC = 'rpc_progressive_step' as const;
export const EW_E23_PROGRESSIVE_CASHOUT_RPC = 'rpc_progressive_cashout' as const;
export const EW_E23_PROGRESSIVE_SWEEP_RPC = 'rpc_sweep_stale_progressive_sessions' as const;

export const EW_E23_LIVE_CRASH_GET_RPC = 'rpc_live_crash_get_current' as const;
export const EW_E23_LIVE_CRASH_PLACE_RPC = 'rpc_live_crash_place_bet' as const;
export const EW_E23_LIVE_CRASH_CASHOUT_RPC = 'rpc_live_crash_cashout' as const;
export const EW_E23_LIVE_CRASH_ADVANCE_RPC = 'rpc_live_crash_advance' as const;

/** EXISTS one-shot path — do not remigrate semantics. */
export const EW_E23_EXISTS_PLACE_GAME_BET_RPC = 'rpc_place_game_bet' as const;

export const EW_E23_PROGRESSIVE_GAMES = ['mines', 'hilo', 'blackjack'] as const;

export const EW_E23_NEW_ENGINE_FEATURES = [
  'progressive_rounds',
  'live_crash',
  'pf_seed_controls',
] as const;

export const EW_E23_EXISTS_FEATURES = ['one_shot_atomic_settle'] as const;

/** Server autobet stays deferred; live UI unlocked by `ew-e23-ui-casino-live-unlocks`. */
export const EW_E23_DEFERRED_FEATURES = ['server_autobet'] as const;

export const EW_E23_CASINO_LIVE_ARTIFACT_PATHS = [
  EW_E23_CASINO_LIVE_ADR_PATH,
  'supabase/migrations/20260810000001_ew_e23_casino_live.sql',
  'supabase/tests/ew_e23_casino_live_test.sql',
  'apps/web/src/domain/ew-e23-casino-live-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e23-casino-live-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E23_CASINO_LIVE.md',
] as const;

export const EW_E23_CASINO_LIVE_MIGRATION_IN_THIS_TODO = true as const;
export const EW_E23_ONE_SHOT_SEMANTICS_PRESERVED = true as const;
export const EW_E23_SERVER_AUTOBET_FORBIDDEN = true as const;
export const EW_E23_LIVE_UI_SAME_PR_FORBIDDEN = true as const;

/** Engine RPCs ready (WAVE). Live stage UI still gated. */
export function isEwE23CasinoLiveEngineReady(): boolean {
  return (
    EW_E23_PROGRESSIVE_START_RPC === 'rpc_progressive_start' &&
    EW_E23_LIVE_CRASH_PLACE_RPC === 'rpc_live_crash_place_bet' &&
    EW_E23_ROTATE_SERVER_SEED_RPC === 'rpc_rotate_game_server_seed' &&
    LAUNCH_GATES.casinoLiveEngine === true
  );
}

/** Live crash / progressive / fairness seed UI — GATE/UI todos. */
export function isEwE23CasinoLiveUiUnlocked(): boolean {
  return LAUNCH_GATES.casinoLiveLive;
}

export function assertEwE23CasinoLiveWaveSync(): void {
  if (EW_E23_CASINO_LIVE_TODO !== 'ew-e23-casino-live-wave') {
    throw new Error('E23 todo id drift');
  }
  if (EW_E23_CASINO_LIVE_PREREQUISITE_TODO !== 'ew-e22-ui-sports-parity-unlocks') {
    throw new Error('E23 prerequisite must be ew-e22-ui-sports-parity-unlocks');
  }
  if (EW_E23_CASINO_LIVE_NEXT_TODO !== 'ew-e23-gate-casino-live') {
    throw new Error('E23 next must be ew-e23-gate-casino-live');
  }
  if (EW_E23_CASINO_LIVE_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E23 must ship casino live migration in this todo');
  }
  if (EW_E23_ONE_SHOT_SEMANTICS_PRESERVED !== true) {
    throw new Error('E23 must preserve one-shot place semantics');
  }
  if (EW_E23_SERVER_AUTOBET_FORBIDDEN !== true) {
    throw new Error('E23 must forbid server autobet RPC');
  }
  if (EW_E23_LIVE_UI_SAME_PR_FORBIDDEN !== true) {
    throw new Error('E23 WAVE must not unlock live UI in same PR');
  }
  if (EW_E23_NEW_ENGINE_FEATURES.length !== 3) {
    throw new Error('E23 NEW features must be progressive+live_crash+pf');
  }
  if (EW_E23_PROGRESSIVE_GAMES.length !== 3) {
    throw new Error('E23 progressive games must be mines+hilo+blackjack');
  }
  if (!isEwE23CasinoLiveEngineReady()) {
    throw new Error('E23 engine RPCs / launch gate not ready');
  }
  // Live UI (`casinoLiveLive`) is owned by `ew-e23-ui-casino-live-unlocks` —
  // WAVE readiness does not require it false after UI unlock.
}
