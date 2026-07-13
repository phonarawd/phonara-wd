/**
 * E0 ENGINE_GAP_ADR approval pin (YAML #239).
 * Authority: docs/PRODUCT/ADR/ENGINE_GAP_ADR.md · Plan `ew-e0-adr-approval`
 *
 * DOC/ADR only — this todo must not ship Track B migrations.
 * Track B migration unlock starts at `ew-e1-decay-wave` after E0 Accepted.
 */

export const ENGINE_GAP_E0_TODO = 'ew-e0-adr-approval' as const;

/** Prerequisite — Track A T2 scale must be DONE before E0. */
export const ENGINE_GAP_E0_PREREQUISITE_TODO = 'launch-scale-t2-triggers' as const;

/** Next Track B after E0 = E1 Tier Decay wave. */
export const ENGINE_GAP_E0_NEXT_TODO = 'ew-e1-decay-wave' as const;

/**
 * E0 itself is ADR approval only — no migration in this todo.
 * Track B waves after E0 may touch migrations under RED STOP rules.
 */
export const ENGINE_GAP_E0_MIGRATION_IN_THIS_TODO = false as const;

/** Canon ADR path (repo-relative). */
export const ENGINE_GAP_ADR_PATH = 'docs/PRODUCT/ADR/ENGINE_GAP_ADR.md' as const;

/** E1–E10 wave ids pinned by the approved index. */
export const ENGINE_GAP_WAVES = [
  'E1',
  'E2',
  'E3',
  'E4',
  'E5',
  'E6',
  'E7',
  'E8',
  'E9',
  'E10',
] as const;

export type EngineGapWaveId = (typeof ENGINE_GAP_WAVES)[number];

/** Permanent exclusions — operator re-confirmed at E0 (non-waivable). */
export const ENGINE_GAP_PERMANENT_EXCLUSIONS = [
  'ad_watch_mission',
  'survey_mission',
  'temporal_workflows',
  'polymarket_prediction',
] as const;

export type EngineGapPermanentExclusion = (typeof ENGINE_GAP_PERMANENT_EXCLUSIONS)[number];

/** RED STOP checklist ids — 1:1 with ENGINE_GAP_ADR.md §RED STOP. */
export const ENGINE_GAP_RED_STOP_RULES = [
  'no_track_a_migration',
  'no_wave_without_adr',
  'no_ad_survey_missions',
  'no_ui_only_engine_done',
  'trade_desk_defer_independent',
] as const;

export type EngineGapRedStopRule = (typeof ENGINE_GAP_RED_STOP_RULES)[number];

/** Artifacts that must exist for E0 closeout. */
export const ENGINE_GAP_E0_ARTIFACT_PATHS = [
  ENGINE_GAP_ADR_PATH,
  'apps/web/src/domain/engine-gap-adr-display-contract.ts',
  'apps/web/src/domain/__tests__/engine-gap-adr-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E0_APPROVAL.md',
] as const;

export const ENGINE_GAP_E0_TEST_PATHS = [
  'apps/web/src/domain/__tests__/engine-gap-adr-display-contract.test.ts',
] as const;

export function assertEngineGapE0Sync(): void {
  if (ENGINE_GAP_E0_TODO !== 'ew-e0-adr-approval') {
    throw new Error('E0 todo id drift');
  }
  if (ENGINE_GAP_E0_PREREQUISITE_TODO !== 'launch-scale-t2-triggers') {
    throw new Error('E0 prerequisite must be launch-scale-t2-triggers');
  }
  if (ENGINE_GAP_E0_NEXT_TODO !== 'ew-e1-decay-wave') {
    throw new Error('E0 next must be ew-e1-decay-wave');
  }
  if (ENGINE_GAP_E0_MIGRATION_IN_THIS_TODO !== false) {
    throw new Error('E0 must keep migration-in-this-todo false');
  }
  if (ENGINE_GAP_WAVES.length !== 10) {
    throw new Error('E0 must pin E1–E10 (10 waves)');
  }
  if (ENGINE_GAP_WAVES[0] !== 'E1' || ENGINE_GAP_WAVES[9] !== 'E10') {
    throw new Error('E0 wave bounds must be E1..E10');
  }
  if (!ENGINE_GAP_PERMANENT_EXCLUSIONS.includes('ad_watch_mission')) {
    throw new Error('E0 must permanently exclude ad watch missions');
  }
  if (!ENGINE_GAP_PERMANENT_EXCLUSIONS.includes('survey_mission')) {
    throw new Error('E0 must permanently exclude survey missions');
  }
  if (ENGINE_GAP_RED_STOP_RULES.length !== 5) {
    throw new Error('E0 must pin 5 RED STOP rules');
  }
}
