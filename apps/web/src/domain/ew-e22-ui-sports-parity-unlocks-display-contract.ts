/**
 * E22 Sports UI unlock pin (YAML `ew-e22-ui-sports-parity-unlocks`).
 * Authority: ADR-016 §6 · Plan E22 UI · GATE `ew-e22-gate-sports-parity` DONE.
 *
 * Flips `LAUNCH_GATES.sportsParityLive` · partial cashout header · odds policy ·
 * correct score board · display contracts live.
 * Next: `ew-e23-casino-live-wave`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  EW_E22_GATE_SPORTS_PARITY_TODO,
  EW_E22_GATE_UI_UNLOCK_WIRE_STATUS,
  isCorrectScoreUiPathUnlocked,
  isEwE22SportsParityGateReady,
  isOddsAcceptanceUiPathUnlocked,
  isPartialCashoutUiPathUnlocked,
  resolveEwE22GateUiUnlockWireStatus,
} from './ew-e22-gate-sports-parity-display-contract';
import {
  EW_E22_EXISTS_CASHOUT_BET_RPC,
  EW_E22_EXISTS_PREVIEW_CASHOUT_RPC,
  EW_E22_ODDS_ACCEPTANCE_POLICIES,
  EW_E22_PARTIAL_CASHOUT_RPC,
  EW_E22_PARTIAL_PREVIEW_RPC,
  isEwE22FullCashoutUiWired,
  isEwE22SportsParityEngineReady,
  isEwE22SportsParityLiveUnlocked,
} from './ew-e22-sports-parity-display-contract';
import {
  isSportsBoardSelectableMarketType,
  SPORTS_BOARD_SELECTABLE_MARKET_TYPES,
} from './sports-exchange-parity-display-contract';

export const EW_E22_UI_SPORTS_PARITY_UNLOCKS_TODO = 'ew-e22-ui-sports-parity-unlocks' as const;
export const EW_E22_UI_SPORTS_PARITY_UNLOCKS_PREREQUISITE_TODO = EW_E22_GATE_SPORTS_PARITY_TODO;
export const EW_E22_UI_SPORTS_PARITY_UNLOCKS_NEXT_TODO = 'ew-e23-casino-live-wave' as const;

/** Default odds policy — decline rejects (`accept_better`); any change rejects (`strict`). */
export const EW_E22_UI_DEFAULT_ODDS_ACCEPTANCE = 'accept_better' as const;

export const EW_E22_PARTIAL_CASHOUT_PERCENT_PRESETS = [25, 50, 75] as const;

export const EW_E22_UI_SPORTS_PARITY_UNLOCKS_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e22-ui-sports-parity-unlocks-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e22-ui-sports-parity-unlocks-display-contract.test.ts',
  'apps/web/src/lib/launch-gates.ts',
  'apps/web/src/product/surfaces/sports/sports-cashout-card.tsx',
  'apps/web/src/product/surfaces/sports/sports-bet-slip-panel.tsx',
  'apps/web/src/product/surfaces/sports/sports-fixture-markets-panel.tsx',
  'docs/OPERATIONS/ENGINE_GAP_E22_UI_SPORTS_PARITY_UNLOCKS.md',
  'docs/PRODUCT/ADR/016-sports-parity-partial-cashout.md',
] as const;

export const EW_E22_UI_SPORTS_PARITY_UNLOCKS_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e22-ui-sports-parity-unlocks-display-contract.test.ts',
  'apps/web/src/product/surfaces/sports/__tests__/sports-cashout-card.test.tsx',
  'apps/web/src/domain/__tests__/ew-e22-gate-sports-parity-display-contract.test.ts',
] as const;

/** Full Tier-B Sports UI unlocked after GATE remote verify. */
export function isEwE22SportsUiParityUnlocked(): boolean {
  const wire = resolveEwE22GateUiUnlockWireStatus();
  return (
    LAUNCH_GATES.sportsParityEngine === true &&
    LAUNCH_GATES.sportsParityLive === true &&
    isEwE22SportsParityEngineReady() &&
    isEwE22SportsParityLiveUnlocked() &&
    isEwE22SportsParityGateReady() &&
    isPartialCashoutUiPathUnlocked() &&
    isOddsAcceptanceUiPathUnlocked() &&
    isCorrectScoreUiPathUnlocked() &&
    wire.partial_cashout_control === 'live' &&
    wire.odds_acceptance_selector === 'live' &&
    wire.correct_score_market === 'live' &&
    EW_E22_GATE_UI_UNLOCK_WIRE_STATUS.partial_cashout_control === 'live' &&
    isSportsBoardSelectableMarketType('correct_score') &&
    (SPORTS_BOARD_SELECTABLE_MARKET_TYPES as readonly string[]).includes('correct_score') &&
    EW_E22_PARTIAL_CASHOUT_RPC === 'rpc_partial_cashout_sports_bet' &&
    EW_E22_PARTIAL_PREVIEW_RPC === 'rpc_preview_sports_partial_cashout' &&
    EW_E22_ODDS_ACCEPTANCE_POLICIES.includes(EW_E22_UI_DEFAULT_ODDS_ACCEPTANCE) &&
    isEwE22FullCashoutUiWired() &&
    EW_E22_EXISTS_PREVIEW_CASHOUT_RPC === 'rpc_preview_sports_cashout' &&
    EW_E22_EXISTS_CASHOUT_BET_RPC === 'rpc_cashout_sports_bet'
  );
}

export function assertEwE22UiSportsParityUnlocksSync(): void {
  if (EW_E22_UI_SPORTS_PARITY_UNLOCKS_TODO !== 'ew-e22-ui-sports-parity-unlocks') {
    throw new Error('E22 UI todo id drift');
  }
  if (EW_E22_UI_SPORTS_PARITY_UNLOCKS_PREREQUISITE_TODO !== 'ew-e22-gate-sports-parity') {
    throw new Error('E22 UI prerequisite must be ew-e22-gate-sports-parity');
  }
  if (EW_E22_UI_SPORTS_PARITY_UNLOCKS_NEXT_TODO !== 'ew-e23-casino-live-wave') {
    throw new Error('E22 UI next must be ew-e23-casino-live-wave');
  }
  if (!isEwE22SportsUiParityUnlocked()) {
    throw new Error('E22 UI sports parity unlock not complete');
  }
  if (LAUNCH_GATES.sportsParityLive !== true) {
    throw new Error('E22 UI must set sportsParityLive true');
  }
  if (resolveEwE22GateUiUnlockWireStatus().partial_cashout_control !== 'live') {
    throw new Error('E22 UI must wire partial_cashout_control live');
  }
  if (resolveEwE22GateUiUnlockWireStatus().odds_acceptance_selector !== 'live') {
    throw new Error('E22 UI must wire odds_acceptance_selector live');
  }
  if (resolveEwE22GateUiUnlockWireStatus().correct_score_market !== 'live') {
    throw new Error('E22 UI must wire correct_score_market live');
  }
  if (!isSportsBoardSelectableMarketType('correct_score')) {
    throw new Error('E22 UI must expose correct_score on board');
  }
}
