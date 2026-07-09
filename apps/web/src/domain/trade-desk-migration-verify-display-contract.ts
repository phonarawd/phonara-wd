/**
 * P4-D — Trade desk migration verification ladder (Plan trade_desk_qa_audit · major #6).
 * Engine freeze: P0~P3 UI-only · migration touch = operator written signoff + security-auditor PASS only.
 * No bypass paths (raw db push · MCP apply_migration · chat-only approval).
 *
 * Authority: TRADE_DESK_MIGRATION_VERIFICATION.md · P4-C forward-fix only
 */

export const TRADE_DESK_MIGRATION_VERIFY_TODO = 'p4-migration-verify' as const;

export const TRADE_DESK_MIGRATION_VERIFICATION_DOC =
  'docs/OPERATIONS/TRADE_DESK_MIGRATION_VERIFICATION.md' as const;

export const TRADE_DESK_MIGRATION_VERIFY_E0_SLOT =
  'docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/migration-verify-ladder.md' as const;

/** E0 signoff row for operator written approval (not chat/email). */
export const TRADE_DESK_MIGRATION_OPERATOR_SIGNOFF_SLOT =
  'docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/migration-operator-signoff.md' as const;

/** E0 row for security-auditor pre-review before any migration apply. */
export const TRADE_DESK_MIGRATION_SECURITY_AUDITOR_SLOT =
  'docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/migration-security-auditor-review.md' as const;

export const TRADE_DESK_MIGRATIONS_LOCK_PATH = 'supabase/migrations.lock.json' as const;

export type MigrationApprovalGate = 'impossibility' | 'operator-signoff' | 'security-auditor';

export type MigrationApprovalGateRow = {
  readonly gate: MigrationApprovalGate;
  readonly requirement: string;
  readonly evidence: string;
  readonly invalidIf: string;
};

export type MigrationLadderStep = {
  readonly step: number;
  readonly phase: string;
  readonly action: string;
  readonly authority: string;
};

/** Forbidden bypass paths — engine freeze non-waivable (Plan P4-D · 96-prod-apply). */
export const TRADE_DESK_MIGRATION_BYPASS_DENY = [
  'supabase db push',
  'supabase migration up',
  'MCP apply_migration',
  'PHONARA_ALLOW_PROD_DB_PUSH',
  'chat-only approval',
  'email-only approval',
  'applied migration rollback',
  'down migration',
] as const;

/** P0~P3 default: zero migration touch. */
export const TRADE_DESK_MIGRATION_DEFAULT_TIERS = ['P0', 'P0-0', 'S0', 'P1', 'P2', 'P3'] as const;

/**
 * Three gates before any trade-desk-related migration (Plan P4-D · P1-C stage 2).
 * Order is fixed — later gates do not waive earlier ones.
 */
export const TRADE_DESK_MIGRATION_APPROVAL_GATES: readonly MigrationApprovalGateRow[] = [
  {
    gate: 'impossibility',
    requirement: 'UI-only or display contract insufficient — migration is unavoidable',
    evidence: 'Written rationale in E0 migration-verify-ladder (scope · RPC/RLS delta)',
    invalidIf: 'Claim "nice to have" or Engine Wave defer item without operator RED STOP',
  },
  {
    gate: 'operator-signoff',
    requirement: 'Operator written approval — signoff doc row only',
    evidence: TRADE_DESK_MIGRATION_OPERATOR_SIGNOFF_SLOT,
    invalidIf: 'Chat/email/verbal OK · missing date · missing migration filename',
  },
  {
    gate: 'security-auditor',
    requirement: 'security-auditor readonly pre-review PASS before local db reset',
    evidence: TRADE_DESK_MIGRATION_SECURITY_AUDITOR_SLOT,
    invalidIf: 'Auditor skipped · FAIL without remediation · post-apply review only',
  },
] as const;

/** Apply ladder after all three gates green (G13: agent local test:sql autonomous deny). */
export const TRADE_DESK_MIGRATION_LADDER: readonly MigrationLadderStep[] = [
  {
    step: 1,
    phase: 'preflight',
    action: 'Confirm 3 approval gates documented in E0 — engine freeze intact',
    authority: 'Plan P4-D · ACTIVE_WORK_SSOT engine freeze',
  },
  {
    step: 2,
    phase: 'draft',
    action: 'New migration file only — no retro-edit of remotely applied files',
    authority: '25-postgres-plpgsql · 20-supabase-safety',
  },
  {
    step: 3,
    phase: 'local',
    action: 'supabase db reset — apply-time SQL errors caught here',
    authority: 'operator or CI sql job (G13 agent deny)',
  },
  {
    step: 4,
    phase: 'local',
    action: 'bun run test:sql — Σ=0 per currency + hash-chain',
    authority: 'CI sql job authoritative · conservation_test.sql',
  },
  {
    step: 5,
    phase: 'local',
    action: 'Update grants_rls_inventory_test.sql when RLS/GRANT scope changes',
    authority: '25-postgres-plpgsql pairing rule',
  },
  {
    step: 6,
    phase: 'remote',
    action: 'bun run stack:push-remote only — no raw db push',
    authority: '96-prod-apply-agent-deny',
  },
  {
    step: 7,
    phase: 'remote',
    action: 'Remote security advisor 0 ERROR',
    authority: 'CI advisors job · MCP get_advisors',
  },
  {
    step: 8,
    phase: 'closeout',
    action: 'E0 ladder row + release runbook deploy log (frontend_sha, migration_list_hash)',
    authority: 'TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md §Compatibility',
  },
] as const;

export type MigrationTouchVerdict = 'ALLOWED' | 'DENIED_FREEZE' | 'DENIED_APPROVAL';

export type EvaluateMigrationTouchInput = {
  readonly tier: string;
  readonly operatorSignoff: boolean;
  readonly securityAuditorPass: boolean;
  readonly uiOnlySufficient: boolean;
  readonly migrationUnavoidable: boolean;
};

/**
 * Returns whether a migration touch is permitted under engine freeze + P4-D gates.
 * P0~P3 tiers deny by default unless all approval gates pass and UI-only is insufficient.
 */
export function evaluateMigrationTouch(input: EvaluateMigrationTouchInput): MigrationTouchVerdict {
  const tierUpper = input.tier.toUpperCase();
  const isDefaultFreezeTier = TRADE_DESK_MIGRATION_DEFAULT_TIERS.some(
    (t) => tierUpper === t || tierUpper.startsWith(`${t}-`) || tierUpper.startsWith(`${t}_`),
  );

  if (isDefaultFreezeTier && !input.migrationUnavoidable) {
    return 'DENIED_FREEZE';
  }
  if (input.uiOnlySufficient) {
    return 'DENIED_FREEZE';
  }
  if (!input.migrationUnavoidable) {
    return 'DENIED_FREEZE';
  }
  if (!input.operatorSignoff || !input.securityAuditorPass) {
    return 'DENIED_APPROVAL';
  }
  return 'ALLOWED';
}

export function assertTradeDeskMigrationVerifySync(): void {
  if (TRADE_DESK_MIGRATION_APPROVAL_GATES.length !== 3) {
    throw new Error('trade-desk-migration-verify: approval gates must be exactly 3');
  }
  if (TRADE_DESK_MIGRATION_LADDER.length !== 8) {
    throw new Error('trade-desk-migration-verify: migration ladder must be 8 steps');
  }
  if (TRADE_DESK_MIGRATION_BYPASS_DENY.length < 6) {
    throw new Error('trade-desk-migration-verify: bypass deny list too short');
  }
  const gateIds = new Set(TRADE_DESK_MIGRATION_APPROVAL_GATES.map((g) => g.gate));
  if (
    !gateIds.has('impossibility') ||
    !gateIds.has('operator-signoff') ||
    !gateIds.has('security-auditor')
  ) {
    throw new Error('trade-desk-migration-verify: missing required approval gate');
  }
  if (!TRADE_DESK_MIGRATION_BYPASS_DENY.includes('supabase db push')) {
    throw new Error('trade-desk-migration-verify: must deny raw supabase db push');
  }
}
