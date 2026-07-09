import { describe, expect, it } from 'vitest';

import {
  assertTierFeeDisplayContractSync,
  EST_FEE_NUMERIC_OWNER_TODO,
  isEstFeeNumericOwnerTodo,
  P9_TRADE_ORDER_TICKET_DENSITY_TODO,
  P9_TRADE_TIER_FEE_DISPLAY_TODO,
  shouldExposeTierFeeDiscountPercent,
  TIER_FEE_BADGE_COMPONENT,
  TIER_FEE_BADGE_MOUNT,
  TIER_FEE_EARN_HUB_RPC,
  TIER_FEE_HELP_TERM_ID,
} from '../tier-fee-display-contract';

describe('tier-fee-display-contract §25.12.9.1-E #19', () => {
  it('registers P9 todo id and RPC source', () => {
    expect(P9_TRADE_TIER_FEE_DISPLAY_TODO).toBe('p9-trade-tier-fee-display');
    expect(TIER_FEE_EARN_HUB_RPC).toBe('rpc_get_earn_hub_status');
    expect(TIER_FEE_HELP_TERM_ID).toBe('tier_fee');
  });

  it('keeps est fee numeric owner on ticket-density only', () => {
    expect(EST_FEE_NUMERIC_OWNER_TODO).toBe(P9_TRADE_ORDER_TICKET_DENSITY_TODO);
    expect(isEstFeeNumericOwnerTodo('p9-trade-order-ticket-density')).toBe(true);
    expect(isEstFeeNumericOwnerTodo('p9-trade-tier-fee-display')).toBe(false);
  });

  it('hides tier fee discount percent until engine gap closes', () => {
    expect(shouldExposeTierFeeDiscountPercent()).toBe(false);
  });

  it('defines badge mount owners without duplicate numeric fee surface', () => {
    expect(TIER_FEE_BADGE_COMPONENT).toContain('trade-tier-fee-badge');
    expect(TIER_FEE_BADGE_MOUNT).toContain('spot-order-ticket');
    expect(TIER_FEE_BADGE_MOUNT).toContain('futures-order-ticket');
  });

  it('passes contract sync guard', () => {
    expect(() => assertTierFeeDisplayContractSync()).not.toThrow();
  });
});
