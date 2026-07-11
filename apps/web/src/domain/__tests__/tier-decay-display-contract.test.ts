import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  TIER_DECAY_ADR_PATH,
  TIER_DECAY_ARTIFACT_PATHS,
  TIER_DECAY_DIAMOND_GRACE_DAYS,
  TIER_DECAY_FLOOR_TIER,
  TIER_DECAY_GRACE_DAYS,
  TIER_DECAY_MAINTENANCE_THRESHOLDS,
  TIER_DECAY_MAX_DROP_STEPS,
  TIER_DECAY_MIGRATION_IN_THIS_TODO,
  TIER_DECAY_MIGRATION_NAME,
  TIER_DECAY_NEXT_TODO,
  TIER_DECAY_PREREQUISITE_TODO,
  TIER_DECAY_RUN_RPC,
  TIER_DECAY_STATUS_RPC,
  TIER_DECAY_TODO,
  TIER_DECAY_WARN_DAYS,
  TIER_DECAY_WARNING_EVENT,
  assertTierDecayWaveSync,
} from '../tier-decay-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('tier-decay-display-contract (E1)', () => {
  it('pins WAVE todo ids and Closed Beta policy', () => {
    assertTierDecayWaveSync();
    expect(TIER_DECAY_TODO).toBe('ew-e1-decay-wave');
    expect(TIER_DECAY_PREREQUISITE_TODO).toBe('ew-e0-adr-approval');
    expect(TIER_DECAY_NEXT_TODO).toBe('ew-e1-gate-decay');
    expect(TIER_DECAY_GRACE_DAYS).toBe(45);
    expect(TIER_DECAY_DIAMOND_GRACE_DAYS).toBe(60);
    expect(TIER_DECAY_MAX_DROP_STEPS).toBe(1);
    expect([...TIER_DECAY_WARN_DAYS]).toEqual([30, 15, 7, 3]);
    expect(TIER_DECAY_FLOOR_TIER).toBe('bronze');
    expect(TIER_DECAY_MIGRATION_IN_THIS_TODO).toBe(true);
    expect(TIER_DECAY_MAINTENANCE_THRESHOLDS.silver.krw).toBe(100_000);
    expect(TIER_DECAY_MAINTENANCE_THRESHOLDS.diamond.usdtVolume).toBe(50_000);
  });

  it('requires ADR + migration + SQL test artifacts', () => {
    for (const rel of TIER_DECAY_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(TIER_DECAY_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain('45');
    expect(adr).toContain('최대 1단계');
    expect(adr).toContain(TIER_DECAY_TODO);

    const migration = readRepo('supabase/migrations/20260801000001_ew_e1_tier_decay.sql');
    expect(migration).toContain(TIER_DECAY_MIGRATION_NAME);
    expect(migration).toContain(TIER_DECAY_RUN_RPC);
    expect(migration).toContain(TIER_DECAY_STATUS_RPC);
    expect(migration).toContain(TIER_DECAY_WARNING_EVENT);
    expect(migration).toContain('tier_keep_status');
    expect(migration).toContain('phonara_tier_decay_daily');
    expect(migration).toContain("'45'");
    expect(migration).toContain("'60'");

    const sqlTest = readRepo('supabase/tests/ew_e1_tier_decay_test.sql');
    expect(sqlTest).toContain('E1-0');
    expect(sqlTest).toContain('E1-1');
    expect(sqlTest).toContain('E1-2');
    expect(sqlTest).toContain('E1-3');
    expect(sqlTest).toContain('E1-4');
  });
});
