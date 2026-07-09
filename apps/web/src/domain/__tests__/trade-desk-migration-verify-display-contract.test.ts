import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertTradeDeskMigrationVerifySync,
  evaluateMigrationTouch,
  TRADE_DESK_MIGRATION_APPROVAL_GATES,
  TRADE_DESK_MIGRATION_BYPASS_DENY,
  TRADE_DESK_MIGRATION_DEFAULT_TIERS,
  TRADE_DESK_MIGRATION_LADDER,
  TRADE_DESK_MIGRATION_OPERATOR_SIGNOFF_SLOT,
  TRADE_DESK_MIGRATION_SECURITY_AUDITOR_SLOT,
  TRADE_DESK_MIGRATION_VERIFY_TODO,
} from '../trade-desk-migration-verify-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('trade-desk-migration-verify-display-contract · P4-D', () => {
  it('registers P4-D todo · 3 approval gates · 8-step ladder · bypass deny', () => {
    expect(TRADE_DESK_MIGRATION_VERIFY_TODO).toBe('p4-migration-verify');
    expect(TRADE_DESK_MIGRATION_APPROVAL_GATES).toHaveLength(3);
    expect(TRADE_DESK_MIGRATION_LADDER).toHaveLength(8);
    expect(TRADE_DESK_MIGRATION_BYPASS_DENY.length).toBeGreaterThanOrEqual(6);
    expect(TRADE_DESK_MIGRATION_DEFAULT_TIERS).toContain('P0');
    expect(TRADE_DESK_MIGRATION_DEFAULT_TIERS).toContain('P3');
    assertTradeDeskMigrationVerifySync();
  });

  it('evaluates migration touch under engine freeze + approval gates', () => {
    expect(
      evaluateMigrationTouch({
        tier: 'P1',
        operatorSignoff: false,
        securityAuditorPass: false,
        uiOnlySufficient: true,
        migrationUnavoidable: false,
      }),
    ).toBe('DENIED_FREEZE');

    expect(
      evaluateMigrationTouch({
        tier: 'P1-C',
        operatorSignoff: false,
        securityAuditorPass: true,
        uiOnlySufficient: false,
        migrationUnavoidable: true,
      }),
    ).toBe('DENIED_APPROVAL');

    expect(
      evaluateMigrationTouch({
        tier: 'P4',
        operatorSignoff: true,
        securityAuditorPass: true,
        uiOnlySufficient: false,
        migrationUnavoidable: true,
      }),
    ).toBe('ALLOWED');
  });

  it('wires operator doc · E0 ladder · rollback runbook · engine freeze cross-ref', () => {
    const doc = readRepo('docs/OPERATIONS/TRADE_DESK_MIGRATION_VERIFICATION.md');
    const e0 = readRepo(
      'docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/migration-verify-ladder.md',
    );
    const runbook = readRepo('docs/OPERATIONS/TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md');
    const operatorSignoff = readRepo(TRADE_DESK_MIGRATION_OPERATOR_SIGNOFF_SLOT);
    const auditorReview = readRepo(TRADE_DESK_MIGRATION_SECURITY_AUDITOR_SLOT);

    expect(doc).toContain('P4-D');
    expect(doc).toContain('p4-migration-verify');
    expect(doc).toContain('서면 승인');
    expect(doc).toContain('security-auditor');
    expect(doc).toContain('stack:push-remote');
    expect(doc).toContain('test:sql');
    expect(doc).toContain('우회');
    expect(doc).toContain('forward-fix only');

    expect(e0).toContain('p4-migration-verify');
    expect(e0).toContain('TRADE_DESK_MIGRATION_VERIFICATION.md');

    expect(runbook).toContain('P4-D');
    expect(runbook).toContain('forward-fix only');

    expect(operatorSignoff).toContain('Operator sign-off');
    expect(auditorReview).toContain('security-auditor');

    for (const gate of TRADE_DESK_MIGRATION_APPROVAL_GATES) {
      expect(doc).toContain(gate.gate === 'operator-signoff' ? 'operator-signoff' : gate.gate);
    }
    for (const step of TRADE_DESK_MIGRATION_LADDER) {
      expect(doc).toContain(String(step.step));
    }
    for (const deny of ['supabase db push', 'apply_migration', 'chat-only approval']) {
      expect(doc).toContain(deny);
    }
  });
});
