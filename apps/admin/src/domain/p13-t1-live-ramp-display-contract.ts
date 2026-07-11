/**
 * P13 OPS — T1 live ramp feature gates (§20.14.4–§20.14.7 · YAML #237).
 * Authority: `launch-ramp-t1-feature-gates` · docs/OPERATIONS/P13_T1_LIVE_RAMP_FEATURE_GATES.md
 *
 * OPS/DOC only — engine migration · packages/*-engine diff **0**.
 * Live verify = read-only SQL spotcheck + Admin daily loop checklist.
 */

export const P13_T1_LIVE_RAMP_TODO = 'launch-ramp-t1-feature-gates' as const;

/** Prerequisite — Soft Launch closed; closeout GO is also required in the queue. */
export const P13_T1_LIVE_RAMP_PREREQUISITE_TODO = 'p13-soft-launch-bundle' as const;

/** Closeout GO must be DONE before traffic ramp (Plan §20.14.4). */
export const P13_T1_LIVE_RAMP_GO_PREREQUISITE_TODO = 'p13-closeout-bundle' as const;

/** Next Track A OPS after T1 ramp. */
export const P13_T1_LIVE_RAMP_NEXT_TODO = 'launch-scale-t2-triggers' as const;

/** Engine freeze — this todo must not touch migrations or *-engine packages. */
export const P13_T1_LIVE_RAMP_ENGINE_MIGRATION_TOUCH = false as const;

/** Checklist section ids — 1:1 with P13_T1_LIVE_RAMP_FEATURE_GATES.md §2. */
export const P13_T1_CHECKLIST_SECTIONS = [
  'weekly_feature_gates',
  'cap_settings',
  'launch_gates_off',
  'admin_daily_loop',
  'code_diff_zero',
] as const;

export type P13T1ChecklistSection = (typeof P13_T1_CHECKLIST_SECTIONS)[number];

/**
 * Weekly live-ramp rails (Plan todo · spot · futures isolated · casino · sports).
 * Futures = isolated only while cross margin stays OFF (§20.14.7).
 */
export const P13_T1_WEEKLY_FEATURE_GATES_ON = {
  feature_spot_enabled: 'true',
  feature_futures_enabled: 'true',
  feature_game_enabled: 'true',
  feature_sports_enabled: 'true',
  feature_deposit_enabled: 'true',
} as const;

export const P13_T1_WEEKLY_FEATURE_GATE_KEYS = Object.keys(
  P13_T1_WEEKLY_FEATURE_GATES_ON,
) as ReadonlyArray<keyof typeof P13_T1_WEEKLY_FEATURE_GATES_ON>;

/** Admin `/ops` kill-switch config keys for the four weekly rails. */
export const P13_T1_ADMIN_OPS_KILL_CONFIG_KEYS = [
  'feature_spot_enabled',
  'feature_futures_enabled',
  'feature_game_enabled',
  'feature_sports_enabled',
] as const;

/**
 * T1 still-OFF launch gates (Plan §20.14.7) — unchanged from T0-A until T2/E-Wave.
 */
export const P13_T1_LAUNCH_GATES_OFF = {
  feature_cross_margin_enabled: 'false',
  feature_funding_enabled: 'false',
  feature_withdrawal_enabled: 'false',
  system_halt: 'false',
  system_readonly: 'false',
} as const;

/** Tier-B trade UI — presentation built_hidden until E21 (no app_config key). */
export const P13_T1_TIER_B_UI_HIDDEN_POLICY_IDS = [
  'g7-tier-b-hedge-hidden',
  'g7-tier-b-reduce-only-hidden',
] as const;

/**
 * Cap settings (Plan §20.14.5–§20.14.2).
 * Seed majors OI 500000 → T1 **40%** = 200000 · PHON seed 100000 → **40000**.
 * CB was 50% (250k / 50k) — T1 tightens blast radius.
 */
export const P13_T1_CAP_SETTINGS = {
  maxLeverage: '5',
  oiUtilizationPct: 40,
  insuranceOiPct: 20,
  krwCap: 500_000,
  usdtCap: 100,
  maxOpenPositionsPerUser: '50',
  futuresMajorMaxOi: '200000.000000',
  phonPerpMaxOi: '40000.000000',
  seedMajorMaxOi: '500000.000000',
  seedPhonMaxOi: '100000.000000',
} as const;

/** Solo-operator Daily Loop slots (Plan §20.14.6 · KST). */
export const P13_T1_DAILY_LOOP_SLOTS = [
  {
    id: 'morning_queues',
    localTime: '09:00',
    focus: 'ops_alerts_and_exception_queues',
    adminRoutes: ['/ops', '/queues', '/deposits', '/withdrawals'] as const,
  },
  {
    id: 'midday_pager',
    localTime: '12:00',
    focus: 'telegram_critical_pager_only',
    adminRoutes: [] as const,
  },
  {
    id: 'evening_risk',
    localTime: '18:00',
    focus: 'insurance_oi_ledger_drift',
    adminRoutes: ['/ops'] as const,
  },
  {
    id: 'night_pager',
    localTime: '22:00',
    focus: 'telegram_critical_pager_only',
    adminRoutes: [] as const,
  },
] as const;

export type P13T1DailyLoopSlot = (typeof P13_T1_DAILY_LOOP_SLOTS)[number];

/** Morning desk paths operators open at 09:00. */
export const P13_T1_DAILY_LOOP_MORNING_ROUTES = P13_T1_DAILY_LOOP_SLOTS[0].adminRoutes;

/** Weekly cadence — review feature rails + caps every Monday (KST). */
export const P13_T1_WEEKLY_REVIEW_CADENCE = {
  weekday: 'monday',
  timezone: 'Asia/Seoul',
  checklist: [
    'confirm_weekly_rails_on',
    'confirm_launch_gates_off',
    'confirm_oi_40_pct_caps',
    'review_open_ops_alerts',
    'review_exception_queues',
  ] as const,
} as const;

export const P13_T1_LIVE_RAMP_CANON_PATH =
  'docs/OPERATIONS/P13_T1_LIVE_RAMP_FEATURE_GATES.md' as const;

export const P13_T1_LIVE_RAMP_SPOTCHECK_PATH =
  'scripts/p13-t1-live-ramp-spotcheck.sql' as const;

export const P13_T1_LIVE_RAMP_ARTIFACT_PATHS = [
  P13_T1_LIVE_RAMP_CANON_PATH,
  P13_T1_LIVE_RAMP_SPOTCHECK_PATH,
  'apps/admin/src/domain/p13-t1-live-ramp-display-contract.ts',
  'apps/admin/src/domain/__tests__/p13-t1-live-ramp-display-contract.test.ts',
] as const;

export const P13_T1_LIVE_RAMP_TEST_PATHS = [
  'apps/admin/src/domain/__tests__/p13-t1-live-ramp-display-contract.test.ts',
] as const;

export function assertP13T1LiveRampSync(): void {
  if (P13_T1_LIVE_RAMP_TODO !== 'launch-ramp-t1-feature-gates') {
    throw new Error('T1 todo id drift');
  }
  if (P13_T1_LIVE_RAMP_PREREQUISITE_TODO !== 'p13-soft-launch-bundle') {
    throw new Error('T1 prerequisite must be p13-soft-launch-bundle');
  }
  if (P13_T1_LIVE_RAMP_GO_PREREQUISITE_TODO !== 'p13-closeout-bundle') {
    throw new Error('T1 GO prerequisite must be p13-closeout-bundle');
  }
  if (P13_T1_LIVE_RAMP_NEXT_TODO !== 'launch-scale-t2-triggers') {
    throw new Error('T1 next must be launch-scale-t2-triggers');
  }
  if (P13_T1_LIVE_RAMP_ENGINE_MIGRATION_TOUCH !== false) {
    throw new Error('T1 must keep engine migration touch false');
  }
  if (P13_T1_CHECKLIST_SECTIONS.length !== 5) {
    throw new Error('T1 checklist must have 5 sections');
  }
  if (P13_T1_WEEKLY_FEATURE_GATE_KEYS.length !== 5) {
    throw new Error('T1 weekly rails must pin spot·futures·game·sports·deposit');
  }
  if (P13_T1_ADMIN_OPS_KILL_CONFIG_KEYS.length !== 4) {
    throw new Error('T1 Admin kill keys must be spot·futures·game·sports');
  }
  if (P13_T1_LAUNCH_GATES_OFF.feature_cross_margin_enabled !== 'false') {
    throw new Error('T1 cross margin must stay false');
  }
  if (P13_T1_LAUNCH_GATES_OFF.feature_funding_enabled !== 'false') {
    throw new Error('T1 funding settlement gate must stay false');
  }
  if (P13_T1_CAP_SETTINGS.oiUtilizationPct !== 40) {
    throw new Error('T1 OI utilization must be 40%');
  }
  if (P13_T1_CAP_SETTINGS.futuresMajorMaxOi !== '200000.000000') {
    throw new Error('T1 major OI must be 200000 (40% of seed)');
  }
  if (P13_T1_CAP_SETTINGS.phonPerpMaxOi !== '40000.000000') {
    throw new Error('T1 PHON OI must be 40000 (40% of seed)');
  }
  if (P13_T1_DAILY_LOOP_SLOTS.length !== 4) {
    throw new Error('T1 daily loop must have 4 slots');
  }
  if (P13_T1_DAILY_LOOP_SLOTS[0].localTime !== '09:00') {
    throw new Error('T1 morning loop must be 09:00');
  }
  if (!P13_T1_DAILY_LOOP_MORNING_ROUTES.includes('/ops')) {
    throw new Error('T1 09:00 loop must include /ops');
  }
  if (!P13_T1_DAILY_LOOP_MORNING_ROUTES.includes('/queues')) {
    throw new Error('T1 09:00 loop must include /queues');
  }
}
