/**
 * E9 Identity+Support GATE pin (YAML `ew-e9-gate-identity-support`).
 * Authority: Plan §21.1 · ADR-019 · remote verify.
 *
 * GATE does not remigrate EXISTS passkey / viral share / affiliate LB — asserts
 * WAVE green · remote apply · advisor 0 · SQL E9-0..E9-5 pin (CI authoritative · G13).
 * Live UI flags stay false until admin desk / E10 unlock todos.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  EW_E9_APP_INSTALL_ENUM_MIGRATION_NAME,
  EW_E9_CREATE_SIWE_CHALLENGE_RPC,
  EW_E9_CREATE_SUPPORT_TICKET_RPC,
  EW_E9_EXISTS_FEATURES,
  EW_E9_IDENTITY_ARTIFACT_PATHS,
  EW_E9_IDENTITY_MIGRATION_NAME,
  EW_E9_IDENTITY_NEXT_TODO,
  EW_E9_IDENTITY_TODO,
  EW_E9_NEW_ENGINE_FEATURES,
  EW_E9_RECORD_ANALYTICS_RPC,
  EW_E9_RECORD_APP_INSTALL_RPC,
  EW_E9_SIWE_EDGE_FUNCTION,
  EW_E9_TIER_LEADERBOARD_RPC,
  assertEwE9IdentityWaveSync,
  isEwE9IdentityEngineReady,
} from './ew-e9-identity-support-display-contract';

export const EW_E9_GATE_IDENTITY_TODO = 'ew-e9-gate-identity-support' as const;
export const EW_E9_GATE_IDENTITY_PREREQUISITE_TODO = EW_E9_IDENTITY_TODO;
export const EW_E9_GATE_IDENTITY_NEXT_TODO = 'ew-e9-page-admin-support' as const;

export const EW_E9_GATE_IDENTITY_REMOTE_MIGRATION_NAME = EW_E9_IDENTITY_MIGRATION_NAME;
export const EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_MIGRATION_NAME =
  EW_E9_APP_INSTALL_ENUM_MIGRATION_NAME;

export const EW_E9_GATE_IDENTITY_SQL_TEST =
  'supabase/tests/ew_e9_identity_support_test.sql' as const;

/** Filled after `stack:push-remote` — remote version timestamp ≠ local prefix OK. */
export const EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_TAIL =
  '20260711194352_ew_e9_app_install_enum' as const;
export const EW_E9_GATE_IDENTITY_REMOTE_TAIL = '20260711194354_ew_e9_identity_support' as const;

/**
 * Hub / login / ticket / LB IA — GATE keeps built_hidden; Admin/E10 flips live.
 * Engine RPCs remain ready (`identitySupportEngine`).
 */
export function resolveEwE9GateUiUnlockWireStatus(): {
  readonly siwe_login_surface: 'live' | 'built_hidden';
  readonly support_ticket_hub: 'live' | 'built_hidden';
  readonly tier_leaderboard_hub: 'live' | 'built_hidden';
  readonly app_install_mission_tab: 'live' | 'built_hidden';
} {
  return {
    siwe_login_surface: LAUNCH_GATES.siweLoginLive ? 'live' : 'built_hidden',
    support_ticket_hub: LAUNCH_GATES.supportTicketsLive ? 'live' : 'built_hidden',
    tier_leaderboard_hub: LAUNCH_GATES.tierLeaderboardLive ? 'live' : 'built_hidden',
    app_install_mission_tab: LAUNCH_GATES.appInstallMissionLive ? 'live' : 'built_hidden',
  };
}

export const EW_E9_GATE_UI_UNLOCK_WIRE_STATUS = resolveEwE9GateUiUnlockWireStatus();

export type EwE9GateUiUnlockWireKey = keyof typeof EW_E9_GATE_UI_UNLOCK_WIRE_STATUS;

function isEwE9UiPathAuthorized(status: 'live' | 'built_hidden'): boolean {
  return status === 'built_hidden' || status === 'live';
}

export const EW_E9_GATE_IDENTITY_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e9-gate-identity-support-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e9-gate-identity-support-display-contract.test.ts',
  'apps/web/src/domain/ew-e9-identity-support-display-contract.ts',
  'apps/web/src/lib/launch-gates.ts',
  'docs/PRODUCT/ADR/019-identity-support-analytics.md',
  'docs/OPERATIONS/ENGINE_GAP_E9_IDENTITY_SUPPORT.md',
  'docs/OPERATIONS/ENGINE_GAP_E9_GATE_IDENTITY_SUPPORT.md',
  'supabase/migrations/20260812000001_ew_e9_app_install_enum.sql',
  'supabase/migrations/20260812000002_ew_e9_identity_support.sql',
  'supabase/functions/siwe-auth/index.ts',
  EW_E9_GATE_IDENTITY_SQL_TEST,
] as const;

export const EW_E9_GATE_IDENTITY_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e9-gate-identity-support-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e9-identity-support-display-contract.test.ts',
] as const;

/** SIWE challenge + edge complete path authorized (GATE / E10 login). */
export function isSiweWalletLoginEnginePathReady(): boolean {
  return (
    EW_E9_CREATE_SIWE_CHALLENGE_RPC === 'rpc_create_siwe_challenge' &&
    EW_E9_SIWE_EDGE_FUNCTION === 'siwe-auth' &&
    (EW_E9_NEW_ENGINE_FEATURES as readonly string[]).includes('siwe_wallet_login') &&
    isEwE9UiPathAuthorized(EW_E9_GATE_UI_UNLOCK_WIRE_STATUS.siwe_login_surface) &&
    LAUNCH_GATES.identitySupportEngine === true
  );
}

/** Support ticket create/list path authorized (GATE / Admin desk). */
export function isSupportTicketsEnginePathReady(): boolean {
  return (
    EW_E9_CREATE_SUPPORT_TICKET_RPC === 'rpc_create_support_ticket' &&
    (EW_E9_NEW_ENGINE_FEATURES as readonly string[]).includes('support_tickets') &&
    isEwE9UiPathAuthorized(EW_E9_GATE_UI_UNLOCK_WIRE_STATUS.support_ticket_hub) &&
    LAUNCH_GATES.identitySupportEngine === true
  );
}

/** Product analytics record path authorized (GATE / admin viral-stats). */
export function isProductAnalyticsEnginePathReady(): boolean {
  return (
    EW_E9_RECORD_ANALYTICS_RPC === 'rpc_record_product_analytics_event' &&
    (EW_E9_NEW_ENGINE_FEATURES as readonly string[]).includes('product_analytics_events') &&
    LAUNCH_GATES.identitySupportEngine === true
  );
}

/** App-install attribution path authorized (GATE / E10 growth). */
export function isAppInstallMissionEnginePathReady(): boolean {
  return (
    EW_E9_RECORD_APP_INSTALL_RPC === 'rpc_record_app_install_attribution' &&
    (EW_E9_NEW_ENGINE_FEATURES as readonly string[]).includes('app_install_mission') &&
    isEwE9UiPathAuthorized(EW_E9_GATE_UI_UNLOCK_WIRE_STATUS.app_install_mission_tab) &&
    LAUNCH_GATES.identitySupportEngine === true
  );
}

/** Tier leaderboard read path authorized (GATE / E10 hub). */
export function isTierLeaderboardEnginePathReady(): boolean {
  return (
    EW_E9_TIER_LEADERBOARD_RPC === 'rpc_get_tier_leaderboard' &&
    (EW_E9_NEW_ENGINE_FEATURES as readonly string[]).includes('tier_leaderboard') &&
    isEwE9UiPathAuthorized(EW_E9_GATE_UI_UNLOCK_WIRE_STATUS.tier_leaderboard_hub) &&
    LAUNCH_GATES.identitySupportEngine === true
  );
}

/** EXISTS passkey / viral share / affiliate honesty — remigration forbidden. */
export function isExistsIdentityGrowthPinned(): boolean {
  return (
    EW_E9_EXISTS_FEATURES.length === 3 &&
    EW_E9_EXISTS_FEATURES[0] === 'viral_share_missions' &&
    EW_E9_EXISTS_FEATURES[1] === 'affiliate_rank_leaderboard' &&
    EW_E9_EXISTS_FEATURES[2] === 'passkey_login'
  );
}

/**
 * GATE complete when engine remote-ready + EXISTS pin + hub paths authorized
 * (built_hidden). Full live flags are owned by Admin desk / E10 UI todos.
 */
export function isEwE9IdentityGateReady(): boolean {
  return (
    LAUNCH_GATES.identitySupportEngine === true &&
    LAUNCH_GATES.siweLoginLive === false &&
    isEwE9IdentityEngineReady() &&
    isExistsIdentityGrowthPinned() &&
    isSiweWalletLoginEnginePathReady() &&
    isSupportTicketsEnginePathReady() &&
    isProductAnalyticsEnginePathReady() &&
    isAppInstallMissionEnginePathReady() &&
    isTierLeaderboardEnginePathReady()
  );
}

export function assertEwE9GateIdentitySync(): void {
  assertEwE9IdentityWaveSync();

  if (EW_E9_GATE_IDENTITY_TODO !== 'ew-e9-gate-identity-support') {
    throw new Error('E9 GATE todo id drift');
  }
  if (EW_E9_GATE_IDENTITY_PREREQUISITE_TODO !== 'ew-e9-identity-wave') {
    throw new Error('E9 GATE prerequisite must be ew-e9-identity-wave');
  }
  if (EW_E9_GATE_IDENTITY_NEXT_TODO !== 'ew-e9-page-admin-support') {
    throw new Error('E9 GATE next must be ew-e9-page-admin-support');
  }
  if (EW_E9_IDENTITY_NEXT_TODO !== 'ew-e9-gate-identity-support') {
    throw new Error('E9 WAVE next must unlock ew-e9-gate-identity-support');
  }
  if (EW_E9_GATE_IDENTITY_REMOTE_MIGRATION_NAME !== 'ew_e9_identity_support') {
    throw new Error('E9 GATE remote migration name drift');
  }
  if (EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_MIGRATION_NAME !== 'ew_e9_app_install_enum') {
    throw new Error('E9 GATE app_install enum migration name drift');
  }
  if (EW_E9_NEW_ENGINE_FEATURES.length !== 5) {
    throw new Error('E9 GATE must pin NEW = 5 identity/support axes');
  }
  if (EW_E9_EXISTS_FEATURES.length !== 3) {
    throw new Error('E9 GATE must pin EXISTS = viral+affiliate+passkey');
  }
  if (!isSiweWalletLoginEnginePathReady()) {
    throw new Error('E9 GATE SIWE engine path not ready');
  }
  if (!isSupportTicketsEnginePathReady()) {
    throw new Error('E9 GATE support tickets path not ready');
  }
  if (!isProductAnalyticsEnginePathReady()) {
    throw new Error('E9 GATE product analytics path not ready');
  }
  if (!isAppInstallMissionEnginePathReady()) {
    throw new Error('E9 GATE app-install mission path not ready');
  }
  if (!isTierLeaderboardEnginePathReady()) {
    throw new Error('E9 GATE tier leaderboard path not ready');
  }
  if (!isExistsIdentityGrowthPinned()) {
    throw new Error('E9 GATE EXISTS identity/growth pin missing');
  }
  if (!isEwE9IdentityGateReady()) {
    throw new Error('E9 GATE identity/support not ready');
  }
  if (EW_E9_IDENTITY_ARTIFACT_PATHS.length < 5) {
    throw new Error('E9 WAVE artifacts missing');
  }
}
