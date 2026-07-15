/**
 * R10 — Platform rollout soak · Feature Flag five conditions · Rollback Trigger (Plan platform-perfect-launch).
 * Authority: PLATFORM_R10_ROLLOUT_SOAK.md · PLATFORM_SLO_SLA.yaml · PLATFORM_WITHDRAWAL_REENABLE_GATE.md
 */

export const PLATFORM_R10_ROLLOUT_TODO = 'audit-r10-rollout-soak' as const;

export const PLATFORM_R10_ROLLOUT_DOC = 'docs/OPERATIONS/PLATFORM_R10_ROLLOUT_SOAK.md' as const;

export const PLATFORM_R10_ROLLOUT_YAML = 'docs/OPERATIONS/PLATFORM_R10_ROLLOUT_SOAK.yaml' as const;

export const PLATFORM_R10_SOAK_SPOTCHECK_SQL =
  'scripts/platform-r10-rollout-spotcheck.sql' as const;

export const PLATFORM_SLO_SLA_YAML = 'docs/OPERATIONS/PLATFORM_SLO_SLA.yaml' as const;

export const PLATFORM_R10_EVIDENCE_DOC =
  'docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R10/r10-rollout-soak-implement.md' as const;

/** Playbook §8 — every rail flip must satisfy all five. */
export const PLATFORM_FEATURE_FLAG_FIVE_CONDITIONS = [
  'feature_flag',
  'capability',
  'provider_health',
  'runtime',
  'browser_evidence',
] as const;

export type PlatformFeatureFlagFiveCondition =
  (typeof PLATFORM_FEATURE_FLAG_FIVE_CONDITIONS)[number];

export type PlatformR10RolloutStageId =
  | 'baseline-soak'
  | 'live-crash'
  | 'trade'
  | 'sports'
  | 'giftcard'
  | 'withdrawal';

export type PlatformR10RolloutStage = {
  readonly id: PlatformR10RolloutStageId;
  readonly order: number;
  readonly label: string;
  readonly featureKeys: readonly string[];
  readonly stage1Routes: readonly string[];
  readonly runtimeE2eRef: string;
  readonly flipAllowed: boolean;
};

/** Plan R10 resume order — baseline soak flip 0 · monitor only. */
export const PLATFORM_R10_ROLLOUT_STAGES: readonly PlatformR10RolloutStage[] = [
  {
    id: 'baseline-soak',
    order: 0,
    label: 'Baseline soak (T1 rails · flip 0)',
    featureKeys: [],
    stage1Routes: [
      '/home',
      '/wallet',
      '/trade',
      '/sports',
      '/casino',
      '/login',
      '/status',
      '/install',
    ],
    runtimeE2eRef: 'CI required 4 jobs',
    flipAllowed: false,
  },
  {
    id: 'live-crash',
    order: 1,
    label: 'Live Crash',
    featureKeys: ['feature_game_enabled'],
    stage1Routes: ['/casino', '/games/crash'],
    runtimeE2eRef: 'casino.spec.ts crash',
    flipAllowed: true,
  },
  {
    id: 'trade',
    order: 2,
    label: 'Trade (per symbol)',
    featureKeys: ['feature_spot_enabled', 'feature_futures_enabled'],
    stage1Routes: ['/trade'],
    runtimeE2eRef: 'shell-ia-d1.spec.ts',
    flipAllowed: true,
  },
  {
    id: 'sports',
    order: 3,
    label: 'Sports',
    featureKeys: ['feature_sports_enabled'],
    stage1Routes: ['/sports'],
    runtimeE2eRef: 'sports-ui.spec.ts',
    flipAllowed: true,
  },
  {
    id: 'giftcard',
    order: 4,
    label: 'Giftcard provider',
    featureKeys: ['feature_deposit_enabled'],
    stage1Routes: ['/wallet/deposit/giftcard', '/wallet/redeem/giftcard'],
    runtimeE2eRef: 'wallet deposit giftcard vitest',
    flipAllowed: true,
  },
  {
    id: 'withdrawal',
    order: 5,
    label: 'Withdrawal',
    featureKeys: ['feature_withdrawal_enabled'],
    stage1Routes: ['/wallet/withdraw'],
    runtimeE2eRef: 'wallet withdrawal E2E pair',
    flipAllowed: true,
  },
] as const;

export type PlatformR10SoakCheckpointId =
  | 'pre-deploy-30m'
  | 'post-deploy-smoke-5m'
  | 'post-deploy-60m'
  | 'snapshot-24h';

export type PlatformR10SoakCheckpoint = {
  readonly id: PlatformR10SoakCheckpointId;
  readonly offset: string;
  readonly authority: string;
  readonly checks: readonly string[];
};

export const PLATFORM_R10_SOAK_CHECKPOINTS: readonly PlatformR10SoakCheckpoint[] = [
  {
    id: 'pre-deploy-30m',
    offset: 'T-30m',
    authority: 'Known Good SHA · CI 4 green · trigger dry-fire',
    checks: [
      'check:deploy-parity --remote PASS',
      'stack:ops-alert-dry-fire 6/6',
      'app_config T1 flags snapshot',
    ],
  },
  {
    id: 'post-deploy-smoke-5m',
    offset: 'T+5m',
    authority: 'Stage1 8-route abbreviated smoke',
    checks: ['8 route load · console error 0', 'primary CTA present', '/status manifest parity'],
  },
  {
    id: 'post-deploy-60m',
    offset: 'T+60m',
    authority: 'SLO spotcheck + trigger watch',
    checks: [
      'platform-r10-rollout-spotcheck.sql WARNING 0',
      'ops_alerts critical open 0',
      'new release-attributable error fingerprint 0',
    ],
  },
  {
    id: 'snapshot-24h',
    offset: 'T+24h',
    authority: 'Soak closeout Evidence',
    checks: [
      '24h trigger fires 0 (or ACCEPTED Risk)',
      'SLO violation 0 (or recorded waiver)',
      'Money Delta 0',
      'Rollback Validation ready',
    ],
  },
] as const;

export type PlatformR10RollbackTriggerRow = {
  readonly key: string;
  readonly draftValue: string;
  readonly window: string;
  readonly action: string;
  readonly alertDryFireKey: string;
};

/** §20b ↔ PLATFORM_SLO_SLA.yaml ↔ stack:ops-alert-dry-fire */
export const PLATFORM_R10_ROLLBACK_TRIGGERS: readonly PlatformR10RollbackTriggerRow[] = [
  {
    key: 'http_5xx_rate_pct_5m',
    draftValue: '2.0%',
    window: '5m',
    action: 'rail OFF or Known Good rollback start',
    alertDryFireKey: 'http_5xx_rate_pct_5m',
  },
  {
    key: 'provider_timeout_rate_pct',
    draftValue: '5.0%',
    window: '15m',
    action: 'provider lane halt + Owner',
    alertDryFireKey: 'provider_timeout_rate_pct',
  },
  {
    key: 'rpc_p95_ms',
    draftValue: '1500',
    window: '5m',
    action: 'feature OFF review + Incident P1 candidate',
    alertDryFireKey: 'rpc_p95_ms',
  },
  {
    key: 'money_delta_alarm',
    draftValue: 'alarm=true',
    window: 'immediate',
    action: 'IMMEDIATE halt all money rails + Owner + Security',
    alertDryFireKey: 'money_delta_alarm',
  },
  {
    key: 'wallet_error_burst_per_min',
    draftValue: '20',
    window: '1m',
    action: 'wallet rail OFF',
    alertDryFireKey: 'wallet_error_burst_per_min',
  },
  {
    key: 'permission_error_burst_per_min',
    draftValue: '10',
    window: '1m',
    action: 'authz review + possible freeze',
    alertDryFireKey: 'permission_error_burst_per_min',
  },
] as const;

export function findPlatformR10RolloutStage(
  id: PlatformR10RolloutStageId,
): PlatformR10RolloutStage | undefined {
  return PLATFORM_R10_ROLLOUT_STAGES.find((stage) => stage.id === id);
}

export function platformR10FlipStages(): readonly PlatformR10RolloutStage[] {
  return PLATFORM_R10_ROLLOUT_STAGES.filter((stage) => stage.flipAllowed);
}

export function assertPlatformR10RolloutSync(): void {
  if (PLATFORM_FEATURE_FLAG_FIVE_CONDITIONS.length !== 5) {
    throw new Error('platform-r10-rollout: five conditions must be exactly 5');
  }
  if (PLATFORM_R10_ROLLOUT_STAGES.length !== 6) {
    throw new Error('platform-r10-rollout: rollout stages must be 6 (baseline + 5 flip)');
  }
  if (PLATFORM_R10_SOAK_CHECKPOINTS.length !== 4) {
    throw new Error('platform-r10-rollout: soak checkpoints must be 4');
  }
  if (PLATFORM_R10_ROLLBACK_TRIGGERS.length !== 6) {
    throw new Error('platform-r10-rollout: rollback triggers must be 6');
  }
  const orders = PLATFORM_R10_ROLLOUT_STAGES.map((s) => s.order);
  if (new Set(orders).size !== orders.length) {
    throw new Error('platform-r10-rollout: rollout stage order must be unique');
  }
  if (PLATFORM_R10_ROLLOUT_STAGES[0]?.flipAllowed !== false) {
    throw new Error('platform-r10-rollout: baseline soak must not allow flip');
  }
}
