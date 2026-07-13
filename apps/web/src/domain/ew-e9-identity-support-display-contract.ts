/**
 * E9 Identity+Support WAVE pin (YAML ew-e9-identity-wave).
 * Authority: docs/PRODUCT/ADR/019-identity-support-analytics.md
 *
 * Same-PR WAVE: ADR + SIWE · support tickets · product analytics ·
 * app-install mission · tier leaderboard.
 * UI live unlock = ew-e9-gate / ew-e9-page-admin-support / E10 UI todos.
 */
import { LAUNCH_GATES } from '../lib/launch-gates';

export const EW_E9_IDENTITY_TODO = 'ew-e9-identity-wave' as const;
export const EW_E9_IDENTITY_PREREQUISITE_TODO = 'ew-e8-gate-financial' as const;
export const EW_E9_IDENTITY_NEXT_TODO = 'ew-e9-gate-identity-support' as const;

export const EW_E9_IDENTITY_ADR_PATH =
  'docs/PRODUCT/ADR/019-identity-support-analytics.md' as const;
export const EW_E9_IDENTITY_MIGRATION_NAME = 'ew_e9_identity_support' as const;
export const EW_E9_APP_INSTALL_ENUM_MIGRATION_NAME = 'ew_e9_app_install_enum' as const;

export const EW_E9_CREATE_SIWE_CHALLENGE_RPC = 'rpc_create_siwe_challenge' as const;
export const EW_E9_SERVICE_CREATE_SIWE_CHALLENGE_RPC = 'rpc_service_create_siwe_challenge' as const;
export const EW_E9_SERVICE_COMPLETE_SIWE_RPC = 'rpc_service_complete_siwe_login' as const;
export const EW_E9_SERVICE_LOOKUP_SIWE_IDENTITY_RPC = 'rpc_service_lookup_siwe_identity' as const;
export const EW_E9_LIST_WALLET_IDENTITIES_RPC = 'rpc_list_wallet_identities' as const;

export const EW_E9_CREATE_SUPPORT_TICKET_RPC = 'rpc_create_support_ticket' as const;
export const EW_E9_LIST_SUPPORT_TICKETS_RPC = 'rpc_list_support_tickets' as const;
export const EW_E9_GET_SUPPORT_TICKET_RPC = 'rpc_get_support_ticket' as const;
export const EW_E9_ADMIN_LIST_SUPPORT_TICKETS_RPC = 'rpc_admin_list_support_tickets' as const;
export const EW_E9_ADMIN_RESOLVE_SUPPORT_TICKET_RPC = 'rpc_admin_resolve_support_ticket' as const;

export const EW_E9_RECORD_ANALYTICS_RPC = 'rpc_record_product_analytics_event' as const;
export const EW_E9_SERVICE_RECORD_ANALYTICS_RPC =
  'rpc_service_record_product_analytics_event' as const;
export const EW_E9_ADMIN_PRODUCT_ANALYTICS_RPC = 'rpc_admin_get_product_analytics' as const;

export const EW_E9_RECORD_APP_INSTALL_RPC = 'rpc_record_app_install_attribution' as const;
export const EW_E9_TIER_LEADERBOARD_RPC = 'rpc_get_tier_leaderboard' as const;

export const EW_E9_SIWE_EDGE_FUNCTION = 'siwe-auth' as const;
export const EW_E9_PRODUCT_ANALYTICS_EDGE_FUNCTION = 'product-analytics' as const;

export const EW_E9_NEW_ENGINE_FEATURES = [
  'siwe_wallet_login',
  'support_tickets',
  'product_analytics_events',
  'app_install_mission',
  'tier_leaderboard',
] as const;

/** EXISTS viral share missions · affiliate LB — remigration 0. */
export const EW_E9_EXISTS_FEATURES = [
  'viral_share_missions',
  'affiliate_rank_leaderboard',
  'passkey_login',
] as const;

/** Hub / login / ticket / LB live deferred to GATE/E10. */
export const EW_E9_DEFERRED_FEATURES = [
  'siwe_login_ui_live',
  'support_ticket_ui_live',
  'tier_leaderboard_ui_live',
  'app_install_mission_ui_live',
] as const;

export const EW_E9_IDENTITY_ARTIFACT_PATHS = [
  EW_E9_IDENTITY_ADR_PATH,
  'supabase/migrations/20260812000001_ew_e9_app_install_enum.sql',
  'supabase/migrations/20260812000002_ew_e9_identity_support.sql',
  'supabase/migrations/20260817000001_m04_r3d_siwe_analytics_ingress.sql',
  'supabase/tests/ew_e9_identity_support_test.sql',
  'supabase/tests/m04_r3d_siwe_analytics_ingress_test.sql',
  'supabase/functions/siwe-auth/index.ts',
  'supabase/functions/product-analytics/index.ts',
  'supabase/functions/_shared/service-ingress.ts',
  'apps/web/src/domain/ew-e9-identity-support-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e9-identity-support-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E9_IDENTITY_SUPPORT.md',
] as const;

export const EW_E9_IDENTITY_MIGRATION_IN_THIS_TODO = true as const;
export const EW_E9_LIVE_UI_SAME_PR_FORBIDDEN = true as const;
export const EW_E9_AD_SURVEY_MISSIONS_FORBIDDEN = true as const;

/** Engine RPCs ready (WAVE). User/admin hubs still gated. */
export function isEwE9IdentityEngineReady(): boolean {
  return (
    EW_E9_CREATE_SIWE_CHALLENGE_RPC === 'rpc_create_siwe_challenge' &&
    EW_E9_CREATE_SUPPORT_TICKET_RPC === 'rpc_create_support_ticket' &&
    EW_E9_RECORD_ANALYTICS_RPC === 'rpc_record_product_analytics_event' &&
    EW_E9_RECORD_APP_INSTALL_RPC === 'rpc_record_app_install_attribution' &&
    EW_E9_TIER_LEADERBOARD_RPC === 'rpc_get_tier_leaderboard' &&
    LAUNCH_GATES.identitySupportEngine === true
  );
}

export function isEwE9IdentityUiUnlocked(): boolean {
  return (
    LAUNCH_GATES.siweLoginLive ||
    LAUNCH_GATES.supportTicketsLive ||
    LAUNCH_GATES.tierLeaderboardLive ||
    LAUNCH_GATES.appInstallMissionLive
  );
}

export function assertEwE9IdentityWaveSync(): void {
  if (EW_E9_IDENTITY_TODO !== 'ew-e9-identity-wave') {
    throw new Error('E9 todo id drift');
  }
  if (EW_E9_IDENTITY_PREREQUISITE_TODO !== 'ew-e8-gate-financial') {
    throw new Error('E9 prerequisite must be ew-e8-gate-financial');
  }
  if (EW_E9_IDENTITY_NEXT_TODO !== 'ew-e9-gate-identity-support') {
    throw new Error('E9 next must be ew-e9-gate-identity-support');
  }
  if (EW_E9_IDENTITY_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E9 must ship identity migration in this todo');
  }
  if (EW_E9_LIVE_UI_SAME_PR_FORBIDDEN !== true) {
    throw new Error('E9 WAVE must not unlock ticket/LB/SIWE UI in same PR');
  }
  if (EW_E9_AD_SURVEY_MISSIONS_FORBIDDEN !== true) {
    throw new Error('E9 must forbid ad/survey missions');
  }
  if (EW_E9_NEW_ENGINE_FEATURES.length !== 5) {
    throw new Error('E9 NEW features must be 5 axes');
  }
  if (!isEwE9IdentityEngineReady()) {
    throw new Error('E9 engine RPCs / launch gate not ready');
  }
  // Hub live flags (`supportTicketsLive` · `tierLeaderboardLive` · `appInstallMissionLive`)
  // owned by E10 UI todos — WAVE readiness does not require them false after UI unlock.
  if (LAUNCH_GATES.siweLoginLive !== false) {
    throw new Error('E9 WAVE must keep siweLoginLive=false');
  }
}
