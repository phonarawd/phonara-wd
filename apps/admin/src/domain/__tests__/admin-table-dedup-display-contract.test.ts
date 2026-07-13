import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  ADMIN_TABLE_DESK_SURFACE_PATHS,
  ADMIN_TABLE_FORBIDDEN_LOADING_TABLE,
  ADMIN_TABLE_IMPORT_MARKER,
  ADMIN_TABLE_NATIVE_OPEN_TAG,
  ADMIN_TABLE_PRIMITIVE_PATH,
  assertP2GateAdminTableDedupSync,
  P2_ADMIN_TABLE_PRIMITIVE_TODO,
  P2_GATE_ADMIN_TABLE_DEDUP_ARTIFACT_PATHS,
  P2_GATE_ADMIN_TABLE_DEDUP_PREREQUISITE_TODOS,
  P2_GATE_ADMIN_TABLE_DEDUP_TEST_PATHS,
  P2_GATE_ADMIN_TABLE_DEDUP_TODO,
} from '../admin-table-dedup-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');
const ADMIN_SRC = resolve(REPO_ROOT, 'apps/admin/src');

function collectTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      out.push(...collectTsxFiles(full));
      continue;
    }
    if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('admin-table-dedup-display-contract §29.6 · YAML #207', () => {
  it('registers GATE todo · prerequisite primitive · 23 desks', () => {
    expect(P2_GATE_ADMIN_TABLE_DEDUP_TODO).toBe('p2-gate-admin-table-dedup');
    expect(P2_ADMIN_TABLE_PRIMITIVE_TODO).toBe('p2-admin-table-primitive');
    expect(P2_GATE_ADMIN_TABLE_DEDUP_PREREQUISITE_TODOS).toEqual([P2_ADMIN_TABLE_PRIMITIVE_TODO]);
    expect(ADMIN_TABLE_DESK_SURFACE_PATHS).toHaveLength(23);
    expect(ADMIN_TABLE_DESK_SURFACE_PATHS).toContain(
      'apps/admin/src/product/surfaces/admin-earn-activity-page.tsx',
    );
    expect(() => assertP2GateAdminTableDedupSync()).not.toThrow();
  });

  it('requires GATE artifacts and owner test paths on disk', () => {
    for (const rel of P2_GATE_ADMIN_TABLE_DEDUP_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of P2_GATE_ADMIN_TABLE_DEDUP_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('keeps a single AdminTable primitive with tanstack table', () => {
    const src = readFileSync(resolve(REPO_ROOT, ADMIN_TABLE_PRIMITIVE_PATH), 'utf8');
    expect(src).toContain('@tanstack/react-table');
    expect(src).toContain('export function AdminTable');
    expect(src).toContain(ADMIN_TABLE_NATIVE_OPEN_TAG);
  });

  it('requires every desk list surface to import AdminTable', () => {
    for (const rel of ADMIN_TABLE_DESK_SURFACE_PATHS) {
      const src = readFileSync(resolve(REPO_ROOT, rel), 'utf8');
      expect(src, rel).toContain(ADMIN_TABLE_IMPORT_MARKER);
      expect(src, rel).toContain('<AdminTable');
    }
  });

  it('forbids native <table> and LoadingTable outside the AdminTable primitive', () => {
    const primitiveAbs = resolve(REPO_ROOT, ADMIN_TABLE_PRIMITIVE_PATH);
    const files = collectTsxFiles(ADMIN_SRC);
    const nativeHits: string[] = [];
    const loadingHits: string[] = [];

    for (const file of files) {
      if (file === primitiveAbs) continue;
      // Contract + tests may mention forbidden tokens as string literals.
      if (file.includes(`${join('domain', 'admin-table-dedup')}`)) continue;
      if (file.includes(`${join('domain', '__tests__', 'admin-table-dedup')}`)) continue;
      if (file.includes(`${join('domain', 'ew-e6-gate-admin-desks')}`)) continue;
      if (file.includes(`${join('domain', '__tests__', 'ew-e6-gate-admin-desks')}`)) continue;

      const src = readFileSync(file, 'utf8');
      if (src.includes(ADMIN_TABLE_NATIVE_OPEN_TAG)) {
        nativeHits.push(file.replace(REPO_ROOT + '\\', '').replace(REPO_ROOT + '/', ''));
      }
      if (src.includes(ADMIN_TABLE_FORBIDDEN_LOADING_TABLE)) {
        loadingHits.push(file.replace(REPO_ROOT + '\\', '').replace(REPO_ROOT + '/', ''));
      }
    }

    expect(nativeHits, `native <table> residue:\n${nativeHits.join('\n')}`).toEqual([]);
    expect(loadingHits, `LoadingTable residue:\n${loadingHits.join('\n')}`).toEqual([]);
  });
});
