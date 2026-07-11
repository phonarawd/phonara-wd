import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ADMIN_BEGINNER_NAV_LABEL_KEYS } from '../admin-beginner-language-display-contract';
import {
  ADMIN_TABLE_IMPORT_MARKER,
  ADMIN_TABLE_NATIVE_OPEN_TAG,
} from '../admin-table-dedup-display-contract';
import {
  AUDIT_CSV_EXPORT_ENABLED,
  EW_E6_ADMIN_DESKS_TODO,
  EW_E6_ADMIN_DESK_ROUTES,
} from '../ew-e6-admin-desks-display-contract';
import {
  areEwE6AdminTableSurfacesRegistered,
  areEwE6BeginnerNavKeysPinned,
  areEwE6DeskRoutesWired,
  assertEwE6GateAdminDesksSync,
  assertEwE6ReadOnlySurfaceSource,
  EW_E6_GATE_ADMIN_DESKS_ARTIFACT_PATHS,
  EW_E6_GATE_ADMIN_DESKS_NEXT_TODO,
  EW_E6_GATE_ADMIN_DESKS_PREREQUISITE_TODO,
  EW_E6_GATE_ADMIN_DESKS_TEST_PATHS,
  EW_E6_GATE_ADMIN_DESKS_TODO,
  EW_E6_GATE_ADMIN_DESKS_UNLOCK_ROUTES,
  EW_E6_GATE_ADMIN_TABLE_SURFACE_PATHS,
  EW_E6_GATE_READ_ONLY_DESK_ROUTES,
  EW_E6_GATE_READ_ONLY_SURFACE_PATHS,
  EW_E6_GATE_WRITE_DESK_ROUTES,
  isAuditCsvExportFullyUnlocked,
  isEarnActivityReadOnlyUnlocked,
  isEwE6AdminDesksFullyUnlocked,
} from '../ew-e6-gate-admin-desks-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e6-gate-admin-desks-display-contract (E6 GATE)', () => {
  it('pins GATE todo · WAVE prerequisite · next E7 wave', () => {
    expect(EW_E6_GATE_ADMIN_DESKS_TODO).toBe('ew-e6-gate-admin-desks');
    expect(EW_E6_GATE_ADMIN_DESKS_PREREQUISITE_TODO).toBe(EW_E6_ADMIN_DESKS_TODO);
    expect(EW_E6_GATE_ADMIN_DESKS_NEXT_TODO).toBe('ew-e7-social-wave');
    expect([...EW_E6_GATE_ADMIN_DESKS_UNLOCK_ROUTES]).toEqual([...EW_E6_ADMIN_DESK_ROUTES]);
    expect([...EW_E6_GATE_READ_ONLY_DESK_ROUTES]).toEqual([
      '/earn/activity',
      '/tier-benefits',
      '/audit',
    ]);
    expect([...EW_E6_GATE_WRITE_DESK_ROUTES]).toEqual([
      '/promotions',
      '/cms',
      '/casino',
      '/staking',
    ]);
    expect(() => assertEwE6GateAdminDesksSync()).not.toThrow();
  });

  it('unlocks desk routes · §29.5 nav · AdminTable · activity · audit CSV', () => {
    expect(areEwE6DeskRoutesWired()).toBe(true);
    expect(areEwE6BeginnerNavKeysPinned()).toBe(true);
    expect(areEwE6AdminTableSurfacesRegistered()).toBe(true);
    expect(isAuditCsvExportFullyUnlocked()).toBe(true);
    expect(isEarnActivityReadOnlyUnlocked()).toBe(true);
    expect(isEwE6AdminDesksFullyUnlocked()).toBe(true);
    expect(AUDIT_CSV_EXPORT_ENABLED).toBe(true);

    expect(ADMIN_BEGINNER_NAV_LABEL_KEYS['/earn/activity']).toBe('admin.nav.earnActivity');
    expect(ADMIN_BEGINNER_NAV_LABEL_KEYS['/audit']).toBe('admin.nav.audit');
    expect(ADMIN_BEGINNER_NAV_LABEL_KEYS['/tier-benefits']).toBe('admin.nav.tierBenefits');
  });

  it('requires E6 desk surfaces to use AdminTable only', () => {
    for (const rel of EW_E6_GATE_ADMIN_TABLE_SURFACE_PATHS) {
      const src = readRepo(rel);
      expect(src, rel).toContain(ADMIN_TABLE_IMPORT_MARKER);
      expect(src, rel).toContain('<AdminTable');
      expect(src, rel).not.toContain(ADMIN_TABLE_NATIVE_OPEN_TAG);
    }
  });

  it('keeps activity · tier-benefits · audit read-only (no confirm/upsert chrome)', () => {
    for (const rel of EW_E6_GATE_READ_ONLY_SURFACE_PATHS) {
      const src = readRepo(rel);
      expect(() => assertEwE6ReadOnlySurfaceSource(src, rel)).not.toThrow();
    }

    const auditHook = readRepo('apps/admin/src/hooks/admin/useAdminAuditDesk.ts');
    expect(auditHook).toContain('exportAuditCsv');
    expect(auditHook).toContain('at,domain,actionKey,subject,reason');
    expect(auditHook).toContain('phonara-admin-audit.csv');
  });

  it('requires GATE artifacts on disk · unlock docs', () => {
    for (const rel of EW_E6_GATE_ADMIN_DESKS_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E6_GATE_ADMIN_DESKS_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const waveOps = readRepo('docs/OPERATIONS/ENGINE_GAP_E6_ADMIN_DESKS.md');
    expect(waveOps).toContain(EW_E6_ADMIN_DESKS_TODO);
    expect(waveOps).toContain('/earn/activity');
    expect(waveOps).toContain('CSV');

    const gateOps = readRepo('docs/OPERATIONS/ENGINE_GAP_E6_GATE_ADMIN_DESKS.md');
    expect(gateOps).toContain(EW_E6_GATE_ADMIN_DESKS_TODO);
    expect(gateOps).toContain('gate:ai-impl');
    expect(gateOps).toContain('/earn/activity');
    expect(gateOps).toContain('§29.5');
    expect(gateOps).toContain('AdminTable');
    expect(gateOps).toContain('ew-e7-social-wave');
  });
});
