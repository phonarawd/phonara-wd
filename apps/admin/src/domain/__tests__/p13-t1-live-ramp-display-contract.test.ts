import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertP13T1LiveRampSync,
  P13_T1_ADMIN_OPS_KILL_CONFIG_KEYS,
  P13_T1_CAP_SETTINGS,
  P13_T1_CHECKLIST_SECTIONS,
  P13_T1_DAILY_LOOP_MORNING_ROUTES,
  P13_T1_DAILY_LOOP_SLOTS,
  P13_T1_LAUNCH_GATES_OFF,
  P13_T1_LIVE_RAMP_ARTIFACT_PATHS,
  P13_T1_LIVE_RAMP_CANON_PATH,
  P13_T1_LIVE_RAMP_ENGINE_MIGRATION_TOUCH,
  P13_T1_LIVE_RAMP_GO_PREREQUISITE_TODO,
  P13_T1_LIVE_RAMP_NEXT_TODO,
  P13_T1_LIVE_RAMP_PREREQUISITE_TODO,
  P13_T1_LIVE_RAMP_SPOTCHECK_PATH,
  P13_T1_LIVE_RAMP_TEST_PATHS,
  P13_T1_LIVE_RAMP_TODO,
  P13_T1_TIER_B_UI_HIDDEN_POLICY_IDS,
  P13_T1_WEEKLY_FEATURE_GATE_KEYS,
  P13_T1_WEEKLY_FEATURE_GATES_ON,
  P13_T1_WEEKLY_REVIEW_CADENCE,
} from '../p13-t1-live-ramp-display-contract';

const ADMIN_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(ADMIN_SRC, '../../..');

describe('p13-t1-live-ramp-display-contract · YAML #237 T1', () => {
  it('registers OPS todo · soft-launch + closeout GO · next T2 · engine touch 0', () => {
    expect(P13_T1_LIVE_RAMP_TODO).toBe('launch-ramp-t1-feature-gates');
    expect(P13_T1_LIVE_RAMP_PREREQUISITE_TODO).toBe('p13-soft-launch-bundle');
    expect(P13_T1_LIVE_RAMP_GO_PREREQUISITE_TODO).toBe('p13-closeout-bundle');
    expect(P13_T1_LIVE_RAMP_NEXT_TODO).toBe('launch-scale-t2-triggers');
    expect(P13_T1_LIVE_RAMP_ENGINE_MIGRATION_TOUCH).toBe(false);
    expect(() => assertP13T1LiveRampSync()).not.toThrow();
  });

  it('pins 5 checklist sections', () => {
    expect(P13_T1_CHECKLIST_SECTIONS).toEqual([
      'weekly_feature_gates',
      'cap_settings',
      'launch_gates_off',
      'admin_daily_loop',
      'code_diff_zero',
    ]);
  });

  it('pins weekly rails ON · spot·futures·casino·sports·deposit', () => {
    expect(P13_T1_WEEKLY_FEATURE_GATES_ON).toEqual({
      feature_spot_enabled: 'true',
      feature_futures_enabled: 'true',
      feature_game_enabled: 'true',
      feature_sports_enabled: 'true',
      feature_deposit_enabled: 'true',
    });
    expect(P13_T1_WEEKLY_FEATURE_GATE_KEYS).toHaveLength(5);
    expect(P13_T1_ADMIN_OPS_KILL_CONFIG_KEYS).toEqual([
      'feature_spot_enabled',
      'feature_futures_enabled',
      'feature_game_enabled',
      'feature_sports_enabled',
    ]);
    expect(P13_T1_WEEKLY_REVIEW_CADENCE.weekday).toBe('monday');
    expect(P13_T1_WEEKLY_REVIEW_CADENCE.timezone).toBe('Asia/Seoul');
  });

  it('pins T1 caps · OI 40% · lev 5 · launch gates OFF', () => {
    expect(P13_T1_CAP_SETTINGS.maxLeverage).toBe('5');
    expect(P13_T1_CAP_SETTINGS.oiUtilizationPct).toBe(40);
    expect(P13_T1_CAP_SETTINGS.insuranceOiPct).toBe(20);
    expect(P13_T1_CAP_SETTINGS.krwCap).toBe(500_000);
    expect(P13_T1_CAP_SETTINGS.usdtCap).toBe(100);
    expect(P13_T1_CAP_SETTINGS.futuresMajorMaxOi).toBe('200000.000000');
    expect(P13_T1_CAP_SETTINGS.phonPerpMaxOi).toBe('40000.000000');
    expect(P13_T1_LAUNCH_GATES_OFF.feature_cross_margin_enabled).toBe('false');
    expect(P13_T1_LAUNCH_GATES_OFF.feature_funding_enabled).toBe('false');
    expect(P13_T1_LAUNCH_GATES_OFF.feature_withdrawal_enabled).toBe('false');
    expect(P13_T1_TIER_B_UI_HIDDEN_POLICY_IDS).toContain('g7-tier-b-hedge-hidden');
  });

  it('pins Admin daily loop · 09:00 queues/ops · 4 slots', () => {
    expect(P13_T1_DAILY_LOOP_SLOTS).toHaveLength(4);
    expect(P13_T1_DAILY_LOOP_SLOTS.map((s) => s.localTime)).toEqual([
      '09:00',
      '12:00',
      '18:00',
      '22:00',
    ]);
    expect(P13_T1_DAILY_LOOP_MORNING_ROUTES).toEqual([
      '/ops',
      '/queues',
      '/deposits',
      '/withdrawals',
    ]);
    expect(P13_T1_DAILY_LOOP_SLOTS[0].focus).toBe('ops_alerts_and_exception_queues');
    expect(P13_T1_DAILY_LOOP_SLOTS[1].focus).toBe('telegram_critical_pager_only');
    expect(P13_T1_DAILY_LOOP_SLOTS[2].focus).toBe('insurance_oi_ledger_drift');
  });

  it('requires canon · spotcheck · contract artifacts on disk', () => {
    for (const rel of P13_T1_LIVE_RAMP_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of P13_T1_LIVE_RAMP_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('canon pins weekly gates · caps · daily loop · todo ids', () => {
    const canon = readFileSync(resolve(REPO_ROOT, P13_T1_LIVE_RAMP_CANON_PATH), 'utf8');
    expect(canon).toContain('launch-ramp-t1-feature-gates');
    expect(canon).toContain('p13-soft-launch-bundle');
    expect(canon).toContain('p13-closeout-bundle');
    expect(canon).toContain('launch-scale-t2-triggers');
    expect(canon).toContain('feature_spot_enabled');
    expect(canon).toContain('feature_futures_enabled');
    expect(canon).toContain('feature_game_enabled');
    expect(canon).toContain('feature_sports_enabled');
    expect(canon).toContain('feature_cross_margin_enabled');
    expect(canon).toContain('feature_funding_enabled');
    expect(canon).toContain('200000');
    expect(canon).toContain('40000');
    expect(canon).toContain('09:00');
    expect(canon).toContain('/admin/ops');
    expect(canon).toContain('/admin/queues');
    expect(canon).toContain('코드 diff 0');

    const spotcheck = readFileSync(
      resolve(REPO_ROOT, P13_T1_LIVE_RAMP_SPOTCHECK_PATH),
      'utf8',
    );
    expect(spotcheck).toContain('feature_spot_enabled');
    expect(spotcheck).toContain('feature_cross_margin_enabled');
    expect(spotcheck).toContain('200000');
    expect(spotcheck).toContain('ROLLBACK');
  });
});
