/**
 * E10 Platform Engine WAVE pin (YAML ew-e10-platform-engine-wave).
 * Authority: docs/PRODUCT/ADR/020-platform-engine.md
 *
 * Same-PR WAVE: ADR + KRW proof · mission chains · co-bet · ML recommend.
 * UI live unlock = Admin/UI/GATE follow-on todos.
 */
import { LAUNCH_GATES } from '../lib/launch-gates';

export const EW_E10_PLATFORM_TODO = 'ew-e10-platform-engine-wave' as const;
export const EW_E10_PLATFORM_PREREQUISITE_TODO = 'ew-e9-gate-identity-support' as const;
export const EW_E10_PLATFORM_NEXT_TODO = 'ew-e10-page-admin-krw-proof-review' as const;

export const EW_E10_PLATFORM_ADR_PATH = 'docs/PRODUCT/ADR/020-platform-engine.md' as const;
export const EW_E10_PLATFORM_MIGRATION_NAME = 'ew_e10_platform_engine' as const;

export const EW_E10_ATTACH_KRW_PROOF_RPC = 'rpc_attach_krw_deposit_proof' as const;
export const EW_E10_ADMIN_REVIEW_KRW_PROOF_RPC = 'rpc_admin_review_krw_deposit_proof' as const;

export const EW_E10_LIST_MISSION_CHAINS_RPC = 'rpc_list_mission_chains' as const;
export const EW_E10_GET_MISSION_CHAIN_STATUS_RPC = 'rpc_get_mission_chain_status' as const;

export const EW_E10_INVITE_CO_BET_RPC = 'rpc_invite_co_bet' as const;
export const EW_E10_ACCEPT_CO_BET_RPC = 'rpc_accept_co_bet' as const;
export const EW_E10_LINK_CO_BET_RPC = 'rpc_link_co_bet_bet' as const;
export const EW_E10_COMPLETE_CO_BET_RPC = 'rpc_complete_co_bet' as const;
export const EW_E10_GET_CO_BET_STATUS_RPC = 'rpc_get_co_bet_status' as const;

export const EW_E10_RECOMMEND_MISSIONS_RPC = 'rpc_recommend_missions' as const;

export const EW_E10_NEW_ENGINE_FEATURES = [
  'krw_deposit_proof',
  'mission_chains',
  'co_bet',
  'ml_mission_recommend',
] as const;

/** EXISTS KRW rails · E7 co-mission/whale — remigration 0. */
export const EW_E10_EXISTS_FEATURES = [
  'krw_deposit_create_match_rails',
  'co_mission_sessions',
  'whale_deposit_1m',
  'mission_catalog',
] as const;

/** UI live deferred to Admin/UI/GATE todos (except Kakao augment = E10 growth UI). */
export const EW_E10_DEFERRED_FEATURES = [
  'krw_proof_upload_ui_live',
  'mission_chain_hub_ui_live',
  'co_bet_sports_ui_live',
  'ml_recommend_carousel_ui_live',
  'system_status_page',
] as const;

export const EW_E10_PLATFORM_ARTIFACT_PATHS = [
  EW_E10_PLATFORM_ADR_PATH,
  'supabase/migrations/20260813000001_ew_e10_platform_engine.sql',
  'supabase/tests/ew_e10_platform_engine_test.sql',
  'apps/web/src/domain/ew-e10-platform-engine-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e10-platform-engine-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E10_PLATFORM.md',
] as const;

export const EW_E10_PLATFORM_MIGRATION_IN_THIS_TODO = true as const;
export const EW_E10_LIVE_UI_SAME_PR_FORBIDDEN = true as const;
export const EW_E10_AD_SURVEY_MISSIONS_FORBIDDEN = true as const;
export const EW_E10_PROOF_REVIEW_CREDITS_FORBIDDEN = true as const;

/** Engine RPCs ready (WAVE). User/admin hubs still gated. */
export function isEwE10PlatformEngineReady(): boolean {
  return (
    EW_E10_ATTACH_KRW_PROOF_RPC === 'rpc_attach_krw_deposit_proof' &&
    EW_E10_ADMIN_REVIEW_KRW_PROOF_RPC === 'rpc_admin_review_krw_deposit_proof' &&
    EW_E10_LIST_MISSION_CHAINS_RPC === 'rpc_list_mission_chains' &&
    EW_E10_INVITE_CO_BET_RPC === 'rpc_invite_co_bet' &&
    EW_E10_RECOMMEND_MISSIONS_RPC === 'rpc_recommend_missions' &&
    LAUNCH_GATES.platformEngine === true
  );
}

export function isEwE10PlatformUiUnlocked(): boolean {
  return (
    LAUNCH_GATES.krwDepositProofLive ||
    LAUNCH_GATES.missionChainsLive ||
    LAUNCH_GATES.coBetLive ||
    LAUNCH_GATES.mlMissionRecommendLive ||
    LAUNCH_GATES.kakaoShareSdkLive ||
    LAUNCH_GATES.appInstallMissionLive
  );
}

export function assertEwE10PlatformWaveSync(): void {
  if (EW_E10_PLATFORM_TODO !== 'ew-e10-platform-engine-wave') {
    throw new Error('E10 todo id drift');
  }
  if (EW_E10_PLATFORM_PREREQUISITE_TODO !== 'ew-e9-gate-identity-support') {
    throw new Error('E10 prerequisite must be ew-e9-gate-identity-support');
  }
  if (EW_E10_PLATFORM_NEXT_TODO !== 'ew-e10-page-admin-krw-proof-review') {
    throw new Error('E10 next must be ew-e10-page-admin-krw-proof-review');
  }
  if (EW_E10_PLATFORM_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E10 must ship platform migration in this todo');
  }
  if (EW_E10_LIVE_UI_SAME_PR_FORBIDDEN !== true) {
    throw new Error('E10 WAVE must not unlock proof/chain/co-bet UI in same PR');
  }
  if (EW_E10_AD_SURVEY_MISSIONS_FORBIDDEN !== true) {
    throw new Error('E10 must forbid ad/survey missions');
  }
  if (EW_E10_PROOF_REVIEW_CREDITS_FORBIDDEN !== true) {
    throw new Error('E10 proof review must not credit wallet');
  }
  if (EW_E10_NEW_ENGINE_FEATURES.length !== 4) {
    throw new Error('E10 NEW features must be 4 axes');
  }
  if (!isEwE10PlatformEngineReady()) {
    throw new Error('E10 engine RPCs / launch gate not ready');
  }
  // WAVE shipped with UI gated; M-21 `audit-r2d-krw-proof-wire` unlocks upload.
  if (LAUNCH_GATES.krwDepositProofLive !== true) {
    throw new Error('M-21 unlock requires krwDepositProofLive=true');
  }
  if (LAUNCH_GATES.missionChainsLive !== false) {
    throw new Error('E10 WAVE must keep missionChainsLive=false');
  }
  if (LAUNCH_GATES.coBetLive !== false) {
    throw new Error('E10 WAVE must keep coBetLive=false');
  }
  if (LAUNCH_GATES.mlMissionRecommendLive !== false) {
    throw new Error('E10 WAVE must keep mlMissionRecommendLive=false');
  }
}
