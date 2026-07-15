/**
 * R12 — Platform post-release review · PPR 24h/72h/7d · DR drill · Secrets rotation (Plan platform-perfect-launch).
 * Authority: PLATFORM_POST_RELEASE_REVIEW.md · PLATFORM_DRILL_CALENDAR.md · PLATFORM_SECRETS_ROTATION.md
 */

export const PLATFORM_R12_POST_RELEASE_TODO = 'audit-r12-post-release' as const;

export const PLATFORM_POST_RELEASE_REVIEW_DOC =
  'docs/OPERATIONS/PLATFORM_POST_RELEASE_REVIEW.md' as const;

export const PLATFORM_POST_RELEASE_REVIEW_YAML =
  'docs/OPERATIONS/PLATFORM_POST_RELEASE_REVIEW.yaml' as const;

export const PLATFORM_DRILL_CALENDAR_DOC = 'docs/OPERATIONS/PLATFORM_DRILL_CALENDAR.md' as const;

export const PLATFORM_SECRETS_ROTATION_DOC =
  'docs/OPERATIONS/PLATFORM_SECRETS_ROTATION.md' as const;

export const PLATFORM_SECRETS_ROTATION_YAML =
  'docs/OPERATIONS/PLATFORM_SECRETS_ROTATION.yaml' as const;

export const PLATFORM_R12_EVIDENCE_DOC =
  'docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-post-release-implement.md' as const;

/** RC SHA at R11 Freeze — PPR window anchor. */
export const PLATFORM_R12_RC_SHA = 'dcfd8c7eab0374296ffeecdc5cd3f79433786ebe' as const;

/** R11 Freeze RC declared at (KST) — PPR offset anchor. */
export const PLATFORM_R12_RC_DECLARED_AT = '2026-07-13T09:00:00+09:00' as const;

export type PlatformPprWindowId = '24h' | '72h' | '7d';

export type PlatformPprReviewStatus = 'pending' | 'pass' | 'fail';

export type PlatformPprReviewWindow = {
  readonly id: PlatformPprWindowId;
  readonly offsetHours: number;
  readonly label: string;
  readonly owners: readonly string[];
  readonly checks: readonly string[];
  readonly templateDoc: string;
  readonly status: PlatformPprReviewStatus;
};

/** Playbook §47 — mandatory 3 reviews after RC. */
export const PLATFORM_PPR_REVIEW_WINDOWS: readonly PlatformPprReviewWindow[] = [
  {
    id: '24h',
    offsetHours: 24,
    label: '24h — Trigger/SLO/5xx/Money Delta · Critical regression · Incident P0/P1',
    owners: ['sre', 'security'],
    checks: [
      'trigger_fires',
      'slo_violations',
      'http_5xx',
      'money_delta_alarms',
      'incidents_p0_p1',
      'critical_regression',
    ],
    templateDoc: 'docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-ppr-24h-template.md',
    status: 'pending',
  },
  {
    id: '72h',
    offsetHours: 72,
    label: '72h — Provider health · Withdrawal/Deposit queue · Risk · Retention',
    owners: ['sre', 'wallet'],
    checks: [
      'provider_health',
      'withdrawal_queue',
      'deposit_queue',
      'risk_register_delta',
      'evidence_retention_spotcheck',
    ],
    templateDoc: 'docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-ppr-72h-template.md',
    status: 'pending',
  },
  {
    id: '7d',
    offsetHours: 168,
    label: '7d — Soak summary · DR/Incident lessons · KPI · next Stage · Freeze lift gate',
    owners: ['product', 'sre'],
    checks: [
      'soak_summary',
      'dr_incident_lessons',
      'kpi_rollup',
      'next_stage_decision',
      'freeze_lift_recommendation',
    ],
    templateDoc: 'docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-ppr-7d-template.md',
    status: 'pending',
  },
] as const;

export type PlatformDrillType = 'rollback' | 'dr' | 'incident-tabletop';

export type PlatformDrillScheduleStatus = 'scheduled' | 'overdue' | 'pass' | 'never';

export type PlatformDrillScheduleRow = {
  readonly type: PlatformDrillType;
  readonly cadence: string;
  readonly nextDue: string;
  readonly owner: string;
  readonly lastSuccess: string | null;
  readonly status: PlatformDrillScheduleStatus;
  readonly evidenceDoc: string;
};

/** Playbook §51 — R12 confirms next drill dates (operator executes). */
export const PLATFORM_R12_DRILL_SCHEDULE: readonly PlatformDrillScheduleRow[] = [
  {
    type: 'rollback',
    cadence: 'monthly',
    nextDue: '2026-08-13',
    owner: 'sre',
    lastSuccess: null,
    status: 'scheduled',
    evidenceDoc:
      'docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R10/r10-rollback-dry-run-template.md',
  },
  {
    type: 'dr',
    cadence: 'quarterly',
    nextDue: '2026-10-13',
    owner: 'sre + security',
    lastSuccess: null,
    status: 'never',
    evidenceDoc: 'docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-dr-drill-checklist.md',
  },
  {
    type: 'incident-tabletop',
    cadence: 'quarterly',
    nextDue: '2026-10-13',
    owner: 'security + product',
    lastSuccess: null,
    status: 'never',
    evidenceDoc: 'docs/OPERATIONS/PLATFORM_INCIDENT_RESPONSE.md',
  },
] as const;

export type PlatformSecretRotationStatus = 'current' | 'due' | 'overdue' | 'pending_operator';

export type PlatformSecretRotationRow = {
  readonly secretId: string;
  readonly label: string;
  readonly rotationDays: number;
  readonly owner: string;
  readonly status: PlatformSecretRotationStatus;
  readonly nextDue: string;
};

/** Playbook §53 — paths and deadlines only; values never in repo. */
export const PLATFORM_R12_SECRETS_ROTATION: readonly PlatformSecretRotationRow[] = [
  {
    secretId: 'SEC-SERVICE-ROLE',
    label: 'Supabase SERVICE_ROLE (server-only)',
    rotationDays: 90,
    owner: 'security',
    status: 'pending_operator',
    nextDue: '2026-10-11',
  },
  {
    secretId: 'SEC-ACCESS-TOKEN',
    label: 'SUPABASE_ACCESS_TOKEN',
    rotationDays: 90,
    owner: 'security',
    status: 'pending_operator',
    nextDue: '2026-10-11',
  },
  {
    secretId: 'SEC-PROVIDER-KEYS',
    label: 'Provider API keys (Edge secrets)',
    rotationDays: 90,
    owner: 'security',
    status: 'pending_operator',
    nextDue: '2026-10-11',
  },
  {
    secretId: 'SEC-CI-TOKENS',
    label: 'GitHub Actions / CI tokens',
    rotationDays: 90,
    owner: 'security',
    status: 'pending_operator',
    nextDue: '2026-10-11',
  },
] as const;

export type PlatformProductionNormalVerdict =
  | 'blocked'
  | 'pending_ppr'
  | 'pending_7d'
  | 'ready_for_owner';

export type PlatformPprScheduledWindow = {
  readonly id: PlatformPprWindowId;
  readonly dueAt: string;
  readonly status: PlatformPprReviewStatus;
};

/** RC 2026-07-13T09:00:00+09:00 = 2026-07-13T00:00:00.000Z */
const RC_EPOCH_MS = Date.parse('2026-07-13T00:00:00.000Z');

function formatKstFromUtcMs(utcMs: number): string {
  const kst = new Date(utcMs + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}T${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}:${pad(kst.getUTCSeconds())}+09:00`;
}

export function platformR12PprDueAt(offsetHours: number): string {
  return formatKstFromUtcMs(RC_EPOCH_MS + offsetHours * 60 * 60 * 1000);
}

export function platformR12PprSchedule(): readonly PlatformPprScheduledWindow[] {
  return PLATFORM_PPR_REVIEW_WINDOWS.map((window) => ({
    id: window.id,
    dueAt: platformR12PprDueAt(window.offsetHours),
    status: window.status,
  }));
}

export function platformR12PendingPprReviews(): readonly PlatformPprReviewWindow[] {
  return PLATFORM_PPR_REVIEW_WINDOWS.filter((window) => window.status === 'pending');
}

export function platformR12OverdueDrills(): readonly PlatformDrillScheduleRow[] {
  const today = '2026-07-13';
  return PLATFORM_R12_DRILL_SCHEDULE.filter(
    (row) => row.status === 'overdue' || (row.status === 'never' && row.nextDue < today),
  );
}

export function platformR12OverdueSecrets(): readonly PlatformSecretRotationRow[] {
  return PLATFORM_R12_SECRETS_ROTATION.filter((row) => row.status === 'overdue');
}

export function platformR12ProductionNormalVerdict(): PlatformProductionNormalVerdict {
  if (platformR12OverdueSecrets().length > 0) {
    return 'blocked';
  }
  const pending = platformR12PendingPprReviews();
  if (pending.length === PLATFORM_PPR_REVIEW_WINDOWS.length) {
    return 'pending_ppr';
  }
  const sevenDay = PLATFORM_PPR_REVIEW_WINDOWS.find((w) => w.id === '7d');
  if (sevenDay?.status !== 'pass') {
    return 'pending_7d';
  }
  return 'ready_for_owner';
}

export function assertPlatformR12PostReleaseSync(): void {
  if (PLATFORM_PPR_REVIEW_WINDOWS.length !== 3) {
    throw new Error('platform-r12-post-release: PPR windows must be exactly 3 (24h/72h/7d)');
  }
  if (PLATFORM_R12_DRILL_SCHEDULE.length !== 3) {
    throw new Error('platform-r12-post-release: drill schedule must be 3 rows');
  }
  if (PLATFORM_R12_SECRETS_ROTATION.length < 4) {
    throw new Error('platform-r12-post-release: secrets rotation must be >= 4 rows');
  }
  if (PLATFORM_R12_RC_SHA.length !== 40) {
    throw new Error('platform-r12-post-release: RC SHA must be 40-char git hash');
  }
  const windowIds = PLATFORM_PPR_REVIEW_WINDOWS.map((w) => w.id);
  if (new Set(windowIds).size !== windowIds.length) {
    throw new Error('platform-r12-post-release: PPR window ids must be unique');
  }
  const offsets = PLATFORM_PPR_REVIEW_WINDOWS.map((w) => w.offsetHours);
  if (!offsets.includes(24) || !offsets.includes(72) || !offsets.includes(168)) {
    throw new Error('platform-r12-post-release: PPR offsets must include 24, 72, 168');
  }
}
