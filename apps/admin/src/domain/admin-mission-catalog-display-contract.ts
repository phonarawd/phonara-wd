/**
 * Admin E2 mission catalog write-path pin.
 * Engine: rpc_admin_list_mission_catalog · rpc_admin_upsert_mission_catalog
 * Write UI unlock = ew-e2-gate-missions (GATE live).
 */

export const ADMIN_MISSION_CATALOG_TODO = 'ew-e2-missions-wave' as const;
export const ADMIN_MISSION_CATALOG_GATE_TODO = 'ew-e2-gate-missions' as const;
export const ADMIN_MISSION_CATALOG_LIST_RPC = 'rpc_admin_list_mission_catalog' as const;
export const ADMIN_MISSION_CATALOG_UPSERT_RPC = 'rpc_admin_upsert_mission_catalog' as const;
export const ADMIN_MISSION_CATALOG_ROUTE = '/earn/missions' as const;

export const ADMIN_MISSION_CATALOG_WRITE_PATH_READY = true as const;
export const ADMIN_MISSION_CATALOG_WRITE_UI_UNLOCKED = true as const;

export function assertAdminMissionCatalogWritePath(): void {
  if (ADMIN_MISSION_CATALOG_LIST_RPC !== 'rpc_admin_list_mission_catalog') {
    throw new Error('admin missions list RPC drift');
  }
  if (ADMIN_MISSION_CATALOG_UPSERT_RPC !== 'rpc_admin_upsert_mission_catalog') {
    throw new Error('admin missions upsert RPC drift');
  }
  if (ADMIN_MISSION_CATALOG_WRITE_PATH_READY !== true) {
    throw new Error('admin missions write path must be ready in E2 WAVE');
  }
  if (ADMIN_MISSION_CATALOG_WRITE_UI_UNLOCKED !== true) {
    throw new Error('admin missions write UI must be unlocked after E2 GATE');
  }
  if (ADMIN_MISSION_CATALOG_GATE_TODO !== 'ew-e2-gate-missions') {
    throw new Error('admin missions GATE todo drift');
  }
}
