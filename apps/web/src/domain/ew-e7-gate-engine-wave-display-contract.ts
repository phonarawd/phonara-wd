/**
 * E7 Social GATE pin (YAML #253).
 * Authority: Plan `ew-e7-gate-engine-wave` · ADR-014 · engine verify + UI unlock.
 *
 * GATE does not re-ship co/whale RPC — asserts wave green · remote apply ·
 * advisor 0 · `/home/missions?tab=social` unlock via `socialMissionsLive`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  SOCIAL_CO_MISSION_ARTIFACT_PATHS,
  SOCIAL_CO_MISSION_COMPLETE_RPC,
  SOCIAL_CO_MISSION_INVITE_RPC,
  SOCIAL_CO_MISSION_MIGRATION_NAME,
  SOCIAL_CO_MISSION_NEXT_TODO,
  SOCIAL_CO_MISSION_STATUS_RPC,
  SOCIAL_CO_MISSION_TODO,
  WHALE_MISSION_CLAIM_RPC,
  WHALE_MISSION_STATUS_RPC,
  assertSocialCoMissionWaveSync,
  isSocialCoMissionEngineReady,
  isSocialMissionsLiveUnlocked,
} from './social-co-mission-display-contract';

export const EW_E7_GATE_ENGINE_WAVE_TODO = 'ew-e7-gate-engine-wave' as const;
export const EW_E7_GATE_ENGINE_WAVE_PREREQUISITE_TODO = SOCIAL_CO_MISSION_TODO;
export const EW_E7_GATE_ENGINE_WAVE_NEXT_TODO = 'ew-e21-trade-parity-wave' as const;

export const EW_E7_GATE_ENGINE_WAVE_UNLOCK_ROUTE = '/home/missions' as const;
export const EW_E7_GATE_ENGINE_WAVE_UNLOCK_TAB = 'social' as const;

export const EW_E7_GATE_ENGINE_WAVE_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e7-gate-engine-wave-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e7-gate-engine-wave-display-contract.test.ts',
  'apps/web/src/domain/social-co-mission-display-contract.ts',
  'apps/web/src/lib/launch-gates.ts',
  'docs/PRODUCT/ADR/014-social-co-mission.md',
  'docs/OPERATIONS/ENGINE_GAP_E7_SOCIAL.md',
  'docs/OPERATIONS/ENGINE_GAP_E7_GATE_ENGINE_WAVE.md',
  'supabase/migrations/20260807000001_ew_e7_social_co_mission.sql',
  'supabase/tests/ew_e7_social_co_mission_test.sql',
] as const;

export const EW_E7_GATE_ENGINE_WAVE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e7-gate-engine-wave-display-contract.test.ts',
  'apps/web/src/domain/__tests__/social-co-mission-display-contract.test.ts',
] as const;

/** Remote migration name parity (Management API timestamp may differ). */
export const EW_E7_GATE_ENGINE_WAVE_REMOTE_MIGRATION_NAME = SOCIAL_CO_MISSION_MIGRATION_NAME;

export function isSocialMissionsFullyUnlocked(): boolean {
  return (
    LAUNCH_GATES.socialCoMissionEngine === true &&
    LAUNCH_GATES.socialMissionsLive === true &&
    isSocialCoMissionEngineReady() &&
    isSocialMissionsLiveUnlocked() &&
    SOCIAL_CO_MISSION_INVITE_RPC === 'rpc_invite_co_mission' &&
    SOCIAL_CO_MISSION_COMPLETE_RPC === 'rpc_complete_co_mission' &&
    SOCIAL_CO_MISSION_STATUS_RPC === 'rpc_get_co_mission_status' &&
    WHALE_MISSION_CLAIM_RPC === 'rpc_claim_whale_mission' &&
    WHALE_MISSION_STATUS_RPC === 'rpc_get_whale_mission_status'
  );
}

export function assertEwE7GateEngineWaveSync(): void {
  assertSocialCoMissionWaveSync();

  if (EW_E7_GATE_ENGINE_WAVE_TODO !== 'ew-e7-gate-engine-wave') {
    throw new Error('E7 GATE todo id drift');
  }
  if (EW_E7_GATE_ENGINE_WAVE_PREREQUISITE_TODO !== 'ew-e7-social-wave') {
    throw new Error('E7 GATE prerequisite must be ew-e7-social-wave');
  }
  if (EW_E7_GATE_ENGINE_WAVE_NEXT_TODO !== 'ew-e21-trade-parity-wave') {
    throw new Error('E7 GATE next must be ew-e21-trade-parity-wave');
  }
  if (SOCIAL_CO_MISSION_NEXT_TODO !== 'ew-e7-gate-engine-wave') {
    throw new Error('E7 WAVE next must unlock ew-e7-gate-engine-wave');
  }
  if (EW_E7_GATE_ENGINE_WAVE_UNLOCK_ROUTE !== '/home/missions') {
    throw new Error('E7 GATE unlock route must be /home/missions');
  }
  if (EW_E7_GATE_ENGINE_WAVE_UNLOCK_TAB !== 'social') {
    throw new Error('E7 GATE unlock tab must be social');
  }
  if (!isSocialMissionsFullyUnlocked()) {
    throw new Error('E7 GATE /home/missions social unlock not live');
  }
  if (SOCIAL_CO_MISSION_ARTIFACT_PATHS.length < 5) {
    throw new Error('E7 WAVE artifacts missing');
  }
}
