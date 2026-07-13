/**
 * E7 Social co-mission + whale wave pin (YAML #252).
 * Authority: docs/PRODUCT/ADR/014-social-co-mission.md · Plan `ew-e7-social-wave`
 *
 * Same-PR WAVE: ADR + co/whale RPCs + SQL test.
 * Social missions UI unlock = `ew-e7-gate-engine-wave` (LAUNCH_GATES.socialMissionsLive).
 */

import { LAUNCH_GATES } from '../lib/launch-gates';

export const SOCIAL_CO_MISSION_TODO = 'ew-e7-social-wave' as const;
export const SOCIAL_CO_MISSION_PREREQUISITE_TODO = 'ew-e6-gate-admin-desks' as const;
export const SOCIAL_CO_MISSION_NEXT_TODO = 'ew-e7-gate-engine-wave' as const;

export const SOCIAL_CO_MISSION_ADR_PATH = 'docs/PRODUCT/ADR/014-social-co-mission.md' as const;
export const SOCIAL_CO_MISSION_MIGRATION_NAME = 'ew_e7_social_co_mission' as const;

export const SOCIAL_CO_MISSION_INVITE_RPC = 'rpc_invite_co_mission' as const;
export const SOCIAL_CO_MISSION_ACCEPT_RPC = 'rpc_accept_co_mission' as const;
export const SOCIAL_CO_MISSION_COMPLETE_RPC = 'rpc_complete_co_mission' as const;
export const SOCIAL_CO_MISSION_STATUS_RPC = 'rpc_get_co_mission_status' as const;
export const WHALE_MISSION_CLAIM_RPC = 'rpc_claim_whale_mission' as const;
export const WHALE_MISSION_STATUS_RPC = 'rpc_get_whale_mission_status' as const;

export const SOCIAL_CO_MISSION_CODES = ['co_share_referral'] as const;
export const WHALE_MISSION_CODES = ['whale_deposit_1m'] as const;

export const SOCIAL_CO_MISSION_REWARD_REASON = 'co_mission_reward' as const;
export const WHALE_MISSION_REWARD_REASON = 'whale_mission_reward' as const;

/** Permanent exclusions — must never appear in E7 social catalog. */
export const SOCIAL_CO_MISSION_FORBIDDEN_CODES = [
  'ad_watch_mission',
  'survey_mission',
  'ad_watch',
  'survey',
  'co_bet',
] as const;

export const SOCIAL_CO_MISSION_ARTIFACT_PATHS = [
  SOCIAL_CO_MISSION_ADR_PATH,
  'supabase/migrations/20260807000001_ew_e7_social_co_mission.sql',
  'supabase/tests/ew_e7_social_co_mission_test.sql',
  'apps/web/src/domain/social-co-mission-display-contract.ts',
  'apps/web/src/domain/__tests__/social-co-mission-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E7_SOCIAL.md',
  'docs/OPERATIONS/ENGINE_GAP_E7_GATE_ENGINE_WAVE.md',
] as const;

export const SOCIAL_CO_MISSION_TEST_PATHS = [
  'apps/web/src/domain/__tests__/social-co-mission-display-contract.test.ts',
] as const;

/** E7 ships migration — ADR + engine same PR. */
export const SOCIAL_CO_MISSION_MIGRATION_IN_THIS_TODO = true as const;

/** Engine RPCs ready (WAVE). */
export function isSocialCoMissionEngineReady(): boolean {
  return (
    SOCIAL_CO_MISSION_INVITE_RPC === 'rpc_invite_co_mission' &&
    SOCIAL_CO_MISSION_COMPLETE_RPC === 'rpc_complete_co_mission' &&
    WHALE_MISSION_CLAIM_RPC === 'rpc_claim_whale_mission' &&
    LAUNCH_GATES.socialCoMissionEngine === true
  );
}

/** UI unlock — owned by GATE `ew-e7-gate-engine-wave`. */
export function isSocialMissionsLiveUnlocked(): boolean {
  return LAUNCH_GATES.socialMissionsLive;
}

export function assertSocialCoMissionWaveSync(): void {
  if (SOCIAL_CO_MISSION_TODO !== 'ew-e7-social-wave') {
    throw new Error('E7 todo id drift');
  }
  if (SOCIAL_CO_MISSION_PREREQUISITE_TODO !== 'ew-e6-gate-admin-desks') {
    throw new Error('E7 prerequisite must be ew-e6-gate-admin-desks');
  }
  if (SOCIAL_CO_MISSION_NEXT_TODO !== 'ew-e7-gate-engine-wave') {
    throw new Error('E7 next must be ew-e7-gate-engine-wave');
  }
  if (SOCIAL_CO_MISSION_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E7 must ship migration in this todo');
  }
  if (SOCIAL_CO_MISSION_CODES.length !== 1 || SOCIAL_CO_MISSION_CODES[0] !== 'co_share_referral') {
    throw new Error('E7 Closed Beta co-mission seed must be co_share_referral only');
  }
  if (WHALE_MISSION_CODES.length !== 1 || WHALE_MISSION_CODES[0] !== 'whale_deposit_1m') {
    throw new Error('E7 Closed Beta whale seed must be whale_deposit_1m only');
  }
  if (!SOCIAL_CO_MISSION_FORBIDDEN_CODES.includes('ad_watch_mission')) {
    throw new Error('E7 must forbid ad_watch_mission');
  }
  if (!SOCIAL_CO_MISSION_FORBIDDEN_CODES.includes('survey_mission')) {
    throw new Error('E7 must forbid survey_mission');
  }
  if (!isSocialCoMissionEngineReady()) {
    throw new Error('E7 engine RPCs / launch gate not ready');
  }
}
