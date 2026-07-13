/**
 * R11 — Platform release closeout · Freeze · 3-Owner · Evidence retention (Plan platform-perfect-launch).
 * Authority: PLATFORM_RELEASE_FREEZE.md · PLATFORM_EVIDENCE_RETENTION.md · PLATFORM_AUDIT_RACI.md
 */

export const PLATFORM_R11_CLOSEOUT_TODO = 'audit-r11-closeout' as const;

export const PLATFORM_RELEASE_FREEZE_DOC = 'docs/OPERATIONS/PLATFORM_RELEASE_FREEZE.md' as const;

export const PLATFORM_RELEASE_FREEZE_YAML = 'docs/OPERATIONS/PLATFORM_RELEASE_FREEZE.yaml' as const;

export const PLATFORM_EVIDENCE_RETENTION_DOC =
  'docs/OPERATIONS/PLATFORM_EVIDENCE_RETENTION.md' as const;

export const PLATFORM_POST_RELEASE_REVIEW_DOC =
  'docs/OPERATIONS/PLATFORM_POST_RELEASE_REVIEW.md' as const;

export const PLATFORM_R11_EVIDENCE_DOC =
  'docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R11/r11-closeout-implement.md' as const;

/** RC SHA at R11 closeout — matches deploy parity R9 evidence. */
export const PLATFORM_R11_RC_SHA = 'dcfd8c7eab0374296ffeecdc5cd3f79433786ebe' as const;

export const PLATFORM_R11_KNOWN_GOOD_SHA = '9c4bf29b40d31b2d2952bd6257f5690d691ecbc2' as const;

export const PLATFORM_EVIDENCE_RETENTION_DAYS = 90 as const;

export const PLATFORM_EVIDENCE_PRIMARY_BUCKET = 'platform-audit-evidence' as const;

/** Playbook §46 — AI cannot sign; operator only. */
export const PLATFORM_THREE_OWNER_ROLES = ['security', 'runtime', 'product'] as const;

export type PlatformThreeOwnerRole = (typeof PLATFORM_THREE_OWNER_ROLES)[number];

export type PlatformReleaseGateStatus = 'pass' | 'fail' | 'pending' | 'waiver';

export type PlatformReleaseGateCriterion = {
  readonly id: string;
  readonly section: string;
  readonly label: string;
  readonly status: PlatformReleaseGateStatus;
  readonly blocker: boolean;
  readonly evidence: string;
};

/** Playbook §24 Release Approval checklist (R11 evidence index). */
export const PLATFORM_RELEASE_GATE_CRITERIA: readonly PlatformReleaseGateCriterion[] = [
  {
    id: 'dod-findings',
    section: '§24',
    label: 'Finding DoD — Critical/High OPEN 0 (Medium per R11 owner criteria)',
    status: 'pass',
    blocker: false,
    evidence:
      'R9-PERF-JS VERIFIED_FIXED (Phase 4 · 394≤450) · Critical/High OPEN 0 · H-09 BLOCKED_DEP (Pro+ entitlement, not code)',
  },
  {
    id: 'evidence-integrity',
    section: '§22',
    label: 'Evidence Integrity (SHA · timestamp · finding_id)',
    status: 'pass',
    blocker: false,
    evidence: 'PLATFORM_AUDIT_CLOSEOUT_EVIDENCE R0–R10',
  },
  {
    id: 'observability',
    section: '§39',
    label: 'Observability · Alert dry-fire',
    status: 'pass',
    blocker: false,
    evidence: 'EXT-01 · stack:ops-alert-dry-fire 6/6',
  },
  {
    id: 'deploy-parity',
    section: 'R8',
    label: 'Deployment SHA parity',
    status: 'pass',
    blocker: false,
    evidence: 'check:deploy-parity --remote 9/9 · releaseSha=dcfd8c7e',
  },
  {
    id: 'runtime-stage1',
    section: 'R9',
    label: 'Runtime Stage1 strict matrix',
    status: 'pass',
    blocker: false,
    evidence:
      'Phase 4 i18n lazy · local Stage1 initial JS 394.00 kB ≤450 · r9-perf-js-phase4-i18n-lazy.md',
  },
  {
    id: 'soak-sop',
    section: 'R10',
    label: 'Soak SOP · Trigger · five conditions',
    status: 'pass',
    blocker: false,
    evidence: 'PLATFORM_R10_ROLLOUT_SOAK · audit:r10-rollout',
  },
  {
    id: 'soak-24h-evidence',
    section: 'R10',
    label: 'Operator 24h soak snapshot Evidence',
    status: 'pending',
    blocker: true,
    evidence: 'r10-soak-24h-snapshot.md template — operator fill',
  },
  {
    id: 'rollback-validation',
    section: '§20',
    label: 'Rollback Validation ready',
    status: 'pending',
    blocker: false,
    evidence: 'r10-rollback-dry-run-template · drill 2026-08-13',
  },
  {
    id: 'risk-high-unmitigated',
    section: '§33',
    label: 'Risk Register High+ UNMITIGATED 0',
    status: 'pass',
    blocker: false,
    evidence: 'PLATFORM_AUDIT_RISK_REGISTER.yaml',
  },
  {
    id: 'slo-defined',
    section: '§41',
    label: 'SLO/SLA defined',
    status: 'pass',
    blocker: false,
    evidence: 'PLATFORM_SLO_SLA.yaml',
  },
  {
    id: 'incident-readiness',
    section: '§42',
    label: 'Incident Response readiness',
    status: 'pass',
    blocker: false,
    evidence: 'PLATFORM_INCIDENT_RESPONSE.md',
  },
  {
    id: 'dr-readiness',
    section: '§43',
    label: 'DR readiness Evidence',
    status: 'fail',
    blocker: true,
    evidence: 'DR drill never · next 2026-10-13',
  },
  {
    id: 'freeze-active',
    section: '§44',
    label: 'Release Freeze active',
    status: 'pass',
    blocker: false,
    evidence: 'PLATFORM_RELEASE_FREEZE.yaml freeze_status=active',
  },
  {
    id: 'evidence-retention-90d',
    section: '§45',
    label: 'Evidence Retention 90-day path',
    status: 'pass',
    blocker: false,
    evidence: 'platform-audit-evidence bucket · EXT-02',
  },
  {
    id: 'three-owner-signoff',
    section: '§46',
    label: '3-Owner Sign-off (Security · Runtime · Product)',
    status: 'pending',
    blocker: true,
    evidence: 'r11-3-owner-signoff-template.md — operator staggered sign',
  },
  {
    id: 'post-release-schedule',
    section: '§47',
    label: 'Post Release Review 24h/72h/7d schedule',
    status: 'pass',
    blocker: false,
    evidence: 'PLATFORM_POST_RELEASE_REVIEW.md RC+offsets',
  },
  {
    id: 'secrets-rotation',
    section: '§53',
    label: 'Secrets rotation deadline valid',
    status: 'pass',
    blocker: false,
    evidence: 'PLATFORM_SECRETS_ROTATION.md',
  },
] as const;

export type PlatformReleaseCandidateVerdict = 'yes' | 'no' | 'blocked';

export function platformR11ReleaseBlockers(): readonly PlatformReleaseGateCriterion[] {
  return PLATFORM_RELEASE_GATE_CRITERIA.filter(
    (row) => row.blocker && (row.status === 'fail' || row.status === 'pending'),
  );
}

export function platformR11ReleaseCandidateVerdict(): PlatformReleaseCandidateVerdict {
  const blockers = platformR11ReleaseBlockers();
  if (blockers.length > 0) {
    return 'blocked';
  }
  const anyFail = PLATFORM_RELEASE_GATE_CRITERIA.some((row) => row.status === 'fail');
  if (anyFail) {
    return 'no';
  }
  const anyPending = PLATFORM_RELEASE_GATE_CRITERIA.some((row) => row.status === 'pending');
  if (anyPending) {
    return 'blocked';
  }
  return 'yes';
}

export function assertPlatformR11CloseoutSync(): void {
  if (PLATFORM_THREE_OWNER_ROLES.length !== 3) {
    throw new Error('platform-r11-closeout: three owner roles must be exactly 3');
  }
  if (PLATFORM_RELEASE_GATE_CRITERIA.length < 10) {
    throw new Error('platform-r11-closeout: release gate criteria must be >= 10');
  }
  if (PLATFORM_EVIDENCE_RETENTION_DAYS !== 90) {
    throw new Error('platform-r11-closeout: evidence retention must be 90 days');
  }
  if (PLATFORM_R11_RC_SHA.length !== 40) {
    throw new Error('platform-r11-closeout: RC SHA must be 40-char git hash');
  }
  const ids = PLATFORM_RELEASE_GATE_CRITERIA.map((row) => row.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('platform-r11-closeout: release gate criterion ids must be unique');
  }
}
