/**
 * E22 Sports parity GATE pin (YAML `ew-e22-gate-sports-parity`).
 * Authority: Plan · ADR-016 · remote verify.
 *
 * GATE does not remigrate EXISTS full cashout — asserts WAVE green · remote apply ·
 * advisor 0 · partial/odds/correct-score UI path unlock (built_hidden).
 * Full live controls (`sportsParityLive`) = `ew-e22-ui-sports-parity-unlocks`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  EW_E22_EXISTS_CASHOUT_BET_RPC,
  EW_E22_EXISTS_FEATURES,
  EW_E22_EXISTS_PREVIEW_CASHOUT_RPC,
  EW_E22_NEW_ENGINE_FEATURES,
  EW_E22_ODDS_ACCEPTANCE_POLICIES,
  EW_E22_PARTIAL_CASHOUT_RPC,
  EW_E22_PARTIAL_PREVIEW_RPC,
  EW_E22_SPORTS_PARITY_ARTIFACT_PATHS,
  EW_E22_SPORTS_PARITY_MIGRATION_NAME,
  EW_E22_SPORTS_PARITY_NEXT_TODO,
  EW_E22_SPORTS_PARITY_TODO,
  assertEwE22SportsParityWaveSync,
  isEwE22FullCashoutUiWired,
  isEwE22SportsParityEngineReady,
} from './ew-e22-sports-parity-display-contract';

export const EW_E22_GATE_SPORTS_PARITY_TODO = 'ew-e22-gate-sports-parity' as const;
export const EW_E22_GATE_SPORTS_PARITY_PREREQUISITE_TODO = EW_E22_SPORTS_PARITY_TODO;
export const EW_E22_GATE_SPORTS_PARITY_NEXT_TODO = 'ew-e22-ui-sports-parity-unlocks' as const;

export const EW_E22_GATE_SPORTS_PARITY_REMOTE_MIGRATION_NAME = EW_E22_SPORTS_PARITY_MIGRATION_NAME;

export const EW_E22_GATE_SPORTS_PARITY_SQL_TEST =
  'supabase/tests/ew_e22_sports_parity_test.sql' as const;

export const EW_E22_GATE_SPORTS_PARITY_REMOTE_TAIL = '20260711165308_ew_e22_sports_parity' as const;

/**
 * Tier-B UI wire — GATE authorized paths; UI unlock flips to `live`.
 * Values follow `LAUNCH_GATES.sportsParityLive` (GATE readiness still holds).
 */
export function resolveEwE22GateUiUnlockWireStatus(): {
  readonly partial_cashout_control: 'live' | 'built_hidden';
  readonly odds_acceptance_selector: 'live' | 'built_hidden';
  readonly correct_score_market: 'live' | 'built_hidden';
} {
  const mode = LAUNCH_GATES.sportsParityLive ? 'live' : 'built_hidden';
  return {
    partial_cashout_control: mode,
    odds_acceptance_selector: mode,
    correct_score_market: mode,
  };
}

/** Snapshot for display contracts / tests — live after `ew-e22-ui-sports-parity-unlocks`. */
export const EW_E22_GATE_UI_UNLOCK_WIRE_STATUS = resolveEwE22GateUiUnlockWireStatus();

export type EwE22GateUiUnlockWireKey = keyof typeof EW_E22_GATE_UI_UNLOCK_WIRE_STATUS;

function isEwE22UiPathAuthorized(status: 'live' | 'built_hidden'): boolean {
  return status === 'built_hidden' || status === 'live';
}

export const EW_E22_GATE_SPORTS_PARITY_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e22-gate-sports-parity-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e22-gate-sports-parity-display-contract.test.ts',
  'apps/web/src/domain/ew-e22-sports-parity-display-contract.ts',
  'apps/web/src/lib/launch-gates.ts',
  'docs/PRODUCT/ADR/016-sports-parity-partial-cashout.md',
  'docs/OPERATIONS/ENGINE_GAP_E22_SPORTS_PARITY.md',
  'docs/OPERATIONS/ENGINE_GAP_E22_GATE_SPORTS_PARITY.md',
  'supabase/migrations/20260809000001_ew_e22_sports_parity.sql',
  EW_E22_GATE_SPORTS_PARITY_SQL_TEST,
] as const;

export const EW_E22_GATE_SPORTS_PARITY_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e22-gate-sports-parity-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e22-sports-parity-display-contract.test.ts',
] as const;

/** Partial cashout RPC + preview hooks path authorized (GATE / UI). */
export function isPartialCashoutUiPathUnlocked(): boolean {
  return (
    EW_E22_PARTIAL_CASHOUT_RPC === 'rpc_partial_cashout_sports_bet' &&
    EW_E22_PARTIAL_PREVIEW_RPC === 'rpc_preview_sports_partial_cashout' &&
    isEwE22UiPathAuthorized(EW_E22_GATE_UI_UNLOCK_WIRE_STATUS.partial_cashout_control) &&
    LAUNCH_GATES.sportsParityEngine === true
  );
}

/** Odds acceptance policies on place — selector live after UI unlock. */
export function isOddsAcceptanceUiPathUnlocked(): boolean {
  return (
    EW_E22_ODDS_ACCEPTANCE_POLICIES.length === 3 &&
    EW_E22_ODDS_ACCEPTANCE_POLICIES[0] === 'strict' &&
    EW_E22_ODDS_ACCEPTANCE_POLICIES[1] === 'accept_any' &&
    EW_E22_ODDS_ACCEPTANCE_POLICIES[2] === 'accept_better' &&
    isEwE22UiPathAuthorized(EW_E22_GATE_UI_UNLOCK_WIRE_STATUS.odds_acceptance_selector) &&
    LAUNCH_GATES.sportsParityEngine === true
  );
}

/** Correct score market engine ready — board wire live after UI unlock. */
export function isCorrectScoreUiPathUnlocked(): boolean {
  return (
    (EW_E22_NEW_ENGINE_FEATURES as readonly string[]).includes('correct_score') &&
    isEwE22UiPathAuthorized(EW_E22_GATE_UI_UNLOCK_WIRE_STATUS.correct_score_market) &&
    LAUNCH_GATES.sportsParityEngine === true
  );
}

/** EXISTS full cashout honesty — remigration forbidden. */
export function isExistsFullCashoutPinned(): boolean {
  return (
    isEwE22FullCashoutUiWired() &&
    EW_E22_EXISTS_PREVIEW_CASHOUT_RPC === 'rpc_preview_sports_cashout' &&
    EW_E22_EXISTS_CASHOUT_BET_RPC === 'rpc_cashout_sports_bet' &&
    EW_E22_EXISTS_FEATURES.length === 1 &&
    EW_E22_EXISTS_FEATURES[0] === 'full_cashout'
  );
}

/**
 * GATE complete when engine remote-ready + Tier-B UI paths unlocked (built_hidden).
 * Full live (`sportsParityLive`) is owned by `ew-e22-ui-sports-parity-unlocks`
 * and may become true after GATE closeout — does not invalidate GATE readiness.
 */
export function isEwE22SportsParityGateReady(): boolean {
  return (
    LAUNCH_GATES.sportsParityEngine === true &&
    isEwE22SportsParityEngineReady() &&
    isExistsFullCashoutPinned() &&
    isPartialCashoutUiPathUnlocked() &&
    isOddsAcceptanceUiPathUnlocked() &&
    isCorrectScoreUiPathUnlocked()
  );
}

export function assertEwE22GateSportsParitySync(): void {
  assertEwE22SportsParityWaveSync();

  if (EW_E22_GATE_SPORTS_PARITY_TODO !== 'ew-e22-gate-sports-parity') {
    throw new Error('E22 GATE todo id drift');
  }
  if (EW_E22_GATE_SPORTS_PARITY_PREREQUISITE_TODO !== 'ew-e22-sports-parity-wave') {
    throw new Error('E22 GATE prerequisite must be ew-e22-sports-parity-wave');
  }
  if (EW_E22_GATE_SPORTS_PARITY_NEXT_TODO !== 'ew-e22-ui-sports-parity-unlocks') {
    throw new Error('E22 GATE next must be ew-e22-ui-sports-parity-unlocks');
  }
  if (EW_E22_SPORTS_PARITY_NEXT_TODO !== 'ew-e22-gate-sports-parity') {
    throw new Error('E22 WAVE next must unlock ew-e22-gate-sports-parity');
  }
  if (EW_E22_GATE_SPORTS_PARITY_REMOTE_MIGRATION_NAME !== 'ew_e22_sports_parity') {
    throw new Error('E22 GATE remote migration name drift');
  }
  if (EW_E22_NEW_ENGINE_FEATURES.length !== 4) {
    throw new Error('E22 GATE must pin NEW = partial+odds+correct_score+catalog');
  }
  if (EW_E22_EXISTS_FEATURES.length !== 1) {
    throw new Error('E22 GATE must pin EXISTS = full_cashout only');
  }
  if (!isPartialCashoutUiPathUnlocked()) {
    throw new Error('E22 GATE partial cashout UI path unlock missing');
  }
  if (!isOddsAcceptanceUiPathUnlocked()) {
    throw new Error('E22 GATE odds acceptance UI path unlock missing');
  }
  if (!isCorrectScoreUiPathUnlocked()) {
    throw new Error('E22 GATE correct score UI path unlock missing');
  }
  if (!isExistsFullCashoutPinned()) {
    throw new Error('E22 GATE EXISTS full cashout pin missing');
  }
  if (!isEwE22SportsParityGateReady()) {
    throw new Error('E22 GATE sports parity not ready');
  }
  if (EW_E22_SPORTS_PARITY_ARTIFACT_PATHS.length < 5) {
    throw new Error('E22 WAVE artifacts missing');
  }
}
