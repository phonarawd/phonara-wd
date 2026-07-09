import { describe, expect, it } from 'vitest';

import {
  LANDING_MEMBER_BOT_BASE,
  nudgePresentationSignupConcurrency,
  resolveLandingMemberDisplay,
  resolvePresentationMemberCount,
  resolvePresentationSignupConcurrency,
} from '@/domain/landing-member-bot';

describe('landing-member-bot', () => {
  it('never returns zero members on presentation path', () => {
    const at = new Date('2026-07-05T12:00:00+09:00');
    expect(resolvePresentationMemberCount(at, 42)).toBeGreaterThanOrEqual(LANDING_MEMBER_BOT_BASE);
    expect(resolveLandingMemberDisplay(0, at)).toBeGreaterThanOrEqual(LANDING_MEMBER_BOT_BASE);
    expect(resolveLandingMemberDisplay(undefined, at)).toBeGreaterThanOrEqual(
      LANDING_MEMBER_BOT_BASE,
    );
  });

  it('uses live count only when at or above million-user baseline', () => {
    expect(resolveLandingMemberDisplay(500)).toBeGreaterThanOrEqual(LANDING_MEMBER_BOT_BASE);
    expect(resolveLandingMemberDisplay(12_000)).toBeGreaterThanOrEqual(LANDING_MEMBER_BOT_BASE);
    expect(resolveLandingMemberDisplay(1_250_000)).toBe(1_250_000);
  });

  it('keeps signup concurrency in a believable band', () => {
    const peak = resolvePresentationSignupConcurrency(new Date('2026-07-05T14:00:00+09:00'), 7);
    const offPeak = resolvePresentationSignupConcurrency(new Date('2026-07-05T03:00:00+09:00'), 7);
    expect(peak).toBeGreaterThanOrEqual(100);
    expect(offPeak).toBeGreaterThanOrEqual(40);
    expect(peak).toBeGreaterThan(offPeak);
  });

  it('nudges signup concurrency without huge jumps', () => {
    const next = nudgePresentationSignupConcurrency(200, new Date('2026-07-05T14:00:00+09:00'), 11);
    expect(Math.abs(next - 200)).toBeLessThanOrEqual(12);
  });
});
