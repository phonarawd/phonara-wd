import { describe, expect, it } from 'vitest';
import {
  computeLagMs,
  evaluateIngestHealthStatus,
  nextWakeDelayMs,
  shouldRunScheduledTick,
} from './ingest-orchestrator';

describe('shouldRunScheduledTick', () => {
  it('runs immediately when never run', () => {
    expect(shouldRunScheduledTick(null, 60_000, 1_000_000)).toBe(true);
  });

  it('waits until interval elapsed', () => {
    expect(shouldRunScheduledTick(900_000, 60_000, 950_000)).toBe(false);
    expect(shouldRunScheduledTick(900_000, 60_000, 960_000)).toBe(true);
  });
});

describe('evaluateIngestHealthStatus', () => {
  it('marks stale when lag exceeds threshold', () => {
    expect(
      evaluateIngestHealthStatus({
        lagMs: 200_000,
        staleMs: 180_000,
        errored: false,
        disabled: false,
      }),
    ).toBe('stale');
  });

  it('marks error over stale', () => {
    expect(
      evaluateIngestHealthStatus({
        lagMs: 200_000,
        staleMs: 180_000,
        errored: true,
        disabled: false,
      }),
    ).toBe('error');
  });
});

describe('computeLagMs', () => {
  it('returns null without last success', () => {
    expect(computeLagMs(null, 1000)).toBeNull();
  });

  it('computes positive lag', () => {
    expect(computeLagMs(100, 250)).toBe(150);
  });
});

describe('nextWakeDelayMs', () => {
  it('returns 0 when rest tick is due', () => {
    const delay = nextWakeDelayMs(
      {
        rest: { lastRunAtMs: 0, lastSuccessAtMs: 0 },
        ws: { lastRunAtMs: 0, lastSuccessAtMs: 0 },
        settle: { lastRunAtMs: Date.now(), lastSuccessAtMs: Date.now() },
        orchestrator: { lastRunAtMs: 0, lastSuccessAtMs: 0 },
      },
      {
        restIntervalMs: 60_000,
        settleIntervalMs: 900_000,
        alertSyncIntervalMs: 600_000,
        restStaleMs: 900_000,
        wsStaleMs: 180_000,
        settleStaleMs: 3_600_000,
        wsEnabled: true,
      },
      120_000,
    );
    expect(delay).toBe(0);
  });
});
