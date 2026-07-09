/**
 * Landing KPI baseline — Phase 3 operator record (SUCCESS_METRICS §4).
 * TBD until soft launch — contract prevents "CVR 10" claims without data.
 */

export const LANDING_KPI_BASELINE_STATUS = 'pending_soft_launch' as const;

export type LandingKpiMetricId =
  | 'heroCtaCtr'
  | 'scroll50Rate'
  | 'signupCompletion'
  | 'missionPreviewClick';

export const LANDING_KPI_METRIC_IDS: readonly LandingKpiMetricId[] = [
  'heroCtaCtr',
  'scroll50Rate',
  'signupCompletion',
  'missionPreviewClick',
] as const;

/** Maps KPI metrics to analytics events used for measurement. */
export const LANDING_KPI_ANALYTICS_EVENT_MAP: Readonly<
  Record<LandingKpiMetricId, readonly string[]>
> = {
  heroCtaCtr: ['landing.hero.cta', 'landing.hero.viewed'],
  scroll50Rate: ['landing.scroll.50', 'landing.hero.viewed'],
  signupCompletion: ['landing.signup.completed', 'landing.signup.started'],
  missionPreviewClick: ['landing.mission.click', 'landing.mission.viewed'],
};

export type LandingKpiBaselineRow = {
  readonly metric: LandingKpiMetricId;
  readonly baseline: number | null;
  readonly target: number | null;
  readonly measurementStart: string | null;
};

/** Operator fills after Phase 3 soft launch — null = TBD. */
export const LANDING_KPI_BASELINE_ROWS: readonly LandingKpiBaselineRow[] = [
  { metric: 'heroCtaCtr', baseline: null, target: null, measurementStart: null },
  { metric: 'scroll50Rate', baseline: null, target: null, measurementStart: null },
  { metric: 'signupCompletion', baseline: null, target: null, measurementStart: null },
  { metric: 'missionPreviewClick', baseline: null, target: null, measurementStart: null },
];

export function isLandingKpiBaselineReady(): boolean {
  return LANDING_KPI_BASELINE_ROWS.every((row) => row.baseline !== null && row.target !== null);
}
