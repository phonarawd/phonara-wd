import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  EW_E2_GATE_MISSIONS_ARTIFACT_PATHS,
  EW_E2_GATE_MISSIONS_NEXT_TODO,
  EW_E2_GATE_MISSIONS_PREREQUISITE_TODO,
  EW_E2_GATE_MISSIONS_REMOTE_MIGRATION_NAME,
  EW_E2_GATE_MISSIONS_TEST_PATHS,
  EW_E2_GATE_MISSIONS_TODO,
  EW_E2_GATE_MISSIONS_UNLOCK_ROUTE,
  assertEwE2GateMissionsSync,
  isAdminMissionsWriteFullyUnlocked,
} from '../ew-e2-gate-missions-display-contract';
import {
  MISSION_CATALOG_NEXT_TODO,
  MISSION_CATALOG_TODO,
  isAdminMissionsWriteUnlocked,
} from '../mission-catalog-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e2-gate-missions-display-contract (E2 GATE)', () => {
  it('pins GATE todo · wave prerequisite · next E3 wave', () => {
    expect(EW_E2_GATE_MISSIONS_TODO).toBe('ew-e2-gate-missions');
    expect(EW_E2_GATE_MISSIONS_PREREQUISITE_TODO).toBe(MISSION_CATALOG_TODO);
    expect(EW_E2_GATE_MISSIONS_NEXT_TODO).toBe('ew-e3-viral-cms-wave');
    expect(MISSION_CATALOG_NEXT_TODO).toBe('ew-e2-gate-missions');
    expect(EW_E2_GATE_MISSIONS_UNLOCK_ROUTE).toBe('/earn/missions');
    expect(EW_E2_GATE_MISSIONS_REMOTE_MIGRATION_NAME).toBe('ew_e2_mission_catalog');
    expect(() => assertEwE2GateMissionsSync()).not.toThrow();
  });

  it('unlocks /admin/earn/missions write with launch gates + catalog RPCs', () => {
    expect(isAdminMissionsWriteFullyUnlocked()).toBe(true);
    expect(isAdminMissionsWriteUnlocked()).toBe(true);
    expect(LAUNCH_GATES.missionCatalogEngine).toBe(true);
    expect(LAUNCH_GATES.missionCatalogWrite).toBe(true);
  });

  it('requires GATE artifacts on disk · write UI wired', () => {
    for (const rel of EW_E2_GATE_MISSIONS_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E2_GATE_MISSIONS_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const adminContract = readRepo(
      'apps/admin/src/domain/admin-mission-catalog-display-contract.ts',
    );
    expect(adminContract).toContain('ADMIN_MISSION_CATALOG_WRITE_UI_UNLOCKED = true');

    const page = readRepo('apps/admin/src/product/surfaces/admin-earn-missions-page.tsx');
    expect(page).toContain('writeUiUnlocked');
    expect(page).toContain('upsertMission');
    expect(page).toContain('AdminQueueActionDialog');
    expect(page).toContain('admin-missions-edit');

    const hook = readRepo('apps/admin/src/hooks/admin/useAdminMissionsDesk.ts');
    expect(hook).toContain('ADMIN_MISSION_CATALOG_WRITE_UI_UNLOCKED');
    expect(hook).toContain('upsertMission');

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E2_GATE_MISSIONS.md');
    expect(ops).toContain(EW_E2_GATE_MISSIONS_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
    expect(ops).toContain('write');
  });
});
