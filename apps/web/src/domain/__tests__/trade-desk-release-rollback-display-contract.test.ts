import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertTradeDeskReleaseRollbackSync,
  classifyVersionCompatibility,
  TRADE_DESK_ROLLBACK_CHECKLIST,
  TRADE_DESK_RELEASE_ROLLBACK_PHASES,
  TRADE_DESK_RELEASE_ROLLBACK_TODO,
  TRADE_DESK_ROLLBACK_CACHE_NOTE,
  TRADE_DESK_ROLLBACK_DRY_RUN_MINUTES,
  TRADE_DESK_ROLLBACK_TRIGGERS,
  TRADE_DESK_VERSION_COMPATIBILITY_MATRIX,
} from '../trade-desk-release-rollback-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('trade-desk-release-rollback-display-contract · P4-C', () => {
  it('registers P4-C todo · 5-row matrix · 15min checklist', () => {
    expect(TRADE_DESK_RELEASE_ROLLBACK_TODO).toBe('p4-release-rollback');
    expect(TRADE_DESK_VERSION_COMPATIBILITY_MATRIX).toHaveLength(5);
    expect(TRADE_DESK_RELEASE_ROLLBACK_PHASES).toHaveLength(3);
    expect(TRADE_DESK_ROLLBACK_TRIGGERS.length).toBeGreaterThanOrEqual(4);
    expect(TRADE_DESK_ROLLBACK_CHECKLIST).toHaveLength(6);
    expect(TRADE_DESK_ROLLBACK_DRY_RUN_MINUTES).toBe(15);
    expect(TRADE_DESK_ROLLBACK_CACHE_NOTE).toContain('CDN');
    assertTradeDeskReleaseRollbackSync();
  });

  it('classifies version compatibility per matrix rules', () => {
    expect(classifyVersionCompatibility(0, 0)).toBe('SUPPORTED');
    expect(classifyVersionCompatibility(1, 0)).toBe('SKEW-RISK');
    expect(classifyVersionCompatibility(0, 1)).toBe('SKEW-RISK');
    expect(classifyVersionCompatibility(1, 1, { backwardCompatible: true })).toBe('SUPPORTED');
    expect(
      classifyVersionCompatibility(-1, 0, {
        frontendRollback: true,
        migrationAppliedOnBackend: true,
      }),
    ).toBe('UNSUPPORTED');
  });

  it('wires operator runbook · E0 rollback dry-run · failure recovery cross-ref', () => {
    const runbook = readRepo('docs/OPERATIONS/TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md');
    const e0 = readRepo(
      'docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/rollback-dry-run-2026-07-08.md',
    );
    const failure = readRepo('docs/OPERATIONS/TRADE_DESK_FAILURE_RECOVERY_MATRIX.md');
    const launchRc = readRepo('docs/OPERATIONS/TRADE_DESK_LAUNCH_RC_SIGNOFF.md');

    expect(runbook).toContain('P4-C');
    expect(runbook).toContain('p4-release-rollback');
    expect(runbook).toContain('Version Compatibility');
    expect(runbook).toContain('SUPPORTED');
    expect(runbook).toContain('SKEW-RISK');
    expect(runbook).toContain('UNSUPPORTED');
    expect(runbook).toContain('forward-fix only');
    expect(runbook).toContain('migration_list_hash');
    expect(runbook).toContain('CDN');
    expect(runbook).toContain('PWA');
    expect(TRADE_DESK_ROLLBACK_CACHE_NOTE).toContain('CDN');

    expect(e0).toContain('p4-release-rollback');
    expect(e0).toContain('TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md');

    expect(failure).toContain('§15');
    expect(launchRc).toContain('trade-desk-smoke');

    for (const row of TRADE_DESK_VERSION_COMPATIBILITY_MATRIX) {
      expect(runbook).toContain(row.verdict);
    }
    for (const step of TRADE_DESK_ROLLBACK_CHECKLIST) {
      expect(runbook).toContain(String(step.step));
    }
    for (const trigger of TRADE_DESK_ROLLBACK_TRIGGERS) {
      expect(runbook).toContain(trigger.trigger);
    }
  });
});
