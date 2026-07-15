import { describe, expect, it } from 'vitest';

import {
  PLATFORM_PPR_REVIEW_WINDOWS,
  PLATFORM_R12_DRILL_SCHEDULE,
  PLATFORM_R12_RC_SHA,
  PLATFORM_R12_SECRETS_ROTATION,
  assertPlatformR12PostReleaseSync,
  platformR12PendingPprReviews,
  platformR12PprDueAt,
  platformR12PprSchedule,
  platformR12ProductionNormalVerdict,
} from '../platform-r12-post-release-display-contract';

describe('platform-r12-post-release-display-contract', () => {
  it('registers 3 PPR windows, drill schedule, secrets rotation rows', () => {
    assertPlatformR12PostReleaseSync();
    expect(PLATFORM_PPR_REVIEW_WINDOWS).toHaveLength(3);
    expect(PLATFORM_R12_DRILL_SCHEDULE).toHaveLength(3);
    expect(PLATFORM_R12_SECRETS_ROTATION.length).toBeGreaterThanOrEqual(4);
    expect(PLATFORM_R12_RC_SHA).toHaveLength(40);
  });

  it('computes PPR due dates from RC anchor', () => {
    expect(platformR12PprDueAt(24)).toBe('2026-07-14T09:00:00+09:00');
    expect(platformR12PprDueAt(72)).toBe('2026-07-16T09:00:00+09:00');
    expect(platformR12PprDueAt(168)).toBe('2026-07-20T09:00:00+09:00');
    const schedule = platformR12PprSchedule();
    expect(schedule.map((row) => row.dueAt)).toEqual([
      '2026-07-14T09:00:00+09:00',
      '2026-07-16T09:00:00+09:00',
      '2026-07-20T09:00:00+09:00',
    ]);
  });

  it('production normal pending while all PPR reviews pending', () => {
    expect(platformR12PendingPprReviews()).toHaveLength(3);
    expect(platformR12ProductionNormalVerdict()).toBe('pending_ppr');
  });
});
