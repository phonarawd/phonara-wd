import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertTradeDeskFailureRecoverySync,
  ORACLE_FREEZE_INCIDENT_ESCALATION,
  resolveOraclePriceFrozen,
  TRADE_DESK_FAILURE_RECOVERY_TIER1,
  TRADE_DESK_FAILURE_RECOVERY_TIER2,
  TRADE_DESK_FAILURE_RECOVERY_TODO,
  TRADE_ORACLE_PRICE_FREEZE_SECONDS,
} from '../trade-desk-failure-recovery-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('trade-desk-failure-recovery-display-contract · P4-A', () => {
  it('registers P4-A todo and tier counts', () => {
    expect(TRADE_DESK_FAILURE_RECOVERY_TODO).toBe('p4-failure-recovery');
    expect(TRADE_DESK_FAILURE_RECOVERY_TIER1.length).toBeGreaterThanOrEqual(5);
    expect(TRADE_DESK_FAILURE_RECOVERY_TIER2.length).toBeGreaterThanOrEqual(4);
    expect(ORACLE_FREEZE_INCIDENT_ESCALATION).toHaveLength(4);
    expect(TRADE_ORACLE_PRICE_FREEZE_SECONDS).toBe(60);
    assertTradeDeskFailureRecoverySync();
  });

  it('classifies oracle freeze separately from lag (stale)', () => {
    const now = 1_700_000_000_000;
    const lastChange = now - 61_000;
    expect(resolveOraclePriceFrozen(lastChange, now, false)).toBe(true);
    expect(resolveOraclePriceFrozen(lastChange, now, true)).toBe(false);
    expect(resolveOraclePriceFrozen(now - 30_000, now, false)).toBe(false);
  });

  it('wires operator matrix doc · T0 runbook cross-ref · E0 slot', () => {
    const matrix = readRepo('docs/OPERATIONS/TRADE_DESK_FAILURE_RECOVERY_MATRIX.md');
    const t0 = readRepo('docs/OPERATIONS/TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md');
    const e0 = readRepo(
      'docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/failure-recovery-matrix.md',
    );

    expect(matrix).toContain('P4-A');
    expect(matrix).toContain('Tier 1');
    expect(matrix).toContain('Tier 2');
    expect(matrix).toContain('Oracle Freeze');
    expect(matrix).toContain('TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md');

    expect(t0).toContain('P4-A');
    expect(t0).toContain('TRADE_DESK_FAILURE_RECOVERY_MATRIX');

    expect(e0).toContain('p4-failure-recovery');
    expect(e0).toContain('TRADE_DESK_FAILURE_RECOVERY_MATRIX.md');

    expect(matrix).toContain('partial stale price');
    expect(matrix).toContain('Price feed freeze');
    for (const step of ORACLE_FREEZE_INCIDENT_ESCALATION) {
      expect(matrix).toContain(String(step.step));
    }
  });
});
