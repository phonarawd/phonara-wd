/**
 * E22 Sports parity WAVE pin (YAML ew-e22-sports-parity-wave).
 * Authority: docs/PRODUCT/ADR/016-sports-parity-partial-cashout.md
 *
 * Same-PR WAVE: ADR + NEW migration (partial cashout · odds acceptance · catalog)
 * + full cashout EXISTS UI wire (`p10-sports-slip-advanced-wire` honesty).
 * EXISTS (migration 0): rpc_cashout_sports_bet · rpc_preview_sports_cashout.
 * Partial/odds/correct-score UI unlock = ew-e22-gate / ew-e22-ui.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';

export const EW_E22_SPORTS_PARITY_TODO = 'ew-e22-sports-parity-wave' as const;
export const EW_E22_SPORTS_PARITY_PREREQUISITE_TODO = 'ew-e21-ui-trade-engine-unlocks' as const;
export const EW_E22_SPORTS_PARITY_NEXT_TODO = 'ew-e22-gate-sports-parity' as const;
export const EW_E22_FULL_CASHOUT_UI_TODO = 'p10-sports-slip-advanced-wire' as const;

export const EW_E22_SPORTS_PARITY_ADR_PATH =
  'docs/PRODUCT/ADR/016-sports-parity-partial-cashout.md' as const;
export const EW_E22_SPORTS_PARITY_MIGRATION_NAME = 'ew_e22_sports_parity' as const;

export const EW_E22_PARTIAL_PREVIEW_RPC = 'rpc_preview_sports_partial_cashout' as const;
export const EW_E22_PARTIAL_CASHOUT_RPC = 'rpc_partial_cashout_sports_bet' as const;
export const EW_E22_LIST_SPORTS_CATALOG_RPC = 'rpc_list_sports_catalog' as const;

/** EXISTS — do not remigrate in E22. */
export const EW_E22_EXISTS_PREVIEW_CASHOUT_RPC = 'rpc_preview_sports_cashout' as const;
export const EW_E22_EXISTS_CASHOUT_BET_RPC = 'rpc_cashout_sports_bet' as const;

export const EW_E22_ODDS_ACCEPTANCE_POLICIES = [
  'strict',
  'accept_any',
  'accept_better',
] as const;

export type EwE22OddsAcceptancePolicy = (typeof EW_E22_ODDS_ACCEPTANCE_POLICIES)[number];

export const EW_E22_NEW_ENGINE_FEATURES = [
  'partial_cashout',
  'odds_acceptance',
  'correct_score',
  'sport_catalog',
] as const;

export const EW_E22_EXISTS_FEATURES = ['full_cashout'] as const;

export const EW_E22_DEFERRED_FEATURES = ['bet_builder_correlated', 'vendor_feed_worker'] as const;

export const EW_E22_SPORTS_PARITY_ARTIFACT_PATHS = [
  EW_E22_SPORTS_PARITY_ADR_PATH,
  'supabase/migrations/20260809000001_ew_e22_sports_parity.sql',
  'supabase/tests/ew_e22_sports_parity_test.sql',
  'apps/web/src/domain/ew-e22-sports-parity-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e22-sports-parity-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E22_SPORTS_PARITY.md',
] as const;

export const EW_E22_SPORTS_PARITY_MIGRATION_IN_THIS_TODO = true as const;
export const EW_E22_EXISTS_RPC_REMIGRATION_FORBIDDEN = true as const;
export const EW_E22_FULL_CASHOUT_UI_SAME_PR_REQUIRED = true as const;

/** Engine RPCs ready (WAVE). */
export function isEwE22SportsParityEngineReady(): boolean {
  return (
    EW_E22_PARTIAL_CASHOUT_RPC === 'rpc_partial_cashout_sports_bet' &&
    EW_E22_PARTIAL_PREVIEW_RPC === 'rpc_preview_sports_partial_cashout' &&
    LAUNCH_GATES.sportsParityEngine === true
  );
}

/** Partial / catalog UI unlock — owned by GATE/UI todos. */
export function isEwE22SportsParityLiveUnlocked(): boolean {
  return LAUNCH_GATES.sportsParityLive;
}

/** Full cashout card may render when sportsCashout gate is live. */
export function isEwE22FullCashoutUiWired(): boolean {
  return EW_E22_FULL_CASHOUT_UI_SAME_PR_REQUIRED === true;
}

export function assertEwE22SportsParityWaveSync(): void {
  if (EW_E22_SPORTS_PARITY_TODO !== 'ew-e22-sports-parity-wave') {
    throw new Error('E22 todo id drift');
  }
  if (EW_E22_SPORTS_PARITY_PREREQUISITE_TODO !== 'ew-e21-ui-trade-engine-unlocks') {
    throw new Error('E22 prerequisite must be ew-e21-ui-trade-engine-unlocks');
  }
  if (EW_E22_SPORTS_PARITY_NEXT_TODO !== 'ew-e22-gate-sports-parity') {
    throw new Error('E22 next must be ew-e22-gate-sports-parity');
  }
  if (EW_E22_SPORTS_PARITY_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E22 must ship sports parity migration in this todo');
  }
  if (EW_E22_EXISTS_RPC_REMIGRATION_FORBIDDEN !== true) {
    throw new Error('E22 must forbid EXISTS full-cashout remigration');
  }
  if (EW_E22_FULL_CASHOUT_UI_SAME_PR_REQUIRED !== true) {
    throw new Error('E22 must ship full cashout UI in same PR');
  }
  if (EW_E22_NEW_ENGINE_FEATURES.length !== 4) {
    throw new Error('E22 NEW features must be partial+odds+correct_score+catalog');
  }
  if (EW_E22_EXISTS_FEATURES.length !== 1) {
    throw new Error('E22 EXISTS pin must be full_cashout only');
  }
  if (!isEwE22SportsParityEngineReady()) {
    throw new Error('E22 engine RPCs / launch gate not ready');
  }
}
