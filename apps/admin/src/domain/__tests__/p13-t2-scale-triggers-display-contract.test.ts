import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertP13T2ScaleTriggersSync,
  P13_T2_CHECKLIST_SECTIONS,
  P13_T2_HEDGE_REVIEW,
  P13_T2_OI_TARGETS_BY_BAND,
  P13_T2_OI_UTILIZATION_BY_BAND,
  P13_T2_PER_USER_NOTIONAL_CAPS,
  P13_T2_READ_REPLICA_POLICY,
  P13_T2_SCALE_ARTIFACT_PATHS,
  P13_T2_SCALE_BANDS,
  P13_T2_SCALE_CANON_PATH,
  P13_T2_SCALE_ENGINE_MIGRATION_TOUCH,
  P13_T2_SCALE_GO_PREREQUISITE_TODO,
  P13_T2_SCALE_NEXT_TODO,
  P13_T2_SCALE_PREREQUISITE_TODO,
  P13_T2_SCALE_SPOTCHECK_PATH,
  P13_T2_SCALE_TEST_PATHS,
  P13_T2_SCALE_TODO,
  P13_T2_WEEKLY_SCALE_REVIEW,
  resolveP13T2ScaleBand,
} from '../p13-t2-scale-triggers-display-contract';

const ADMIN_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(ADMIN_SRC, '../../..');

describe('p13-t2-scale-triggers-display-contract · YAML #238 T2', () => {
  it('registers OPS todo · T1 + closeout GO · next E0 · engine touch 0', () => {
    expect(P13_T2_SCALE_TODO).toBe('launch-scale-t2-triggers');
    expect(P13_T2_SCALE_PREREQUISITE_TODO).toBe('launch-ramp-t1-feature-gates');
    expect(P13_T2_SCALE_GO_PREREQUISITE_TODO).toBe('p13-closeout-bundle');
    expect(P13_T2_SCALE_NEXT_TODO).toBe('ew-e0-adr-approval');
    expect(P13_T2_SCALE_ENGINE_MIGRATION_TOUCH).toBe(false);
    expect(() => assertP13T2ScaleTriggersSync()).not.toThrow();
  });

  it('pins 5 checklist sections', () => {
    expect(P13_T2_CHECKLIST_SECTIONS).toEqual([
      'dau_trigger_matrix',
      'per_user_notional_cap',
      'read_replica_review',
      'hedge_review',
      'code_diff_zero',
    ]);
  });

  it('pins DAU bands 500~2K / 2K~10K / 10K+', () => {
    expect(P13_T2_SCALE_BANDS.map((b) => b.label)).toEqual(['500~2K', '2K~10K', '10K+']);
    expect(P13_T2_SCALE_BANDS[0].dauMin).toBe(500);
    expect(P13_T2_SCALE_BANDS[0].dauMaxExclusive).toBe(2_000);
    expect(P13_T2_SCALE_BANDS[1].dauMin).toBe(2_000);
    expect(P13_T2_SCALE_BANDS[1].dauMaxExclusive).toBe(10_000);
    expect(P13_T2_SCALE_BANDS[2].dauMin).toBe(10_000);
    expect(P13_T2_SCALE_BANDS[2].dauMaxExclusive).toBeNull();
    expect(resolveP13T2ScaleBand(0)).toBe('below_s1');
    expect(resolveP13T2ScaleBand(500)).toBe('s1_early');
    expect(resolveP13T2ScaleBand(1_999)).toBe('s1_early');
    expect(resolveP13T2ScaleBand(2_000)).toBe('s2_growth');
    expect(resolveP13T2ScaleBand(9_999)).toBe('s2_growth');
    expect(resolveP13T2ScaleBand(10_000)).toBe('s3_scale');
    expect(resolveP13T2ScaleBand(50_000)).toBe('s3_scale');
  });

  it('pins per-user notional · OI · read replica · hedge review', () => {
    expect(P13_T2_PER_USER_NOTIONAL_CAPS.t1Baseline).toEqual({ krw: 500_000, usdt: 100 });
    expect(P13_T2_PER_USER_NOTIONAL_CAPS.s1_early).toEqual({ krw: 1_000_000, usdt: 200 });
    expect(P13_T2_PER_USER_NOTIONAL_CAPS.s2_growth).toEqual({ krw: 2_000_000, usdt: 500 });
    expect(P13_T2_PER_USER_NOTIONAL_CAPS.s3_scale).toEqual({ krw: 5_000_000, usdt: 2_000 });
    expect(P13_T2_OI_UTILIZATION_BY_BAND.t1BaselinePct).toBe(40);
    expect(P13_T2_OI_UTILIZATION_BY_BAND.s3_scalePct).toBe(80);
    expect(P13_T2_OI_TARGETS_BY_BAND.s1_early.futuresMajorMaxOi).toBe('250000.000000');
    expect(P13_T2_READ_REPLICA_POLICY.s1_early).toBe('primary_only_monitor_cpu');
    expect(P13_T2_READ_REPLICA_POLICY.s2_growth).toBe('enable_read_replica_for_read_heavy');
    expect(P13_T2_READ_REPLICA_POLICY.s3_scale).toBe('replica_ha_plus_compute_upgrade');
    expect(P13_T2_READ_REPLICA_POLICY.forbiddenOnReplica).toContain('wallet_ledger_writes');
    expect(P13_T2_HEDGE_REVIEW.productModel).toBe('b_book_insurance_fund');
    expect(P13_T2_HEDGE_REVIEW.externalVenueHedgeDefault).toBe(false);
    expect(P13_T2_HEDGE_REVIEW.userDualSideUi).toBe('built_hidden_until_e21');
    expect(P13_T2_HEDGE_REVIEW.distinctFromE21UserHedge).toBe(true);
    expect(P13_T2_WEEKLY_SCALE_REVIEW.weekday).toBe('monday');
    expect(P13_T2_WEEKLY_SCALE_REVIEW.timezone).toBe('Asia/Seoul');
  });

  it('requires canon · spotcheck · contract artifacts on disk', () => {
    for (const rel of P13_T2_SCALE_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of P13_T2_SCALE_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('canon pins DAU bands · notional · replica · hedge · todo ids', () => {
    const canon = readFileSync(resolve(REPO_ROOT, P13_T2_SCALE_CANON_PATH), 'utf8');
    expect(canon).toContain('launch-scale-t2-triggers');
    expect(canon).toContain('launch-ramp-t1-feature-gates');
    expect(canon).toContain('p13-closeout-bundle');
    expect(canon).toContain('ew-e0-adr-approval');
    expect(canon).toContain('500~2K');
    expect(canon).toContain('2K~10K');
    expect(canon).toContain('10K+');
    expect(canon).toContain('per-user notional');
    expect(canon).toContain('read replica');
    expect(canon).toContain('hedge');
    expect(canon).toContain('B-book');
    expect(canon).toContain('코드 diff 0');

    const spotcheck = readFileSync(resolve(REPO_ROOT, P13_T2_SCALE_SPOTCHECK_PATH), 'utf8');
    expect(spotcheck).toContain('DAU');
    expect(spotcheck).toContain('max_open_interest');
    expect(spotcheck).toContain('ROLLBACK');
  });
});
