/**
 * E2 Missions GATE pin (YAML #243).
 * Authority: Plan `ew-e2-gate-missions` · ADR-011 · `/admin/earn/missions` write unlock.
 *
 * GATE does not re-ship catalog RPC — asserts wave green · remote apply ·
 * advisor 0 · admin write UI unlock · launch gate.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  MISSION_CATALOG_ARTIFACT_PATHS,
  MISSION_CATALOG_LIST_RPC,
  MISSION_CATALOG_MIGRATION_NAME,
  MISSION_CATALOG_NEXT_TODO,
  MISSION_CATALOG_TODO,
  MISSION_CATALOG_UPSERT_RPC,
  assertMissionCatalogWaveSync,
  isAdminMissionsWriteUnlocked,
  isMissionCatalogWritePathReady,
} from './mission-catalog-display-contract';

export const EW_E2_GATE_MISSIONS_TODO = 'ew-e2-gate-missions' as const;
export const EW_E2_GATE_MISSIONS_PREREQUISITE_TODO = MISSION_CATALOG_TODO;
export const EW_E2_GATE_MISSIONS_NEXT_TODO = 'ew-e3-viral-cms-wave' as const;

export const EW_E2_GATE_MISSIONS_UNLOCK_ROUTE = '/earn/missions' as const;

export const EW_E2_GATE_MISSIONS_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e2-gate-missions-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e2-gate-missions-display-contract.test.ts',
  'apps/web/src/domain/mission-catalog-display-contract.ts',
  'apps/web/src/lib/launch-gates.ts',
  'apps/admin/src/domain/admin-mission-catalog-display-contract.ts',
  'apps/admin/src/product/surfaces/admin-earn-missions-page.tsx',
  'apps/admin/src/hooks/admin/useAdminMissionsDesk.ts',
  'docs/PRODUCT/ADR/011-mission-catalog.md',
  'docs/OPERATIONS/ENGINE_GAP_E2_MISSIONS.md',
  'docs/OPERATIONS/ENGINE_GAP_E2_GATE_MISSIONS.md',
  'supabase/migrations/20260802000001_ew_e2_mission_catalog.sql',
  'supabase/tests/ew_e2_mission_catalog_test.sql',
] as const;

export const EW_E2_GATE_MISSIONS_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e2-gate-missions-display-contract.test.ts',
  'apps/web/src/domain/__tests__/mission-catalog-display-contract.test.ts',
  'apps/admin/src/domain/__tests__/admin-mission-catalog-display-contract.test.ts',
  'apps/admin/src/product/surfaces/__tests__/admin-earn-missions-page.test.tsx',
] as const;

/** Remote migration name parity (Management API timestamp may differ). */
export const EW_E2_GATE_MISSIONS_REMOTE_MIGRATION_NAME = MISSION_CATALOG_MIGRATION_NAME;

export function isAdminMissionsWriteFullyUnlocked(): boolean {
  return (
    LAUNCH_GATES.missionCatalogEngine === true &&
    LAUNCH_GATES.missionCatalogWrite === true &&
    isMissionCatalogWritePathReady() &&
    isAdminMissionsWriteUnlocked()
  );
}

export function assertEwE2GateMissionsSync(): void {
  assertMissionCatalogWaveSync();

  if (EW_E2_GATE_MISSIONS_TODO !== 'ew-e2-gate-missions') {
    throw new Error('E2 GATE todo id drift');
  }
  if (EW_E2_GATE_MISSIONS_PREREQUISITE_TODO !== 'ew-e2-missions-wave') {
    throw new Error('E2 GATE prerequisite must be ew-e2-missions-wave');
  }
  if (EW_E2_GATE_MISSIONS_NEXT_TODO !== 'ew-e3-viral-cms-wave') {
    throw new Error('E2 GATE next must be ew-e3-viral-cms-wave');
  }
  if (MISSION_CATALOG_NEXT_TODO !== 'ew-e2-gate-missions') {
    throw new Error('E2 WAVE next must unlock ew-e2-gate-missions');
  }
  if (EW_E2_GATE_MISSIONS_UNLOCK_ROUTE !== '/earn/missions') {
    throw new Error('E2 GATE unlock route must be /earn/missions');
  }
  if (MISSION_CATALOG_LIST_RPC !== 'rpc_admin_list_mission_catalog') {
    throw new Error('E2 GATE list RPC drift');
  }
  if (MISSION_CATALOG_UPSERT_RPC !== 'rpc_admin_upsert_mission_catalog') {
    throw new Error('E2 GATE upsert RPC drift');
  }
  if (!isAdminMissionsWriteFullyUnlocked()) {
    throw new Error('E2 GATE /admin/earn/missions write unlock not live');
  }
  if (MISSION_CATALOG_ARTIFACT_PATHS.length < 5) {
    throw new Error('E2 WAVE artifacts missing');
  }
}
