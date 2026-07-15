import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertEwE10PlatformWorldClassGateSync,
  EW_E10_PLATFORM_WORLD_CLASS_GATE_ARTIFACT_PATHS,
  EW_E10_PLATFORM_WORLD_CLASS_GATE_PREREQUISITE_TODO,
  EW_E10_PLATFORM_WORLD_CLASS_GATE_SQL_TESTS,
  EW_E10_PLATFORM_WORLD_CLASS_GATE_TEST_PATHS,
  EW_E10_PLATFORM_WORLD_CLASS_GATE_TODO,
  EW_E10_PLATFORM_WORLD_CLASS_GAP_REGISTER,
  EW_E10_PLATFORM_WORLD_CLASS_REMOTE_MIGRATIONS,
  EW_E10_PLATFORM_WORLD_CLASS_SECTION32_CANON_PATHS,
  isEwE10PlatformWorldClassGateReady,
} from '../ew-e10-gate-platform-world-class-display-contract';
import { isEwE10GrowthUiUnlocked } from '../ew-e10-growth-ui-display-contract';
import { isEwE10TrustSupportUiUnlocked } from '../ew-e10-trust-support-ui-display-contract';
import { isEwE10WalletSettingsUiUnlocked } from '../ew-e10-wallet-settings-ui-display-contract';
import { isEwE8FinancialGateReady } from '../ew-e8-gate-financial-display-contract';
import { isEwE9IdentityGateReady } from '../ew-e9-gate-identity-support-display-contract';
import { isEwE10PlatformEngineReady } from '../ew-e10-platform-engine-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e10-gate-platform-world-class-display-contract (E10 GATE)', () => {
  it('pins GATE todo · growth-ui prerequisite · E8–E10 ladder ready', () => {
    expect(EW_E10_PLATFORM_WORLD_CLASS_GATE_TODO).toBe('ew-e10-gate-platform-world-class');
    expect(EW_E10_PLATFORM_WORLD_CLASS_GATE_PREREQUISITE_TODO).toBe('ew-e10-growth-ui');
    expect(isEwE8FinancialGateReady()).toBe(true);
    expect(isEwE9IdentityGateReady()).toBe(true);
    expect(isEwE10PlatformEngineReady()).toBe(true);
    expect(isEwE10WalletSettingsUiUnlocked()).toBe(true);
    expect(isEwE10TrustSupportUiUnlocked()).toBe(true);
    expect(isEwE10GrowthUiUnlocked()).toBe(true);
    expect(isEwE10PlatformWorldClassGateReady()).toBe(true);
    expect(() => assertEwE10PlatformWorldClassGateSync()).not.toThrow();
  });

  it('closes §12.18 E8–E10 gap register (ad/survey permanent_skip only)', () => {
    const skips = EW_E10_PLATFORM_WORLD_CLASS_GAP_REGISTER.filter(
      (r) => r.status === 'permanent_skip',
    ).map((r) => r.id);
    expect(skips).toEqual(['ad_watch_mission', 'survey_mission']);
    const unresolved = EW_E10_PLATFORM_WORLD_CLASS_GAP_REGISTER.filter(
      (r) => r.status !== 'engine_ready' && r.status !== 'ui_live' && r.status !== 'permanent_skip',
    );
    expect(unresolved).toHaveLength(0);
    expect(EW_E10_PLATFORM_WORLD_CLASS_GAP_REGISTER.length).toBeGreaterThanOrEqual(14);
  });

  it('requires GATE artifacts · E8+E9+E10 SQL · remote migrations · §32 canon', () => {
    for (const rel of EW_E10_PLATFORM_WORLD_CLASS_GATE_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E10_PLATFORM_WORLD_CLASS_GATE_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of EW_E10_PLATFORM_WORLD_CLASS_SECTION32_CANON_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    for (const sqlPath of EW_E10_PLATFORM_WORLD_CLASS_GATE_SQL_TESTS) {
      const sql = readRepo(sqlPath);
      expect(sql.length).toBeGreaterThan(100);
      if (sqlPath.includes('e8')) {
        expect(sql).toContain('E8-0');
        expect(sql).toContain('rpc_transfer_to_user');
      }
      if (sqlPath.includes('e9')) {
        expect(sql).toContain('E9-0');
        expect(sql).toContain('rpc_create_support_ticket');
      }
      if (sqlPath.includes('e10')) {
        expect(sql).toContain('E10-0');
        expect(sql).toContain('rpc_attach_krw_deposit_proof');
        expect(sql).toContain('rpc_recommend_missions');
      }
    }

    for (const row of EW_E10_PLATFORM_WORLD_CLASS_REMOTE_MIGRATIONS) {
      expect(row.name.length).toBeGreaterThan(3);
      expect(row.tail).toContain(row.name);
    }

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E10_GATE_PLATFORM_WORLD_CLASS.md');
    expect(ops).toContain(EW_E10_PLATFORM_WORLD_CLASS_GATE_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
    expect(ops).toContain('test:engine');
    expect(ops).toContain('test:sql');
    expect(ops).toContain('ew-e10-growth-ui');
    expect(ops).toContain('§12.18');
    expect(ops).toContain('§32');
  });
});
