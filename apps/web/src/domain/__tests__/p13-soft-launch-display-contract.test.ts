import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { messages } from '@phonara/i18n';

import {
  assertP13SoftLaunchBundleSync,
  P13_SOFT_LAUNCH_ADMIN_EXCEPTION_ROUTES,
  P13_SOFT_LAUNCH_ADMIN_FORBIDDEN_JARGON,
  P13_SOFT_LAUNCH_ARTIFACT_PATHS,
  P13_SOFT_LAUNCH_BUNDLE_TODO,
  P13_SOFT_LAUNCH_CANON_PATH,
  P13_SOFT_LAUNCH_CB_MATRIX_PATH,
  P13_SOFT_LAUNCH_CB_SCENARIO_DOMAINS,
  P13_SOFT_LAUNCH_CB_SCENARIO_IDS,
  P13_SOFT_LAUNCH_CHECKLIST_SECTIONS,
  P13_SOFT_LAUNCH_CLOSED_BETA_TARGETS,
  P13_SOFT_LAUNCH_DECAY_WARNING_ROUTE,
  P13_SOFT_LAUNCH_ENGINE_MIGRATION_TOUCH,
  P13_SOFT_LAUNCH_GROWTH_PATH_STEPS,
  P13_SOFT_LAUNCH_LOCALES,
  P13_SOFT_LAUNCH_NEXT_TODO,
  P13_SOFT_LAUNCH_PREREQUISITE_TODO,
  P13_SOFT_LAUNCH_PRIOR_VISUAL_TODOS,
  P13_SOFT_LAUNCH_PWA_QA_CUES,
  P13_SOFT_LAUNCH_SMOKE_ROUTES,
  P13_SOFT_LAUNCH_T1_RAMP_TODO,
  P13_SOFT_LAUNCH_TEST_PATHS,
  P13_SOFT_LAUNCH_VIEWER_ALLOWED_ROUTES,
  P13_SOFT_LAUNCH_VIEWER_FORBIDDEN_ROUTES,
  P13_SOFT_LAUNCH_VIEWPORT_WIDTHS,
} from '../p13-soft-launch-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

const ko = messages.ko as Record<string, string>;
const en = messages.en as Record<string, string>;

describe('p13-soft-launch-display-contract · YAML #233 Soft Launch BUNDLE', () => {
  it('registers BUNDLE todo · prerequisite T0-A · next da-w7 · engine touch 0', () => {
    expect(P13_SOFT_LAUNCH_BUNDLE_TODO).toBe('p13-soft-launch-bundle');
    expect(P13_SOFT_LAUNCH_PREREQUISITE_TODO).toBe('p13-ops-prod-preflight');
    expect(P13_SOFT_LAUNCH_NEXT_TODO).toBe('da-w7-enforcement-strict-tokens');
    expect(P13_SOFT_LAUNCH_T1_RAMP_TODO).toBe('launch-ramp-t1-feature-gates');
    expect(P13_SOFT_LAUNCH_ENGINE_MIGRATION_TOUCH).toBe(false);
    expect(() => assertP13SoftLaunchBundleSync()).not.toThrow();
  });

  it('pins 9 checklist sections · ko/en · 390/768/1024 viewports', () => {
    expect(P13_SOFT_LAUNCH_CHECKLIST_SECTIONS).toEqual([
      'ko_en_qa',
      'multi_viewport_axe',
      'closed_beta_cb_01_06',
      'admin_beginner_spotcheck',
      'admin_exception_dry_run',
      'team_viewer_negative',
      'pwa_install_qa',
      'growth_path_smoke',
      'code_diff_zero',
    ]);
    expect(P13_SOFT_LAUNCH_LOCALES).toEqual(['ko', 'en']);
    expect(P13_SOFT_LAUNCH_VIEWPORT_WIDTHS).toEqual([390, 768, 1024]);
  });

  it('covers Soft Launch smoke routes + growth path + decay warning', () => {
    expect(P13_SOFT_LAUNCH_SMOKE_ROUTES).toContain('/home');
    expect(P13_SOFT_LAUNCH_SMOKE_ROUTES).toContain('/wallet');
    expect(P13_SOFT_LAUNCH_SMOKE_ROUTES).toContain('/trade');
    expect(P13_SOFT_LAUNCH_SMOKE_ROUTES).toContain('/sports');
    expect(P13_SOFT_LAUNCH_SMOKE_ROUTES).toContain('/casino');
    expect(P13_SOFT_LAUNCH_SMOKE_ROUTES).toContain('/install');
    expect(P13_SOFT_LAUNCH_SMOKE_ROUTES).toContain('/offline');
    expect(P13_SOFT_LAUNCH_DECAY_WARNING_ROUTE).toBe('/tier/me');
    expect(P13_SOFT_LAUNCH_GROWTH_PATH_STEPS).toEqual([
      'signup',
      'referral',
      'mission_claim',
      'wallet_refresh',
    ]);
  });

  it('pins CB-01~06 · §20.14.5 caps · domains', () => {
    expect(P13_SOFT_LAUNCH_CB_SCENARIO_IDS).toEqual([
      'CB-01',
      'CB-02',
      'CB-03',
      'CB-04',
      'CB-05',
      'CB-06',
    ]);
    expect(P13_SOFT_LAUNCH_CB_SCENARIO_DOMAINS['CB-01']).toBe('deposit');
    expect(P13_SOFT_LAUNCH_CB_SCENARIO_DOMAINS['CB-06']).toBe('reconciliation');
    expect(P13_SOFT_LAUNCH_CLOSED_BETA_TARGETS).toEqual({
      maxLeverage: '5',
      oiUtilizationPct: 50,
      insuranceOiPct: 20,
      krwCap: 500_000,
      usdtCap: 100,
    });
  });

  it('pins admin exception dry-run · viewer allow/deny · jargon · PWA cues', () => {
    expect(P13_SOFT_LAUNCH_ADMIN_EXCEPTION_ROUTES).toContain('/queues');
    expect(P13_SOFT_LAUNCH_ADMIN_EXCEPTION_ROUTES).toContain('/withdrawals');
    expect(P13_SOFT_LAUNCH_VIEWER_ALLOWED_ROUTES).toEqual(['/', '/ops', '/earn/activity']);
    expect(P13_SOFT_LAUNCH_VIEWER_FORBIDDEN_ROUTES).toContain('/team');
    expect(P13_SOFT_LAUNCH_VIEWER_FORBIDDEN_ROUTES).toContain('/withdrawals');
    expect(P13_SOFT_LAUNCH_ADMIN_FORBIDDEN_JARGON).toContain('queue');
    expect(P13_SOFT_LAUNCH_ADMIN_FORBIDDEN_JARGON).toContain('rpc_');
    expect(P13_SOFT_LAUNCH_PWA_QA_CUES).toContain('offline_route');
    expect(P13_SOFT_LAUNCH_PRIOR_VISUAL_TODOS.length).toBe(6);
  });

  it('ko/en Soft Launch nav anchors exist and English has no Hangul', () => {
    const softLaunchKeys = [
      'admin.nav.overview',
      'admin.nav.queues',
      'admin.nav.deposits',
      'admin.nav.withdrawals',
      'admin.nav.ops',
      'admin.nav.team',
    ];
    for (const key of softLaunchKeys) {
      expect(ko[key], key).toBeTruthy();
      expect(en[key], key).toBeTruthy();
      expect(en[key]).not.toMatch(/[\uAC00-\uD7A3]/);
    }
    expect(ko['admin.nav.queues']).toBe('처리 대기함');
    expect(en['admin.nav.queues']).toBe('Pending');
    expect(ko['admin.nav.ops']).toBe('시스템 상태');
  });

  it('requires canon · CB matrix · contract artifacts on disk', () => {
    for (const rel of P13_SOFT_LAUNCH_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of P13_SOFT_LAUNCH_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('canon pins Soft Launch sections · CB · viewer · engine 0', () => {
    const canon = readFileSync(resolve(REPO_ROOT, P13_SOFT_LAUNCH_CANON_PATH), 'utf8');
    expect(canon).toContain('p13-soft-launch-bundle');
    expect(
      p13ContainsAll(canon, [
        'p13-ops-prod-preflight',
        'da-w7-enforcement-strict-tokens',
        'CB-01',
        'CB-06',
        '390',
        '768',
        '1024',
        'axe',
        'viewer',
        '처리 대기함',
        '코드 diff 0',
        'KRW',
        'USDT',
      ]),
    ).toBe(true);

    const matrix = readFileSync(resolve(REPO_ROOT, P13_SOFT_LAUNCH_CB_MATRIX_PATH), 'utf8');
    for (const id of P13_SOFT_LAUNCH_CB_SCENARIO_IDS) {
      expect(matrix).toContain(id);
    }
  });
});

function p13ContainsAll(haystack: string, needles: string[]): boolean {
  return needles.every((n) => haystack.includes(n));
}
