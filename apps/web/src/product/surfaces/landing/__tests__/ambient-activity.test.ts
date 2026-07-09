import { describe, expect, it } from 'vitest';

import { LANDING_MISSION_TEASERS } from '@/domain/landing-display-contract';

import { buildAmbientActivityLines, resolveAmbientRotationMs } from '../ambient-activity';

describe('ambient-activity', () => {
  it('builds masked-nick lines from live mission catalog and signup bot', () => {
    const lines = buildAmbientActivityLines({
      count: 12,
      seed: 42,
      missions: LANDING_MISSION_TEASERS,
    });
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line.maskedNick).toMatch(/\*\*$/);
      if (line.kind === 'mission') {
        expect(line.rewardLabel).toMatch(/\+/);
      }
    }
    expect(lines.some((line) => line.kind === 'signup')).toBe(true);
    expect(lines.some((line) => line.kind === 'mission')).toBe(true);
  });

  it('avoids duplicate nick+mission pairs within a session batch', () => {
    const lines = buildAmbientActivityLines({
      count: 6,
      seed: 99,
      missions: LANDING_MISSION_TEASERS,
    });
    const keys = lines.map((line) =>
      line.kind === 'signup'
        ? `signup:${line.maskedNick}`
        : `mission:${line.maskedNick}:${line.missionTitleKey}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('uses slower rotation overnight', () => {
    const day = resolveAmbientRotationMs(new Date('2026-07-04T14:00:00'));
    const night = resolveAmbientRotationMs(new Date('2026-07-04T03:00:00'));

    expect(day).toBeGreaterThanOrEqual(4000);
    expect(day).toBeLessThanOrEqual(8000);
    expect(night).toBeGreaterThanOrEqual(6500);
    expect(night).toBeLessThanOrEqual(11000);

    const peakMidpoint = (4000 + 8000) / 2;
    const offPeakMidpoint = (6500 + 11000) / 2;
    expect(peakMidpoint).toBeLessThan(offPeakMidpoint);
  });
});
