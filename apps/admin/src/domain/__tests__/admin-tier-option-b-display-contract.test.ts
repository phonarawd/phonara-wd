import { describe, expect, it } from 'vitest';

import {
  ADMIN_SET_EARN_VIP_TIER_RPC,
  ADMIN_TIER_OPTION_B_GATE_TODO,
  ADMIN_TIER_OPTION_B_TODO,
  ADMIN_TIER_WRITE_PATH_READY,
  ADMIN_TIER_WRITE_UI_UNLOCKED,
  ADMIN_USER_TIER_ROUTE,
  assertAdminTierOptionBWaveSync,
} from '../admin-tier-option-b-display-contract';

describe('admin-tier-option-b-display-contract (E4)', () => {
  it('pins WAVE write path ready · GATE unlocks write UI', () => {
    assertAdminTierOptionBWaveSync();
    expect(ADMIN_TIER_OPTION_B_TODO).toBe('ew-e4-tier-option-b-wave');
    expect(ADMIN_TIER_OPTION_B_GATE_TODO).toBe('ew-e4-gate-tier-option-b');
    expect(ADMIN_SET_EARN_VIP_TIER_RPC).toBe('rpc_admin_set_user_earn_vip_tier');
    expect(ADMIN_USER_TIER_ROUTE).toBe('/users/$userId/tier');
    expect(ADMIN_TIER_WRITE_PATH_READY).toBe(true);
    expect(ADMIN_TIER_WRITE_UI_UNLOCKED).toBe(true);
  });
});
