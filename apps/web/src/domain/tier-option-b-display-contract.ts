/**
 * E4 Tier Option B wave pin (YAML #246).
 * Authority: docs/PRODUCT/ADR/013-tier-option-b.md · Plan `ew-e4-tier-option-b-wave`
 *
 * Same-PR WAVE: ADR + summary RPC + Prime Elite + caps + admin write.
 * Fee % / elite route unlock = GATE (`ew-e4-gate-tier-option-b`) + E5 wire.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';

export const TIER_OPTION_B_TODO = 'ew-e4-tier-option-b-wave' as const;
export const TIER_OPTION_B_PREREQUISITE_TODO = 'ew-e3-gate-cms-promotions' as const;
export const TIER_OPTION_B_NEXT_TODO = 'ew-e4-gate-tier-option-b' as const;
export const TIER_OPTION_B_UI_UNLOCK_TODO = 'ew-e5-gap-surfaces-wire' as const;

export const TIER_OPTION_B_ADR_PATH = 'docs/PRODUCT/ADR/013-tier-option-b.md' as const;
export const TIER_OPTION_B_MIGRATION_NAME = 'ew_e4_tier_option_b' as const;
export const TIER_OPTION_B_ENUM_MIGRATION_NAME = 'ew_e4_prime_elite_enum' as const;
export const TIER_OPTION_B_MIGRATION_FILE =
  'supabase/migrations/20260804000002_ew_e4_tier_option_b.sql' as const;
export const TIER_OPTION_B_ENUM_MIGRATION_FILE =
  'supabase/migrations/20260804000001_ew_e4_prime_elite_enum.sql' as const;

export const USER_TIER_SUMMARY_RPC = 'rpc_get_user_tier_summary' as const;
export const ADMIN_SET_EARN_VIP_TIER_RPC = 'rpc_admin_set_user_earn_vip_tier' as const;

export const PRIME_ELITE_TIER = 'prime_elite' as const;

export const TIER_OPTION_B_ADMIN_ROUTES = ['/admin/tiers', '/admin/users/$userId/tier'] as const;

export const TIER_OPTION_B_USER_ROUTES = [
  '/tier/me',
  '/tier/elite',
  '/sports/vip',
  '/fees',
] as const;

export const TIER_OPTION_B_ARTIFACT_PATHS = [
  TIER_OPTION_B_ADR_PATH,
  TIER_OPTION_B_ENUM_MIGRATION_FILE,
  TIER_OPTION_B_MIGRATION_FILE,
  'supabase/tests/ew_e4_tier_option_b_test.sql',
  'apps/web/src/domain/tier-option-b-display-contract.ts',
  'apps/web/src/domain/__tests__/tier-option-b-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E4_TIER_OPTION_B.md',
] as const;

/** E4 ships migration — unlike E0 ADR-only. */
export const TIER_OPTION_B_MIGRATION_IN_THIS_TODO = true as const;

/** Engine surface ready (RPCs exist). */
export function isTierOptionBEngineReady(): boolean {
  return (
    LAUNCH_GATES.tierOptionBEngine === true &&
    USER_TIER_SUMMARY_RPC === 'rpc_get_user_tier_summary' &&
    ADMIN_SET_EARN_VIP_TIER_RPC === 'rpc_admin_set_user_earn_vip_tier'
  );
}

/**
 * Fee discount % display — unlocked by GATE via launch gate.
 * WAVE kept this false until GATE verify + unlock.
 */
export function isTierFeeDisplayTruthUnlocked(): boolean {
  return LAUNCH_GATES.tierFeeDisplayTruth;
}

/** Admin manual tier write UI — GATE unlock. */
export function isAdminTierWriteUnlocked(): boolean {
  return LAUNCH_GATES.adminTierWrite;
}

/** `/sports/vip` surface prep — GATE unlock · live markets = E5. */
export function isSportsVipSurfaceUnlocked(): boolean {
  return LAUNCH_GATES.sportsVipSurface === true;
}

/** `/tier/elite` surface prep — GATE unlock · live wire = E5. */
export function isTierEliteSurfaceUnlocked(): boolean {
  return LAUNCH_GATES.tierEliteSurface === true;
}

export function assertTierOptionBWaveSync(): void {
  if (TIER_OPTION_B_TODO !== 'ew-e4-tier-option-b-wave') {
    throw new Error('E4 todo id drift');
  }
  if (TIER_OPTION_B_PREREQUISITE_TODO !== 'ew-e3-gate-cms-promotions') {
    throw new Error('E4 prerequisite must be ew-e3-gate-cms-promotions');
  }
  if (TIER_OPTION_B_NEXT_TODO !== 'ew-e4-gate-tier-option-b') {
    throw new Error('E4 next must be ew-e4-gate-tier-option-b');
  }
  if (TIER_OPTION_B_UI_UNLOCK_TODO !== 'ew-e5-gap-surfaces-wire') {
    throw new Error('E4 UI unlock must be ew-e5-gap-surfaces-wire');
  }
  if (TIER_OPTION_B_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E4 must ship migration in this todo');
  }
  if (!isTierOptionBEngineReady()) {
    throw new Error('E4 engine surface not ready');
  }
}
