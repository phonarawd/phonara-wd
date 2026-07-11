import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertMissionCatalogWaveSync,
  isAdminMissionsWriteUnlocked,
  isMissionCatalogWritePathReady,
  MISSION_CATALOG_ADR_PATH,
  MISSION_CATALOG_ARTIFACT_PATHS,
  MISSION_CATALOG_AUDIT_ACTION,
  MISSION_CATALOG_EARN_LIMIT_KEYS,
  MISSION_CATALOG_FORBIDDEN_CODES,
  MISSION_CATALOG_LIST_RPC,
  MISSION_CATALOG_MIGRATION_IN_THIS_TODO,
  MISSION_CATALOG_MIGRATION_NAME,
  MISSION_CATALOG_NEXT_TODO,
  MISSION_CATALOG_PREREQUISITE_TODO,
  MISSION_CATALOG_SEED_COUNT,
  MISSION_CATALOG_TODO,
  MISSION_CATALOG_UPSERT_RPC,
  MISSION_CATALOG_VIRAL_KEYS,
} from '../mission-catalog-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('mission-catalog-display-contract (E2)', () => {
  it('pins WAVE todo ids · seed · forbidden codes · write path ready', () => {
    assertMissionCatalogWaveSync();
    expect(MISSION_CATALOG_TODO).toBe('ew-e2-missions-wave');
    expect(MISSION_CATALOG_PREREQUISITE_TODO).toBe('ew-e1-gate-decay');
    expect(MISSION_CATALOG_NEXT_TODO).toBe('ew-e2-gate-missions');
    expect(MISSION_CATALOG_MIGRATION_IN_THIS_TODO).toBe(true);
    expect(MISSION_CATALOG_SEED_COUNT).toBe(11);
    expect(MISSION_CATALOG_VIRAL_KEYS).toHaveLength(5);
    expect(MISSION_CATALOG_EARN_LIMIT_KEYS).toHaveLength(6);
    expect([...MISSION_CATALOG_FORBIDDEN_CODES]).toEqual(
      expect.arrayContaining(['ad_watch_mission', 'survey_mission']),
    );
    expect(isMissionCatalogWritePathReady()).toBe(true);
    // Write UI unlock is owned by GATE (`ew-e2-gate-missions`) via launch gate.
    expect(typeof isAdminMissionsWriteUnlocked()).toBe('boolean');
  });

  it('requires ADR + migration + SQL test artifacts', () => {
    for (const rel of MISSION_CATALOG_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(MISSION_CATALOG_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain(MISSION_CATALOG_TODO);
    expect(adr).toContain('mission_catalog');
    expect(adr).toContain('광고');
    expect(adr).toContain('설문');

    const migration = readRepo(
      'supabase/migrations/20260802000001_ew_e2_mission_catalog.sql',
    );
    expect(migration).toContain(MISSION_CATALOG_MIGRATION_NAME);
    expect(migration).toContain(MISSION_CATALOG_LIST_RPC);
    expect(migration).toContain(MISSION_CATALOG_UPSERT_RPC);
    expect(migration).toContain(MISSION_CATALOG_AUDIT_ACTION);
    expect(migration).toContain('mission_catalog_forbidden');
    expect(migration).toContain('_assert_mission_catalog_claimable');
    expect(migration).toContain('viral:share_referral_link');

    const sqlTest = readRepo('supabase/tests/ew_e2_mission_catalog_test.sql');
    expect(sqlTest).toContain('E2-0');
    expect(sqlTest).toContain('E2-1');
    expect(sqlTest).toContain('E2-2');
    expect(sqlTest).toContain('E2-3');
    expect(sqlTest).toContain('E2-4');
  });
});
