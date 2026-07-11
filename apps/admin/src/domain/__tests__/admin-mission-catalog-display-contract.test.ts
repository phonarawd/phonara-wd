import { describe, expect, it } from 'vitest';

import {
  ADMIN_MISSION_CATALOG_GATE_TODO,
  ADMIN_MISSION_CATALOG_LIST_RPC,
  ADMIN_MISSION_CATALOG_ROUTE,
  ADMIN_MISSION_CATALOG_TODO,
  ADMIN_MISSION_CATALOG_UPSERT_RPC,
  ADMIN_MISSION_CATALOG_WRITE_PATH_READY,
  ADMIN_MISSION_CATALOG_WRITE_UI_UNLOCKED,
  assertAdminMissionCatalogWritePath,
} from '../admin-mission-catalog-display-contract';

describe('admin-mission-catalog-display-contract (E2 GATE)', () => {
  it('pins write path ready · UI unlocked after GATE', () => {
    assertAdminMissionCatalogWritePath();
    expect(ADMIN_MISSION_CATALOG_TODO).toBe('ew-e2-missions-wave');
    expect(ADMIN_MISSION_CATALOG_GATE_TODO).toBe('ew-e2-gate-missions');
    expect(ADMIN_MISSION_CATALOG_LIST_RPC).toBe('rpc_admin_list_mission_catalog');
    expect(ADMIN_MISSION_CATALOG_UPSERT_RPC).toBe('rpc_admin_upsert_mission_catalog');
    expect(ADMIN_MISSION_CATALOG_ROUTE).toBe('/earn/missions');
    expect(ADMIN_MISSION_CATALOG_WRITE_PATH_READY).toBe(true);
    expect(ADMIN_MISSION_CATALOG_WRITE_UI_UNLOCKED).toBe(true);
  });
});
