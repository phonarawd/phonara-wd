/**
 * E4 Tier Option B GATE pin (YAML #247).
 * Authority: Plan `ew-e4-gate-tier-option-b` · ADR-013 · engine verify + UI unlock.
 *
 * GATE does not re-ship Option B RPC — asserts wave green · remote apply ·
 * advisor 0 · fee % · admin tier write · `/sports/vip` · `/tier/elite` unlock.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  ADMIN_SET_EARN_VIP_TIER_RPC,
  assertTierOptionBWaveSync,
  isAdminTierWriteUnlocked,
  isSportsVipSurfaceUnlocked,
  isTierEliteSurfaceUnlocked,
  isTierFeeDisplayTruthUnlocked,
  isTierOptionBEngineReady,
  TIER_OPTION_B_ARTIFACT_PATHS,
  TIER_OPTION_B_MIGRATION_NAME,
  TIER_OPTION_B_NEXT_TODO,
  TIER_OPTION_B_TODO,
  TIER_OPTION_B_UI_UNLOCK_TODO,
  USER_TIER_SUMMARY_RPC,
} from './tier-option-b-display-contract';
import { SPORTS_VIP_ROUTE } from './dead-controls-display-contract';
import { shouldExposeTierFeeDiscountPercent } from './tier-fee-display-contract';

export const EW_E4_GATE_TIER_OPTION_B_TODO = 'ew-e4-gate-tier-option-b' as const;
export const EW_E4_GATE_TIER_OPTION_B_PREREQUISITE_TODO = TIER_OPTION_B_TODO;
export const EW_E4_GATE_TIER_OPTION_B_NEXT_TODO = 'ew-e5-gap-surfaces-wire' as const;

export const EW_E4_GATE_TIER_OPTION_B_UNLOCK_ROUTES = [
  '/fees',
  '/tier/me',
  '/tier/elite',
  SPORTS_VIP_ROUTE,
  '/admin/tiers',
  '/admin/users/$userId/tier',
] as const;

export const EW_E4_GATE_TIER_OPTION_B_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e4-gate-tier-option-b-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e4-gate-tier-option-b-display-contract.test.ts',
  'apps/web/src/domain/tier-option-b-display-contract.ts',
  'apps/web/src/lib/launch-gates.ts',
  'apps/admin/src/domain/admin-tier-option-b-display-contract.ts',
  'docs/PRODUCT/ADR/013-tier-option-b.md',
  'docs/OPERATIONS/ENGINE_GAP_E4_TIER_OPTION_B.md',
  'docs/OPERATIONS/ENGINE_GAP_E4_GATE_TIER_OPTION_B.md',
  'supabase/migrations/20260804000001_ew_e4_prime_elite_enum.sql',
  'supabase/migrations/20260804000002_ew_e4_tier_option_b.sql',
  'supabase/tests/ew_e4_tier_option_b_test.sql',
] as const;

export const EW_E4_GATE_TIER_OPTION_B_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e4-gate-tier-option-b-display-contract.test.ts',
  'apps/web/src/domain/__tests__/tier-option-b-display-contract.test.ts',
  'apps/web/src/domain/__tests__/tier-fee-display-contract.test.ts',
  'apps/web/src/domain/__tests__/sports-rules-and-vip-display-contract.test.ts',
  'apps/admin/src/domain/__tests__/admin-tier-option-b-display-contract.test.ts',
] as const;

/** Remote migration name parity (Management API timestamp may differ). */
export const EW_E4_GATE_TIER_OPTION_B_REMOTE_MIGRATION_NAME = TIER_OPTION_B_MIGRATION_NAME;

export const TIER_ELITE_ROUTE = '/tier/elite' as const;

export function isFeeDisplayTruthFullyUnlocked(): boolean {
  return (
    LAUNCH_GATES.tierOptionBEngine === true &&
    isTierFeeDisplayTruthUnlocked() &&
    shouldExposeTierFeeDiscountPercent() &&
    USER_TIER_SUMMARY_RPC === 'rpc_get_user_tier_summary'
  );
}

export function isAdminTierWriteFullyUnlocked(): boolean {
  return (
    LAUNCH_GATES.adminTierWrite === true &&
    isAdminTierWriteUnlocked() &&
    ADMIN_SET_EARN_VIP_TIER_RPC === 'rpc_admin_set_user_earn_vip_tier'
  );
}

export function isSportsVipAndTierEliteUnlocked(): boolean {
  return (
    isSportsVipSurfaceUnlocked() &&
    isTierEliteSurfaceUnlocked() &&
    SPORTS_VIP_ROUTE === '/sports/vip' &&
    TIER_ELITE_ROUTE === '/tier/elite'
  );
}

export function isTierOptionBSurfacesFullyUnlocked(): boolean {
  return (
    isTierOptionBEngineReady() &&
    isFeeDisplayTruthFullyUnlocked() &&
    isAdminTierWriteFullyUnlocked() &&
    isSportsVipAndTierEliteUnlocked()
  );
}

export function assertEwE4GateTierOptionBSync(): void {
  assertTierOptionBWaveSync();

  if (EW_E4_GATE_TIER_OPTION_B_TODO !== 'ew-e4-gate-tier-option-b') {
    throw new Error('E4 GATE todo id drift');
  }
  if (EW_E4_GATE_TIER_OPTION_B_PREREQUISITE_TODO !== 'ew-e4-tier-option-b-wave') {
    throw new Error('E4 GATE prerequisite must be ew-e4-tier-option-b-wave');
  }
  if (EW_E4_GATE_TIER_OPTION_B_NEXT_TODO !== 'ew-e5-gap-surfaces-wire') {
    throw new Error('E4 GATE next must be ew-e5-gap-surfaces-wire');
  }
  if (TIER_OPTION_B_NEXT_TODO !== 'ew-e4-gate-tier-option-b') {
    throw new Error('E4 WAVE next must unlock ew-e4-gate-tier-option-b');
  }
  if (TIER_OPTION_B_UI_UNLOCK_TODO !== 'ew-e5-gap-surfaces-wire') {
    throw new Error('E4 live wire must remain ew-e5-gap-surfaces-wire');
  }
  if (USER_TIER_SUMMARY_RPC !== 'rpc_get_user_tier_summary') {
    throw new Error('E4 GATE summary RPC drift');
  }
  if (ADMIN_SET_EARN_VIP_TIER_RPC !== 'rpc_admin_set_user_earn_vip_tier') {
    throw new Error('E4 GATE admin tier write RPC drift');
  }
  if (!isTierOptionBSurfacesFullyUnlocked()) {
    throw new Error(
      'E4 GATE unlock not live — fee % · admin tier write · /sports/vip · /tier/elite',
    );
  }
  if (EW_E4_GATE_TIER_OPTION_B_UNLOCK_ROUTES.length !== 6) {
    throw new Error('E4 GATE must unlock 6 routes');
  }
  if (TIER_OPTION_B_ARTIFACT_PATHS.length < 5) {
    throw new Error('E4 WAVE artifacts missing');
  }
}
