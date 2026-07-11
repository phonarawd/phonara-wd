import { describe, expect, it } from 'vitest';

import { messages, type MessageKey } from '@phonara/i18n';

import {
  buildTierDecayPolicyRows,
  buildUnifiedTierBenefitsRows,
  listTierBenefitsNarrativeMessageKeys,
  listVisibleTierBenefitColumns,
  shouldExposeTierBenefitGap,
  TIER_BENEFITS_NARRATIVE_STEPS,
  TIER_BENEFITS_ROUTE,
  tierBenefitsUsesEngineRpc,
} from '../tier-benefits-display-contract';
import { EARN_VIP_TIER_ORDER } from '../unified-tier-display-contract';

describe('tier-benefits-display-contract', () => {
  it('locks canonical route and engine RPC', () => {
    expect(TIER_BENEFITS_ROUTE).toBe('/tier/benefits');
    expect(tierBenefitsUsesEngineRpc()).toBe('rpc_get_earn_hub_status');
  });

  it('builds unified rows for every earn VIP tier with current highlight', () => {
    const rows = buildUnifiedTierBenefitsRows('gold');
    expect(rows).toHaveLength(EARN_VIP_TIER_ORDER.length);
    expect(rows.filter((row) => row.current)).toEqual([
      expect.objectContaining({ tier: 'gold', current: true }),
    ]);
  });

  it('exposes only engine-backed benefit columns', () => {
    const columns = listVisibleTierBenefitColumns();
    expect(columns.map((column) => column.id)).toEqual([
      'threshold',
      'cashback',
      'withdraw',
      'bonus',
      'support',
    ]);
    expect(columns.every((column) => column.engine === 'exists')).toBe(true);
  });

  it('exposes fee % + prime elite after E4 GATE; keeps other gaps hidden', () => {
    expect(shouldExposeTierBenefitGap('trade_fee_discount')).toBe(true);
    expect(shouldExposeTierBenefitGap('sports_fee_discount')).toBe(true);
    expect(shouldExposeTierBenefitGap('prime_elite_tier')).toBe(true);
    expect(shouldExposeTierBenefitGap('referral_tier_multiplier')).toBe(false);
    expect(shouldExposeTierBenefitGap('minigames_tier_bonus')).toBe(false);
  });

  it('builds decay policy rows for every tier', () => {
    const policies = buildTierDecayPolicyRows();
    expect(policies).toHaveLength(EARN_VIP_TIER_ORDER.length);
    expect(policies.find((row) => row.tier === 'bronze')?.maintenanceWindowDays).toBeNull();
    expect(policies.find((row) => row.tier === 'diamond')?.maintenanceWindowDays).toBe(60);
  });

  it('defines §3.5 narrative steps for missions · wallet · referral', () => {
    expect(TIER_BENEFITS_NARRATIVE_STEPS.map((step) => step.id)).toEqual([
      'missions',
      'wallet',
      'referral',
    ]);
    expect(TIER_BENEFITS_NARRATIVE_STEPS[0]?.route).toBe('/home/missions');
    expect(TIER_BENEFITS_NARRATIVE_STEPS[1]?.route).toBe('/wallet');
    expect(TIER_BENEFITS_NARRATIVE_STEPS[2]?.route).toBe('/referral');
  });

  it('registers ko+en i18n keys for tier benefits narrative', () => {
    for (const key of listTierBenefitsNarrativeMessageKeys()) {
      expect(messages.ko[key as MessageKey], `missing ko: ${key}`).toBeTruthy();
      expect(messages.en[key as MessageKey], `missing en: ${key}`).toBeTruthy();
    }
  });
});
