/**
 * P4-C — Trade desk release / rollback + version compatibility (Plan trade_desk_qa_audit · v4 E5).
 * Pre-deploy → deploy → post-deploy ladder · rollback triggers · 15min checklist · cache note.
 *
 * Authority: TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md · P4-D forward-fix only
 */

export const TRADE_DESK_RELEASE_ROLLBACK_TODO = 'p4-release-rollback' as const;

export const TRADE_DESK_RELEASE_ROLLBACK_DOC =
  'docs/OPERATIONS/TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md' as const;

export const TRADE_DESK_RELEASE_ROLLBACK_E0_SLOT =
  'docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/rollback-dry-run-2026-07-08.md' as const;

export const TRADE_DESK_MIGRATIONS_LOCK_PATH = 'supabase/migrations.lock.json' as const;

/** Operator rollback dry-run target (minutes). Plan P4-C DoD. */
export const TRADE_DESK_ROLLBACK_DRY_RUN_MINUTES = 15 as const;

export type VersionCompatibilityVerdict = 'SUPPORTED' | 'SKEW-RISK' | 'UNSUPPORTED';

export type VersionCompatibilityRow = {
  readonly id: string;
  readonly frontend: string;
  readonly backend: string;
  readonly verdict: VersionCompatibilityVerdict;
  readonly action: string;
};

export type ReleaseRollbackPhase = 'pre-deploy' | 'deploy' | 'post-deploy';

export type ReleaseRollbackPhaseRow = {
  readonly phase: ReleaseRollbackPhase;
  readonly authority: string;
  readonly check: string;
};

export type RollbackTriggerRow = {
  readonly id: string;
  readonly trigger: string;
  readonly signal: string;
  readonly firstAction: string;
};

export type RollbackChecklistStep = {
  readonly step: number;
  readonly minutes: string;
  readonly action: string;
  readonly confirm: string;
};

/** Exactly five compatibility rows (Plan v4 E5). */
export const TRADE_DESK_VERSION_COMPATIBILITY_MATRIX: readonly VersionCompatibilityRow[] = [
  {
    id: 'parity',
    frontend: 'vN',
    backend: 'vN (parity)',
    verdict: 'SUPPORTED',
    action: 'Normal deploy · CI 4 jobs green',
  },
  {
    id: 'frontend-ahead',
    frontend: 'vN+1',
    backend: 'vN',
    verdict: 'SKEW-RISK',
    action: 'Do not deploy frontend alone ahead — only when API contract is non-breaking',
  },
  {
    id: 'backend-ahead',
    frontend: 'vN',
    backend: 'vN+1',
    verdict: 'SKEW-RISK',
    action: 'When migration leads: feature flag or simultaneous deploy',
  },
  {
    id: 'both-new-compatible',
    frontend: 'vN+1',
    backend: 'vN+1 (new RPC field)',
    verdict: 'SUPPORTED',
    action: 'P4-D approval + contract test · backward compatible · advisor 0',
  },
  {
    id: 'frontend-rollback-backend-applied',
    frontend: 'vN-1 (rollback)',
    backend: 'vN (migration applied)',
    verdict: 'UNSUPPORTED',
    action: 'forward-fix only — no DB migration rollback',
  },
] as const;

export const TRADE_DESK_RELEASE_ROLLBACK_PHASES: readonly ReleaseRollbackPhaseRow[] = [
  {
    phase: 'pre-deploy',
    authority: 'CI quality · sql · e2e · advisors green',
    check: 'bun run ci:status',
  },
  {
    phase: 'deploy',
    authority: 'frontend CDN/hosting artifact',
    check: 'trade-desk-smoke subset · record deploy sha',
  },
  {
    phase: 'post-deploy',
    authority: '24h soak spotcheck',
    check: 'WARNING 0 · Launch RC §4D',
  },
] as const;

export const TRADE_DESK_ROLLBACK_TRIGGERS: readonly RollbackTriggerRow[] = [
  {
    id: 'money-e2e-fail',
    trigger: 'Money E2E fail',
    signal: 'CI e2e wallet/trade conservation red',
    firstAction: 'submit halt · incident · rollback checklist',
  },
  {
    id: 'sigma-drift',
    trigger: 'Σ≠0',
    signal: 'conservation_test · soak SQL drift',
    firstAction: 'review trade kill switch · P0-0 formula',
  },
  {
    id: 'advisor-error',
    trigger: 'Advisor ERROR',
    signal: 'CI advisors job red',
    firstAction: 'RPC/RLS — frontend rollback alone may not resolve',
  },
  {
    id: 'soak-critical',
    trigger: 'Soak CRITICAL',
    signal: '24h spotcheck CRITICAL',
    firstAction: 'T0 oracle runbook',
  },
] as const;

/** 15-minute operator rollback checklist (6 steps). */
export const TRADE_DESK_ROLLBACK_CHECKLIST: readonly RollbackChecklistStep[] = [
  {
    step: 1,
    minutes: '0–2',
    action: 'Classify CI/alert trigger (Money vs UI vs Security)',
    confirm: 'incident category',
  },
  {
    step: 2,
    minutes: '2–5',
    action: 'Frontend: redeploy previous deploy artifact SHA',
    confirm: 'prior deploy log row',
  },
  {
    step: 3,
    minutes: '5–7',
    action: 'Cache: CDN purge · hard refresh',
    confirm: 'Browser/CDN cache section',
  },
  {
    step: 4,
    minutes: '7–10',
    action: 'Backend: no migration rollback — forward-fix only',
    confirm: 'avoid UNSUPPORTED compatibility row',
  },
  {
    step: 5,
    minutes: '10–12',
    action: 'Smoke: /trade · /trade/futures load',
    confirm: 'trade-desk-smoke subset',
  },
  {
    step: 6,
    minutes: '12–15',
    action: 'E0 incident + deploy log rollback row · section 15 (a)–(e)',
    confirm: 'ops-window',
  },
] as const;

/** v5 V4 — CDN/browser cache skew mitigation (1-line cache note in DoD). */
export const TRADE_DESK_ROLLBACK_CACHE_NOTE =
  'After rollback, CDN edge or browser cache may retain new JS chunks — Vite content-hash · CDN purge · hard refresh · PWA trade path N/A' as const;

export type ClassifyVersionCompatibilityOptions = {
  readonly backwardCompatible?: boolean;
  readonly frontendRollback?: boolean;
  readonly migrationAppliedOnBackend?: boolean;
};

/**
 * Classifies frontend/backend generation skew per P4-C matrix.
 * Generations are relative integers: 0 = paired release, +1 = ahead, -1 = rolled back frontend.
 */
export function classifyVersionCompatibility(
  frontendGeneration: number,
  backendGeneration: number,
  options: ClassifyVersionCompatibilityOptions = {},
): VersionCompatibilityVerdict {
  const {
    backwardCompatible = false,
    frontendRollback = false,
    migrationAppliedOnBackend = false,
  } = options;

  if (frontendRollback && migrationAppliedOnBackend && frontendGeneration < backendGeneration) {
    return 'UNSUPPORTED';
  }
  if (frontendGeneration === backendGeneration) {
    if (frontendGeneration > 0 && !backwardCompatible) {
      return 'SKEW-RISK';
    }
    return 'SUPPORTED';
  }
  if (frontendGeneration > backendGeneration || backendGeneration > frontendGeneration) {
    if (
      frontendGeneration > backendGeneration &&
      backwardCompatible &&
      frontendGeneration - backendGeneration === 1
    ) {
      return 'SUPPORTED';
    }
    return 'SKEW-RISK';
  }
  return 'SKEW-RISK';
}

export function findVersionCompatibilityRow(id: string): VersionCompatibilityRow | undefined {
  return TRADE_DESK_VERSION_COMPATIBILITY_MATRIX.find((row) => row.id === id);
}

export function assertTradeDeskReleaseRollbackSync(): void {
  if (TRADE_DESK_VERSION_COMPATIBILITY_MATRIX.length !== 5) {
    throw new Error('trade-desk-release-rollback: compatibility matrix must be exactly 5 rows');
  }
  if (TRADE_DESK_RELEASE_ROLLBACK_PHASES.length !== 3) {
    throw new Error('trade-desk-release-rollback: release phases must be 3');
  }
  if (TRADE_DESK_ROLLBACK_TRIGGERS.length < 4) {
    throw new Error('trade-desk-release-rollback: rollback triggers too few');
  }
  if (TRADE_DESK_ROLLBACK_CHECKLIST.length !== 6) {
    throw new Error('trade-desk-release-rollback: rollback checklist must be 6 steps');
  }
  const verdicts = new Set(TRADE_DESK_VERSION_COMPATIBILITY_MATRIX.map((r) => r.verdict));
  if (!verdicts.has('SUPPORTED') || !verdicts.has('SKEW-RISK') || !verdicts.has('UNSUPPORTED')) {
    throw new Error(
      'trade-desk-release-rollback: matrix must include SUPPORTED, SKEW-RISK, UNSUPPORTED',
    );
  }
  if (!TRADE_DESK_ROLLBACK_CACHE_NOTE.includes('CDN')) {
    throw new Error('trade-desk-release-rollback: cache note must mention CDN');
  }
}
