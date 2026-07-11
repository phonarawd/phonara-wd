import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  ADMIN_SET_EARN_VIP_TIER_RPC,
  assertTierOptionBWaveSync,
  isAdminTierWriteUnlocked,
  isTierFeeDisplayTruthUnlocked,
  isTierOptionBEngineReady,
  PRIME_ELITE_TIER,
  TIER_OPTION_B_ADR_PATH,
  TIER_OPTION_B_ARTIFACT_PATHS,
  TIER_OPTION_B_MIGRATION_FILE,
  TIER_OPTION_B_MIGRATION_IN_THIS_TODO,
  TIER_OPTION_B_MIGRATION_NAME,
  TIER_OPTION_B_NEXT_TODO,
  TIER_OPTION_B_PREREQUISITE_TODO,
  TIER_OPTION_B_TODO,
  TIER_OPTION_B_UI_UNLOCK_TODO,
  USER_TIER_SUMMARY_RPC,
} from '../tier-option-b-display-contract';
import {
  EARN_VIP_TIER_ORDER,
  PROPOSED_UNIFIED_TIER_SUMMARY_RPC,
} from '../unified-tier-display-contract';
import { shouldExposeTierFeeDiscountPercent } from '../tier-fee-display-contract';

const repoRoot = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('tier-option-b-display-contract (E4)', () => {
  it('pins WAVE todo ids · RPCs · engine ready · GATE unlocks fee % / admin write', () => {
    assertTierOptionBWaveSync();
    expect(TIER_OPTION_B_TODO).toBe('ew-e4-tier-option-b-wave');
    expect(TIER_OPTION_B_PREREQUISITE_TODO).toBe('ew-e3-gate-cms-promotions');
    expect(TIER_OPTION_B_NEXT_TODO).toBe('ew-e4-gate-tier-option-b');
    expect(TIER_OPTION_B_UI_UNLOCK_TODO).toBe('ew-e5-gap-surfaces-wire');
    expect(TIER_OPTION_B_MIGRATION_IN_THIS_TODO).toBe(true);
    expect(TIER_OPTION_B_MIGRATION_NAME).toBe('ew_e4_tier_option_b');
    expect(USER_TIER_SUMMARY_RPC).toBe('rpc_get_user_tier_summary');
    expect(USER_TIER_SUMMARY_RPC).toBe(PROPOSED_UNIFIED_TIER_SUMMARY_RPC);
    expect(ADMIN_SET_EARN_VIP_TIER_RPC).toBe('rpc_admin_set_user_earn_vip_tier');
    expect(PRIME_ELITE_TIER).toBe('prime_elite');
    expect(EARN_VIP_TIER_ORDER).toContain('prime_elite');
    expect(isTierOptionBEngineReady()).toBe(true);
    // Fee % / admin write unlock is owned by GATE (`ew-e4-gate-tier-option-b`).
    expect(typeof isTierFeeDisplayTruthUnlocked()).toBe('boolean');
    expect(typeof isAdminTierWriteUnlocked()).toBe('boolean');
    expect(typeof shouldExposeTierFeeDiscountPercent()).toBe('boolean');
  });

  it('requires ADR + migration + SQL test artifacts', () => {
    for (const rel of TIER_OPTION_B_ARTIFACT_PATHS) {
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    const adr = readRepo(TIER_OPTION_B_ADR_PATH);
    expect(adr).toContain('Accepted');
    expect(adr).toContain(TIER_OPTION_B_TODO);
    expect(adr).toContain('rpc_get_user_tier_summary');
    expect(adr).toContain('prime_elite');
    expect(adr).toContain('rpc_admin_set_user_earn_vip_tier');

    const migration = readRepo(TIER_OPTION_B_MIGRATION_FILE);
    expect(migration).toContain(TIER_OPTION_B_MIGRATION_NAME);
    expect(migration).toContain(USER_TIER_SUMMARY_RPC);
    expect(migration).toContain(ADMIN_SET_EARN_VIP_TIER_RPC);
    expect(migration).toContain('prime_elite');
    expect(migration).toContain('_earn_vip_fee_rate');
    expect(migration).toContain('_assert_game_stake_limits');
    expect(migration).toContain('prime_elite_manual_only');
    expect(migration).not.toContain("ADD VALUE 'prime_elite'");

    const enumMigration = readRepo('supabase/migrations/20260804000001_ew_e4_prime_elite_enum.sql');
    expect(enumMigration).toContain("ADD VALUE 'prime_elite'");
    expect(enumMigration).toContain('ew_e4_prime_elite_enum');
  });
});
