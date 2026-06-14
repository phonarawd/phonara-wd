import { describe, expect, it } from 'vitest';
import { assertRtpHarness, runRtpHarness } from './rtp-harness';

const SEEDS = 100_000;
const EPSILON = 0.015;

describe('RTP harness', () => {
  it(`measured RTP within ε=${EPSILON} of theoretical (${SEEDS} seeds)`, async () => {
    const results = await runRtpHarness({
      seeds: SEEDS,
      epsilon: EPSILON,
      defaultSelections: {},
    });
    expect(results.length).toBeGreaterThan(0);
    assertRtpHarness(results);
  }, 120_000);
});
