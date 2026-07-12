import { describe, expect, it } from 'vitest';

import { classifyEdgeOpsOutcome } from '../edge-ops-outcome-display-contract';

describe('edge-ops-outcome-display-contract (H-04)', () => {
  it('marks ok only when every source applied with zero failures', () => {
    expect(
      classifyEdgeOpsOutcome({
        applied: 42,
        rejected: 0,
        circuitOpen: 0,
        rpcFailed: 0,
        total: 42,
      }).status,
    ).toBe('ok');
  });

  it('never false-greens when submitted>0 but many failed (audit symptom)', () => {
    const outcome = classifyEdgeOpsOutcome({
      applied: 9,
      rejected: 24,
      circuitOpen: 9,
      rpcFailed: 0,
      total: 42,
    });
    expect(outcome.status).toBe('partial');
    expect(outcome.status).not.toBe('ok');
  });

  it('classifies all-circuit and missing-config separately', () => {
    expect(
      classifyEdgeOpsOutcome({
        applied: 0,
        rejected: 0,
        circuitOpen: 10,
        rpcFailed: 0,
        total: 10,
      }).status,
    ).toBe('circuit_open');

    expect(
      classifyEdgeOpsOutcome({
        applied: 0,
        rejected: 0,
        circuitOpen: 0,
        rpcFailed: 0,
        total: 2,
        missingConfig: 2,
      }).status,
    ).toBe('missing_config');
  });
});
