/**
 * P13 OPS — T2 scale DAU/session trigger matrix (YAML #238).
 * Authority: `launch-scale-t2-triggers` · docs/OPERATIONS/P13_T2_SCALE_TRIGGERS.md
 *
 * OPS/DOC only — engine migration · packages/*-engine diff **0**.
 * Live verify = DAU/session probe SQL + Admin scale checklist (no auto scale apply).
 */

export const P13_T2_SCALE_TODO = 'launch-scale-t2-triggers' as const;

/** Prerequisite — T1 live ramp must be DONE before scale triggers. */
export const P13_T2_SCALE_PREREQUISITE_TODO = 'launch-ramp-t1-feature-gates' as const;

/** Closeout GO remains required in the Track A queue (Plan §20.14.4). */
export const P13_T2_SCALE_GO_PREREQUISITE_TODO = 'p13-closeout-bundle' as const;

/** Next Track A after T2 = Track B E0 ADR approval. */
export const P13_T2_SCALE_NEXT_TODO = 'ew-e0-adr-approval' as const;

/** Engine freeze — this todo must not touch migrations or *-engine packages. */
export const P13_T2_SCALE_ENGINE_MIGRATION_TOUCH = false as const;

/** Checklist section ids — 1:1 with P13_T2_SCALE_TRIGGERS.md §2. */
export const P13_T2_CHECKLIST_SECTIONS = [
  'dau_trigger_matrix',
  'per_user_notional_cap',
  'read_replica_review',
  'hedge_review',
  'code_diff_zero',
] as const;

export type P13T2ChecklistSection = (typeof P13_T2_CHECKLIST_SECTIONS)[number];

/**
 * DAU / peak-session scale bands (Plan todo content).
 * Metric SOT: distinct auth users / 24h (DAU) · peak concurrent sessions.
 */
export const P13_T2_SCALE_BANDS = [
  {
    id: 's1_early',
    label: '500~2K',
    dauMin: 500,
    dauMaxExclusive: 2_000,
    peakConcurrentHintMin: 50,
    peakConcurrentHintMaxExclusive: 200,
  },
  {
    id: 's2_growth',
    label: '2K~10K',
    dauMin: 2_000,
    dauMaxExclusive: 10_000,
    peakConcurrentHintMin: 200,
    peakConcurrentHintMaxExclusive: 1_000,
  },
  {
    id: 's3_scale',
    label: '10K+',
    dauMin: 10_000,
    dauMaxExclusive: null,
    peakConcurrentHintMin: 1_000,
    peakConcurrentHintMaxExclusive: null,
  },
] as const;

export type P13T2ScaleBandId = (typeof P13_T2_SCALE_BANDS)[number]['id'];

/**
 * Per-user notional cap by band (display policy · Admin apply only).
 * T1 baseline = KRW 500_000 / USDT 100 (unchanged until S1 trigger fires).
 */
export const P13_T2_PER_USER_NOTIONAL_CAPS = {
  t1Baseline: { krw: 500_000, usdt: 100 },
  s1_early: { krw: 1_000_000, usdt: 200 },
  s2_growth: { krw: 2_000_000, usdt: 500 },
  s3_scale: { krw: 5_000_000, usdt: 2_000 },
} as const;

/**
 * OI utilization of seed by band (majors seed 500000 · PHON seed 100000).
 * T1 starts at 40% — scale bands may raise blast radius only after trigger review.
 */
export const P13_T2_OI_UTILIZATION_BY_BAND = {
  t1BaselinePct: 40,
  s1_earlyPct: 50,
  s2_growthPct: 60,
  s3_scalePct: 80,
} as const;

export const P13_T2_OI_TARGETS_BY_BAND = {
  t1Baseline: {
    futuresMajorMaxOi: '200000.000000',
    phonPerpMaxOi: '40000.000000',
  },
  s1_early: {
    futuresMajorMaxOi: '250000.000000',
    phonPerpMaxOi: '50000.000000',
  },
  s2_growth: {
    futuresMajorMaxOi: '300000.000000',
    phonPerpMaxOi: '60000.000000',
  },
  s3_scale: {
    futuresMajorMaxOi: '400000.000000',
    phonPerpMaxOi: '80000.000000',
  },
} as const;

/**
 * Read-replica review gates — Supabase read replica is **operator Dashboard** work.
 * Code does not provision replicas (engine/migration touch 0).
 */
export const P13_T2_READ_REPLICA_POLICY = {
  s1_early: 'primary_only_monitor_cpu',
  s2_growth: 'enable_read_replica_for_read_heavy',
  s3_scale: 'replica_ha_plus_compute_upgrade',
  allowedReadPaths: [
    'market_catalog_public',
    'leaderboards_public',
    'announcements_cms_public',
    'sports_fixture_board_reads',
  ] as const,
  forbiddenOnReplica: [
    'wallet_ledger_writes',
    'order_place_settle',
    'deposit_withdrawal_queues',
    'admin_exception_mutations',
  ] as const,
} as const;

/**
 * Hedge review — product B-book (§20.14.1) vs external venue hedge.
 * Distinct from E21 user dual-side position mode (`ew-e21-trade-parity-wave`).
 */
export const P13_T2_HEDGE_REVIEW = {
  productModel: 'b_book_insurance_fund',
  externalVenueHedgeDefault: false,
  /** User UI hedge toggle stays built_hidden until E21 — not a T2 scale action. */
  userDualSideUi: 'built_hidden_until_e21',
  reviewByBand: {
    s1_early: 'stay_b_book_confirm_insurance_20pct',
    s2_growth: 'adr_kickoff_external_vs_b_book',
    s3_scale: 'operator_go_nogo_external_hedge',
  },
  /** Binance/OKX venue hedge ≠ E21 hedge mode — Plan §20.14 footnote. */
  distinctFromE21UserHedge: true,
} as const;

/** Weekly scale review cadence (KST) — after T1 Monday rails review. */
export const P13_T2_WEEKLY_SCALE_REVIEW = {
  weekday: 'monday',
  timezone: 'Asia/Seoul',
  afterT1RailsReview: true,
  checklist: [
    'measure_dau_24h',
    'measure_peak_concurrent_hint',
    'classify_scale_band',
    'review_per_user_notional_vs_band',
    'review_read_replica_decision',
    'review_hedge_checkpoint',
  ] as const,
} as const;

export const P13_T2_SCALE_CANON_PATH = 'docs/OPERATIONS/P13_T2_SCALE_TRIGGERS.md' as const;

export const P13_T2_SCALE_SPOTCHECK_PATH = 'scripts/p13-t2-scale-triggers-spotcheck.sql' as const;

export const P13_T2_SCALE_ARTIFACT_PATHS = [
  P13_T2_SCALE_CANON_PATH,
  P13_T2_SCALE_SPOTCHECK_PATH,
  'apps/admin/src/domain/p13-t2-scale-triggers-display-contract.ts',
  'apps/admin/src/domain/__tests__/p13-t2-scale-triggers-display-contract.test.ts',
] as const;

export const P13_T2_SCALE_TEST_PATHS = [
  'apps/admin/src/domain/__tests__/p13-t2-scale-triggers-display-contract.test.ts',
] as const;

export function resolveP13T2ScaleBand(dau: number): P13T2ScaleBandId | 'below_s1' {
  if (!Number.isFinite(dau) || dau < 0) {
    throw new Error('DAU must be a non-negative finite number');
  }
  if (dau < P13_T2_SCALE_BANDS[0].dauMin) {
    return 'below_s1';
  }
  if (dau < P13_T2_SCALE_BANDS[1].dauMin) {
    return 's1_early';
  }
  if (dau < P13_T2_SCALE_BANDS[2].dauMin) {
    return 's2_growth';
  }
  return 's3_scale';
}

export function assertP13T2ScaleTriggersSync(): void {
  if (P13_T2_SCALE_TODO !== 'launch-scale-t2-triggers') {
    throw new Error('T2 todo id drift');
  }
  if (P13_T2_SCALE_PREREQUISITE_TODO !== 'launch-ramp-t1-feature-gates') {
    throw new Error('T2 prerequisite must be launch-ramp-t1-feature-gates');
  }
  if (P13_T2_SCALE_GO_PREREQUISITE_TODO !== 'p13-closeout-bundle') {
    throw new Error('T2 GO prerequisite must be p13-closeout-bundle');
  }
  if (P13_T2_SCALE_NEXT_TODO !== 'ew-e0-adr-approval') {
    throw new Error('T2 next must be ew-e0-adr-approval');
  }
  if (P13_T2_SCALE_ENGINE_MIGRATION_TOUCH !== false) {
    throw new Error('T2 must keep engine migration touch false');
  }
  if (P13_T2_CHECKLIST_SECTIONS.length !== 5) {
    throw new Error('T2 checklist must have 5 sections');
  }
  if (P13_T2_SCALE_BANDS.length !== 3) {
    throw new Error('T2 must pin 3 DAU bands (500~2K / 2K~10K / 10K+)');
  }
  if (P13_T2_SCALE_BANDS[0].dauMin !== 500 || P13_T2_SCALE_BANDS[0].dauMaxExclusive !== 2_000) {
    throw new Error('T2 S1 band must be 500~2K');
  }
  if (P13_T2_SCALE_BANDS[1].dauMin !== 2_000 || P13_T2_SCALE_BANDS[1].dauMaxExclusive !== 10_000) {
    throw new Error('T2 S2 band must be 2K~10K');
  }
  if (P13_T2_SCALE_BANDS[2].dauMin !== 10_000 || P13_T2_SCALE_BANDS[2].dauMaxExclusive !== null) {
    throw new Error('T2 S3 band must be 10K+');
  }
  if (P13_T2_PER_USER_NOTIONAL_CAPS.t1Baseline.krw !== 500_000) {
    throw new Error('T2 T1 baseline KRW cap must stay 500000');
  }
  if (P13_T2_PER_USER_NOTIONAL_CAPS.s3_scale.usdt !== 2_000) {
    throw new Error('T2 S3 USDT notional must be 2000');
  }
  if (P13_T2_HEDGE_REVIEW.externalVenueHedgeDefault !== false) {
    throw new Error('T2 default must stay B-book (no external hedge)');
  }
  if (P13_T2_HEDGE_REVIEW.distinctFromE21UserHedge !== true) {
    throw new Error('T2 hedge review must stay distinct from E21 user hedge');
  }
  if (resolveP13T2ScaleBand(499) !== 'below_s1') {
    throw new Error('DAU 499 must be below_s1');
  }
  if (resolveP13T2ScaleBand(500) !== 's1_early') {
    throw new Error('DAU 500 must be s1_early');
  }
  if (resolveP13T2ScaleBand(2_000) !== 's2_growth') {
    throw new Error('DAU 2000 must be s2_growth');
  }
  if (resolveP13T2ScaleBand(10_000) !== 's3_scale') {
    throw new Error('DAU 10000 must be s3_scale');
  }
}
