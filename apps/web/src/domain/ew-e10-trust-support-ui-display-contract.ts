/**
 * E10 trust+support UI unlock (YAML `ew-e10-trust-support-ui`).
 * Authority: ADR-019 · ADR-020 · Plan §21.1 E10 linear · E9 GATE DONE.
 *
 * Flips `/support/ticket` · `/status` · `/tier/leaderboard` live.
 * Next: `ew-e10-growth-ui`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  EW_E9_CREATE_SUPPORT_TICKET_RPC,
  EW_E9_LIST_SUPPORT_TICKETS_RPC,
  EW_E9_TIER_LEADERBOARD_RPC,
  isEwE9IdentityEngineReady,
} from './ew-e9-identity-support-display-contract';
import {
  EW_E9_GATE_UI_UNLOCK_WIRE_STATUS,
  isSupportTicketsEnginePathReady,
  isTierLeaderboardEnginePathReady,
  resolveEwE9GateUiUnlockWireStatus,
} from './ew-e9-gate-identity-support-display-contract';
import {
  assertEwE10WalletSettingsUiSync,
  EW_E10_WALLET_SETTINGS_UI_TODO,
} from './ew-e10-wallet-settings-ui-display-contract';
import { isSupportTicketHubLive } from './support-hub-display-contract';
import { isSystemStatusLive } from './system-status-display-contract';
import { isTierLeaderboardRankListLive } from './tier-leaderboard-display-contract';

export const EW_E10_TRUST_SUPPORT_UI_TODO = 'ew-e10-trust-support-ui' as const;
export const EW_E10_TRUST_SUPPORT_UI_PREREQUISITE_TODO = EW_E10_WALLET_SETTINGS_UI_TODO;
export const EW_E10_TRUST_SUPPORT_UI_NEXT_TODO = 'ew-e10-growth-ui' as const;

export const EW_E10_TRUST_SUPPORT_UI_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e10-trust-support-ui-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e10-trust-support-ui-display-contract.test.ts',
  'apps/web/src/domain/support-hub-display-contract.ts',
  'apps/web/src/domain/system-status-display-contract.ts',
  'apps/web/src/domain/tier-leaderboard-display-contract.ts',
  'apps/web/src/lib/launch-gates.ts',
  'apps/web/src/domain/platform-narrative-display-contract.ts',
  'apps/web/src/product/surfaces/marketing/support-ticket-page.tsx',
  'apps/web/src/product/surfaces/marketing/system-status-page.tsx',
  'apps/web/src/product/surfaces/tier/tier-leaderboard-page.tsx',
  'docs/OPERATIONS/ENGINE_GAP_E10_TRUST_SUPPORT_UI.md',
  'docs/PRODUCT/ADR/019-identity-support-analytics.md',
] as const;

export const EW_E10_TRUST_SUPPORT_UI_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e10-trust-support-ui-display-contract.test.ts',
  'apps/web/src/domain/__tests__/support-hub-display-contract.test.ts',
  'apps/web/src/domain/__tests__/system-status-display-contract.test.ts',
  'apps/web/src/domain/__tests__/tier-leaderboard-display-contract.test.ts',
  'apps/web/src/product/surfaces/marketing/__tests__/support-ticket-page.test.tsx',
  'apps/web/src/product/surfaces/marketing/__tests__/system-status-page.test.tsx',
  'apps/web/src/product/surfaces/tier/__tests__/tier-leaderboard-page.test.tsx',
  'apps/web/src/features/support/__tests__/use-support-ticket-controller.test.ts',
  'apps/web/src/features/earn/__tests__/use-tier-leaderboard-controller.test.ts',
] as const;

/** Trust+support surfaces live after E9 engine + E10 wire. */
export function isEwE10TrustSupportUiUnlocked(): boolean {
  const wire = resolveEwE9GateUiUnlockWireStatus();
  return (
    LAUNCH_GATES.identitySupportEngine === true &&
    LAUNCH_GATES.supportTicketsLive === true &&
    LAUNCH_GATES.tierLeaderboardLive === true &&
    LAUNCH_GATES.systemStatusLive === true &&
    isEwE9IdentityEngineReady() &&
    isSupportTicketsEnginePathReady() &&
    isTierLeaderboardEnginePathReady() &&
    wire.support_ticket_hub === 'live' &&
    wire.tier_leaderboard_hub === 'live' &&
    EW_E9_GATE_UI_UNLOCK_WIRE_STATUS.support_ticket_hub === 'live' &&
    EW_E9_GATE_UI_UNLOCK_WIRE_STATUS.tier_leaderboard_hub === 'live' &&
    isSupportTicketHubLive() &&
    isSystemStatusLive() &&
    isTierLeaderboardRankListLive() &&
    EW_E9_CREATE_SUPPORT_TICKET_RPC === 'rpc_create_support_ticket' &&
    EW_E9_LIST_SUPPORT_TICKETS_RPC === 'rpc_list_support_tickets' &&
    EW_E9_TIER_LEADERBOARD_RPC === 'rpc_get_tier_leaderboard'
  );
}

export function assertEwE10TrustSupportUiSync(): void {
  assertEwE10WalletSettingsUiSync();

  if (EW_E10_TRUST_SUPPORT_UI_TODO !== 'ew-e10-trust-support-ui') {
    throw new Error('E10 trust-support UI todo id drift');
  }
  if (EW_E10_TRUST_SUPPORT_UI_PREREQUISITE_TODO !== 'ew-e10-wallet-settings-ui') {
    throw new Error('E10 trust-support prerequisite must be ew-e10-wallet-settings-ui');
  }
  if (EW_E10_TRUST_SUPPORT_UI_NEXT_TODO !== 'ew-e10-growth-ui') {
    throw new Error('E10 trust-support next must be ew-e10-growth-ui');
  }
  if (!isEwE10TrustSupportUiUnlocked()) {
    throw new Error('E10 trust-support UI unlock not complete');
  }
  if (LAUNCH_GATES.supportTicketsLive !== true) {
    throw new Error('E10 trust-support must set supportTicketsLive true');
  }
  if (LAUNCH_GATES.tierLeaderboardLive !== true) {
    throw new Error('E10 trust-support must set tierLeaderboardLive true');
  }
  if (LAUNCH_GATES.systemStatusLive !== true) {
    throw new Error('E10 trust-support must set systemStatusLive true');
  }
  if (resolveEwE9GateUiUnlockWireStatus().support_ticket_hub !== 'live') {
    throw new Error('E10 must wire support_ticket_hub live');
  }
  if (resolveEwE9GateUiUnlockWireStatus().tier_leaderboard_hub !== 'live') {
    throw new Error('E10 must wire tier_leaderboard_hub live');
  }
}
