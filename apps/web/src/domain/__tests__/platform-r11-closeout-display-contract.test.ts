import { describe, expect, it } from 'vitest';

import {
  PLATFORM_EVIDENCE_RETENTION_DAYS,
  PLATFORM_RELEASE_GATE_CRITERIA,
  PLATFORM_THREE_OWNER_ROLES,
  assertPlatformR11CloseoutSync,
  platformR11ReleaseBlockers,
  platformR11ReleaseCandidateVerdict,
} from '../platform-r11-closeout-display-contract';

describe('platform-r11-closeout-display-contract', () => {
  it('registers three owners, 90-day retention, release gate criteria', () => {
    assertPlatformR11CloseoutSync();
    expect(PLATFORM_THREE_OWNER_ROLES).toEqual(['security', 'runtime', 'product']);
    expect(PLATFORM_EVIDENCE_RETENTION_DAYS).toBe(90);
    expect(PLATFORM_RELEASE_GATE_CRITERIA.length).toBeGreaterThanOrEqual(10);
  });

  it('release candidate blocked while R9-PERF-JS and signoff pending', () => {
    expect(platformR11ReleaseCandidateVerdict()).toBe('blocked');
    const blockers = platformR11ReleaseBlockers().map((row) => row.id);
    expect(blockers).toContain('runtime-stage1');
    expect(blockers).toContain('three-owner-signoff');
  });
});
