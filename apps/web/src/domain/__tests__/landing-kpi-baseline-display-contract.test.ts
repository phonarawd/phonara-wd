import { describe, expect, it } from 'vitest';

import {
  isLandingKpiBaselineReady,
  LANDING_KPI_ANALYTICS_EVENT_MAP,
  LANDING_KPI_BASELINE_STATUS,
  LANDING_KPI_METRIC_IDS,
} from '../landing-kpi-baseline-display-contract';

describe('landing-kpi-baseline-display-contract', () => {
  it('marks baseline as pending until operator records soft launch data', () => {
    expect(LANDING_KPI_BASELINE_STATUS).toBe('pending_soft_launch');
    expect(isLandingKpiBaselineReady()).toBe(false);
  });

  it('maps KPI metrics to analytics events', () => {
    expect(LANDING_KPI_METRIC_IDS).toContain('heroCtaCtr');
    expect(LANDING_KPI_ANALYTICS_EVENT_MAP.signupCompletion).toContain('landing.signup.completed');
  });
});
