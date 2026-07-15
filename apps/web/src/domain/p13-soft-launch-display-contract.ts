/**
 * P13 Soft Launch BUNDLE — ko/en QA · multi-viewport · axe 0 · CB-01~06
 * (§20.5 · §20.14.5 · §25.10 · §29.5 · §32.6 · YAML #233).
 * Authority: `p13-soft-launch-bundle` · docs/OPERATIONS/P13_SOFT_LAUNCH_BUNDLE.md
 *
 * Merges former `p13-soft-launch-qa` + `p13-soft-launch-beta` (51st merge).
 * OPS/DOC + QA contracts — engine migration · packages/*-engine diff **0**.
 * Real-money CB rehearsal stays operator-gated (T0-A MFA/capital DEFER independent).
 */

export const P13_SOFT_LAUNCH_BUNDLE_TODO = 'p13-soft-launch-bundle' as const;

/** Prerequisite Track A OPS — T0-A prod preflight must be closed. */
export const P13_SOFT_LAUNCH_PREREQUISITE_TODO = 'p13-ops-prod-preflight' as const;

/** Next Track A todo after Soft Launch QA (CURRENT_STATUS · §20.6). */
export const P13_SOFT_LAUNCH_NEXT_TODO = 'da-w7-enforcement-strict-tokens' as const;

/** T1 ramp also depends on Soft Launch green (parallel next after da-w7 chain). */
export const P13_SOFT_LAUNCH_T1_RAMP_TODO = 'launch-ramp-t1-feature-gates' as const;

/** Engine freeze — this bundle must not touch migrations or *-engine packages. */
export const P13_SOFT_LAUNCH_ENGINE_MIGRATION_TOUCH = false as const;

/** Soft Launch checklist section ids — 1:1 with P13_SOFT_LAUNCH_BUNDLE.md §2. */
export const P13_SOFT_LAUNCH_CHECKLIST_SECTIONS = [
  'ko_en_qa',
  'multi_viewport_axe',
  'closed_beta_cb_01_06',
  'admin_beginner_spotcheck',
  'admin_exception_dry_run',
  'team_viewer_negative',
  'pwa_install_qa',
  'growth_path_smoke',
  'code_diff_zero',
] as const;

export type P13SoftLaunchChecklistSection = (typeof P13_SOFT_LAUNCH_CHECKLIST_SECTIONS)[number];

/** Locales required for Soft Launch QA (check:i18n · English mode no Korean). */
export const P13_SOFT_LAUNCH_LOCALES = ['ko', 'en'] as const;

/** Mandatory Soft Launch viewport smoke widths (§20.12 · §9 DoD). */
export const P13_SOFT_LAUNCH_VIEWPORT_WIDTHS = [390, 768, 1024] as const;

/**
 * Soft Launch QA smoke routes — 5-tab hubs + install/legal anchors.
 * Heavy E2E = CI / operator gate run only (G13).
 */
export const P13_SOFT_LAUNCH_SMOKE_ROUTES = [
  '/home',
  '/wallet',
  '/trade',
  '/sports',
  '/casino',
  '/install',
  '/offline',
  '/legal/terms',
  '/tier/me',
] as const;

export type P13SoftLaunchSmokeRoute = (typeof P13_SOFT_LAUNCH_SMOKE_ROUTES)[number];

/** Growth path UX smoke (agent: display contract · operator/CI: E2E). */
export const P13_SOFT_LAUNCH_GROWTH_PATH_STEPS = [
  'signup',
  'referral',
  'mission_claim',
  'wallet_refresh',
] as const;

/** Decay warning copy surface — UX exists even when E1 engine is STUB. */
export const P13_SOFT_LAUNCH_DECAY_WARNING_ROUTE = '/tier/me' as const;

/** Closed Beta scenario ids — ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md. */
export const P13_SOFT_LAUNCH_CB_SCENARIO_IDS = [
  'CB-01',
  'CB-02',
  'CB-03',
  'CB-04',
  'CB-05',
  'CB-06',
] as const;

export type P13SoftLaunchCbScenarioId = (typeof P13_SOFT_LAUNCH_CB_SCENARIO_IDS)[number];

/** §20.14.5 Closed Beta numeric targets. */
export const P13_SOFT_LAUNCH_CLOSED_BETA_TARGETS = {
  maxLeverage: '5',
  oiUtilizationPct: 50,
  insuranceOiPct: 20,
  krwCap: 500_000,
  usdtCap: 100,
} as const;

/** CB domain labels for operator checklist. */
export const P13_SOFT_LAUNCH_CB_SCENARIO_DOMAINS = {
  'CB-01': 'deposit',
  'CB-02': 'withdrawal',
  'CB-03': 'casino',
  'CB-04': 'sportsbook',
  'CB-05': 'price_feed',
  'CB-06': 'reconciliation',
} as const satisfies Record<P13SoftLaunchCbScenarioId, string>;

/** Admin exception dry-run desks (owner path · §20.5 · §32.6). */
export const P13_SOFT_LAUNCH_ADMIN_EXCEPTION_ROUTES = [
  '/queues',
  '/deposits',
  '/withdrawals',
  '/ops',
] as const;

/**
 * Team viewer negative — viewer must NOT see these routes
 * (ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.viewer = `/` · `/ops` · `/earn/activity`).
 */
export const P13_SOFT_LAUNCH_VIEWER_FORBIDDEN_ROUTES = [
  '/team',
  '/withdrawals',
  '/deposits',
  '/queues',
  '/settings',
] as const;

/** Viewer allowlist (pin for Soft Launch GATE). */
export const P13_SOFT_LAUNCH_VIEWER_ALLOWED_ROUTES = ['/', '/ops', '/earn/activity'] as const;

/** §29.5 admin beginner spot-check — jargon must not appear as hardcoded UI copy. */
export const P13_SOFT_LAUNCH_ADMIN_FORBIDDEN_JARGON = [
  'queue',
  'desk',
  'settle',
  'void',
  'flag',
  'rpc_',
  'audit log',
  'compliance',
  'AML',
] as const;

/** PWA Soft Launch QA cues (§25.10). */
export const P13_SOFT_LAUNCH_PWA_QA_CUES = [
  'check_pwa_installable',
  'manifest_maskable_icons',
  'offline_route',
  'install_page_cta',
  'update_toast_flow',
] as const;

/** Prior Part VISUAL sign-offs that Soft Launch assumes agent-green. */
export const P13_SOFT_LAUNCH_PRIOR_VISUAL_TODOS = [
  'p3-operator-visual-signoff',
  'p4-operator-visual-signoff',
  'p6-operator-visual-signoff',
  'p8-operator-visual-signoff',
  'p9-operator-visual-signoff',
  'p10-operator-visual-signoff',
] as const;

export const P13_SOFT_LAUNCH_CANON_PATH = 'docs/OPERATIONS/P13_SOFT_LAUNCH_BUNDLE.md' as const;

export const P13_SOFT_LAUNCH_CB_MATRIX_PATH = 'docs/ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md' as const;

export const P13_SOFT_LAUNCH_ARTIFACT_PATHS = [
  P13_SOFT_LAUNCH_CANON_PATH,
  P13_SOFT_LAUNCH_CB_MATRIX_PATH,
  'apps/web/src/domain/p13-soft-launch-display-contract.ts',
  'apps/web/src/domain/__tests__/p13-soft-launch-display-contract.test.ts',
  'apps/web/src/product/surfaces/__tests__/p13-soft-launch-qa.test.tsx',
  'apps/admin/src/domain/__tests__/p13-soft-launch-admin-spotcheck.test.ts',
] as const;

export const P13_SOFT_LAUNCH_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p13-soft-launch-display-contract.test.ts',
  'apps/web/src/product/surfaces/__tests__/p13-soft-launch-qa.test.tsx',
  'apps/admin/src/domain/__tests__/p13-soft-launch-admin-spotcheck.test.ts',
] as const;

/** Non-waivable sync for Soft Launch BUNDLE closeout. */
export function assertP13SoftLaunchBundleSync(): void {
  if (P13_SOFT_LAUNCH_BUNDLE_TODO !== 'p13-soft-launch-bundle') {
    throw new Error('soft-launch: todo id drift');
  }
  if (P13_SOFT_LAUNCH_PREREQUISITE_TODO !== 'p13-ops-prod-preflight') {
    throw new Error('soft-launch: prerequisite must be p13-ops-prod-preflight');
  }
  if (P13_SOFT_LAUNCH_NEXT_TODO !== 'da-w7-enforcement-strict-tokens') {
    throw new Error('soft-launch: next must be da-w7-enforcement-strict-tokens');
  }
  if (P13_SOFT_LAUNCH_ENGINE_MIGRATION_TOUCH !== false) {
    throw new Error('soft-launch: engine migration touch must stay false');
  }
  if (P13_SOFT_LAUNCH_CHECKLIST_SECTIONS.length !== 9) {
    throw new Error('soft-launch: checklist must have 9 sections');
  }
  if (P13_SOFT_LAUNCH_LOCALES.length !== 2) {
    throw new Error('soft-launch: ko + en required');
  }
  if (
    P13_SOFT_LAUNCH_VIEWPORT_WIDTHS[0] !== 390 ||
    P13_SOFT_LAUNCH_VIEWPORT_WIDTHS[1] !== 768 ||
    P13_SOFT_LAUNCH_VIEWPORT_WIDTHS[2] !== 1024
  ) {
    throw new Error('soft-launch: viewport smoke must be 390/768/1024');
  }
  if (P13_SOFT_LAUNCH_CB_SCENARIO_IDS.length !== 6) {
    throw new Error('soft-launch: CB-01~06 required');
  }
  if (P13_SOFT_LAUNCH_CLOSED_BETA_TARGETS.maxLeverage !== '5') {
    throw new Error('soft-launch: CB max leverage must be 5');
  }
  if (P13_SOFT_LAUNCH_CLOSED_BETA_TARGETS.oiUtilizationPct !== 50) {
    throw new Error('soft-launch: CB OI utilization must be 50%');
  }
  if (P13_SOFT_LAUNCH_CLOSED_BETA_TARGETS.insuranceOiPct !== 20) {
    throw new Error('soft-launch: insurance must be OI×20%');
  }
  if (P13_SOFT_LAUNCH_CLOSED_BETA_TARGETS.krwCap !== 500_000) {
    throw new Error('soft-launch: KRW cap must be 500000');
  }
  if (P13_SOFT_LAUNCH_CLOSED_BETA_TARGETS.usdtCap !== 100) {
    throw new Error('soft-launch: USDT cap must be 100');
  }
  if (P13_SOFT_LAUNCH_VIEWER_ALLOWED_ROUTES.length !== 3) {
    throw new Error('soft-launch: viewer allowlist must be /, /ops, and /earn/activity');
  }
  if (!P13_SOFT_LAUNCH_VIEWER_FORBIDDEN_ROUTES.includes('/team')) {
    throw new Error('soft-launch: viewer must be denied /team');
  }
  if (!P13_SOFT_LAUNCH_VIEWER_FORBIDDEN_ROUTES.includes('/withdrawals')) {
    throw new Error('soft-launch: viewer must be denied /withdrawals');
  }
}
