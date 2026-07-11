/**
 * E1 Tier Decay wave pin (YAML #240).
 * Authority: docs/PRODUCT/ADR/010-tier-decay.md · Plan `ew-e1-decay-wave`
 *
 * Same-PR WAVE: ADR + decay RPC/cron + tier_keep_status progress.
 */

export const TIER_DECAY_TODO = 'ew-e1-decay-wave' as const;
export const TIER_DECAY_PREREQUISITE_TODO = 'ew-e0-adr-approval' as const;
export const TIER_DECAY_NEXT_TODO = 'ew-e1-gate-decay' as const;

export const TIER_DECAY_ADR_PATH = 'docs/PRODUCT/ADR/010-tier-decay.md' as const;
export const TIER_DECAY_MIGRATION_NAME = 'ew_e1_tier_decay' as const;
export const TIER_DECAY_RUN_RPC = 'rpc_run_tier_decay' as const;
export const TIER_DECAY_STATUS_RPC = 'rpc_get_tier_decay_status' as const;
export const TIER_DECAY_WARNING_EVENT = 'tier_decay_warning' as const;

/** Closed Beta policy — must match app_config seeds in migration. */
export const TIER_DECAY_GRACE_DAYS = 45 as const;
export const TIER_DECAY_DIAMOND_GRACE_DAYS = 60 as const;
export const TIER_DECAY_MAX_DROP_STEPS = 1 as const;
export const TIER_DECAY_WARN_DAYS = [30, 15, 7, 3] as const;
export const TIER_DECAY_FLOOR_TIER = 'bronze' as const;

export const TIER_DECAY_MAINTENANCE_THRESHOLDS = {
  silver: { krw: 100_000, usdtVolume: 1_000 },
  gold: { krw: 500_000, usdtVolume: 5_000 },
  platinum: { krw: 2_000_000, usdtVolume: 20_000 },
  diamond: { krw: 5_000_000, usdtVolume: 50_000 },
} as const;

export const TIER_DECAY_ARTIFACT_PATHS = [
  TIER_DECAY_ADR_PATH,
  'supabase/migrations/20260801000001_ew_e1_tier_decay.sql',
  'supabase/tests/ew_e1_tier_decay_test.sql',
  'apps/web/src/domain/tier-decay-display-contract.ts',
  'apps/web/src/domain/__tests__/tier-decay-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E1_TIER_DECAY.md',
] as const;

export const TIER_DECAY_TEST_PATHS = [
  'apps/web/src/domain/__tests__/tier-decay-display-contract.test.ts',
] as const;

/** E1 ships migration — unlike E0 ADR-only. */
export const TIER_DECAY_MIGRATION_IN_THIS_TODO = true as const;

export function assertTierDecayWaveSync(): void {
  if (TIER_DECAY_TODO !== 'ew-e1-decay-wave') {
    throw new Error('E1 todo id drift');
  }
  if (TIER_DECAY_PREREQUISITE_TODO !== 'ew-e0-adr-approval') {
    throw new Error('E1 prerequisite must be ew-e0-adr-approval');
  }
  if (TIER_DECAY_GRACE_DAYS !== 45) {
    throw new Error('E1 grace must be 45 days');
  }
  if (TIER_DECAY_DIAMOND_GRACE_DAYS !== 60) {
    throw new Error('E1 diamond grace must be 60 days');
  }
  if (TIER_DECAY_MAX_DROP_STEPS !== 1) {
    throw new Error('E1 max drop must be 1 tier');
  }
  if (TIER_DECAY_WARN_DAYS.length !== 4) {
    throw new Error('E1 warn schedule must be 30/15/7/3');
  }
  if (TIER_DECAY_FLOOR_TIER !== 'bronze') {
    throw new Error('E1 floor must be bronze');
  }
  if (TIER_DECAY_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E1 must ship migration in this todo');
  }
  if (TIER_DECAY_RUN_RPC !== 'rpc_run_tier_decay') {
    throw new Error('E1 run RPC drift');
  }
  if (TIER_DECAY_STATUS_RPC !== 'rpc_get_tier_decay_status') {
    throw new Error('E1 status RPC drift');
  }
  if (TIER_DECAY_WARNING_EVENT !== 'tier_decay_warning') {
    throw new Error('E1 warning event drift');
  }
}
