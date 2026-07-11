/**
 * Trade tier fee — P9 WORLD step 19 (Plan §25.12.9.1-E #19).
 * VIP badge + HelpTip only · est fee numeric row = ticket-density owner · duplicate fee row 0.
 *
 * Authority: TRADE_UX_CANON.md · tier-benefits-display-contract.ts · §22.2.3 anti-dup
 */

import { shouldExposeTierBenefitGap } from './tier-benefits-display-contract';
import { EARN_HUB_STATUS_RPC, type EarnVipTier } from './unified-tier-display-contract';

export const P9_TRADE_TIER_FEE_DISPLAY_TODO = 'p9-trade-tier-fee-display' as const;

/** Est. fee / liq / margin numeric rows — single owner (step 14). */
export const P9_TRADE_ORDER_TICKET_DENSITY_TODO = 'p9-trade-order-ticket-density' as const;

export const TIER_FEE_EARN_HUB_RPC = EARN_HUB_STATUS_RPC;

export const TIER_FEE_BADGE_COMPONENT = 'trade-tier-fee-badge.tsx' as const;

export const TIER_FEE_BADGE_MOUNT =
  'spot-order-ticket.tsx · futures-order-ticket.tsx ticket headers' as const;

export const TIER_FEE_HELP_TERM_ID = 'tier_fee' as const;

export const EST_FEE_NUMERIC_OWNER_TODO = P9_TRADE_ORDER_TICKET_DENSITY_TODO;

/** Engine-gap perk — never show discount % until E4 trade_fee_discount ships. */
export function shouldExposeTierFeeDiscountPercent(): boolean {
  return shouldExposeTierBenefitGap('trade_fee_discount');
}

/** Numeric est fee rows belong to ticket-density only — tier todo must not add a second row. */
export function isEstFeeNumericOwnerTodo(todoId: string): boolean {
  return todoId === EST_FEE_NUMERIC_OWNER_TODO;
}

export function resolveTradeTierFeeBadgeLabelKey(tier: EarnVipTier): `earn.tier.${EarnVipTier}` {
  return `earn.tier.${tier}`;
}

export function assertTierFeeDisplayContractSync(): void {
  if (!shouldExposeTierFeeDiscountPercent()) {
    throw new Error('tier-fee: trade_fee_discount percent must be unlocked after E4 GATE');
  }
  if (!isEstFeeNumericOwnerTodo(P9_TRADE_ORDER_TICKET_DENSITY_TODO)) {
    throw new Error('tier-fee: est fee numeric owner must be order-ticket-density');
  }
  if (isEstFeeNumericOwnerTodo(P9_TRADE_TIER_FEE_DISPLAY_TODO)) {
    throw new Error('tier-fee: tier todo must not own numeric est fee rows');
  }
}
