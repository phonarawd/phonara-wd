/**
 * E4 Option B — admin tier write path pin.
 * WAVE: RPC + hook ready · UI unlock = GATE `ew-e4-gate-tier-option-b` (live).
 */

export const ADMIN_TIER_OPTION_B_TODO = 'ew-e4-tier-option-b-wave' as const;
export const ADMIN_TIER_OPTION_B_GATE_TODO = 'ew-e4-gate-tier-option-b' as const;
export const ADMIN_SET_EARN_VIP_TIER_RPC = 'rpc_admin_set_user_earn_vip_tier' as const;
export const ADMIN_USER_TIER_ROUTE = '/users/$userId/tier' as const;
export const ADMIN_TIERS_ROUTE = '/tiers' as const;

export const ADMIN_TIER_WRITE_PATH_READY = true as const;
/** GATE unlock — write controls live after remote verify. */
export const ADMIN_TIER_WRITE_UI_UNLOCKED = true as const;

export function assertAdminTierOptionBUnlock(): void {
  if (ADMIN_SET_EARN_VIP_TIER_RPC !== 'rpc_admin_set_user_earn_vip_tier') {
    throw new Error('admin tier write RPC drift');
  }
  if (ADMIN_TIER_WRITE_PATH_READY !== true) {
    throw new Error('admin tier write path must be ready in WAVE');
  }
  if (ADMIN_TIER_WRITE_UI_UNLOCKED !== true) {
    throw new Error('admin tier write UI must be unlocked after E4 GATE');
  }
  if (ADMIN_TIER_OPTION_B_GATE_TODO !== 'ew-e4-gate-tier-option-b') {
    throw new Error('admin tier GATE todo drift');
  }
  if (ADMIN_USER_TIER_ROUTE !== '/users/$userId/tier') {
    throw new Error('admin user tier route drift');
  }
  if (ADMIN_TIERS_ROUTE !== '/tiers') {
    throw new Error('admin tiers route drift');
  }
}

/** @deprecated Use assertAdminTierOptionBUnlock — GATE unlocked. */
export function assertAdminTierOptionBWaveSync(): void {
  assertAdminTierOptionBUnlock();
}
