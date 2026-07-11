/**
 * `/earn/cashback` — tier cashback % center (P11).
 * ENGINE:exists display — `tier.guide.rows.*.cashback` + current tier from hub.
 * No client fee/cashback math — i18n catalog + RPC tier highlight only.
 */

import type { MessageKey } from '@phonara/i18n';

import {
  buildTierBenefitsPreviewRow,
  type TierBenefitsPreviewRow,
} from './tier-me-display-contract';
import {
  EARN_HUB_STATUS_RPC,
  EARN_VIP_TIER_ORDER,
  type EarnVipTier,
} from './unified-tier-display-contract';

export const EARN_CASHBACK_ROUTE = '/earn/cashback' as const;
export const EARN_CASHBACK_HUB_STATUS_RPC = EARN_HUB_STATUS_RPC;

export const EARN_CASHBACK_SEO_TITLE_KEY = 'earn.cashback.head.title' as const satisfies MessageKey;
export const EARN_CASHBACK_SEO_DESCRIPTION_KEY =
  'earn.cashback.head.desc' as const satisfies MessageKey;

export type EarnCashbackRow = TierBenefitsPreviewRow & {
  cashbackLabelKey: MessageKey;
};

export function buildEarnCashbackRows(currentTier: EarnVipTier): EarnCashbackRow[] {
  return EARN_VIP_TIER_ORDER.map((tier) => {
    const row = buildTierBenefitsPreviewRow(tier, currentTier);
    return {
      ...row,
      cashbackLabelKey: row.cashbackKey,
    };
  });
}

export function resolveCurrentCashbackKey(tier: EarnVipTier): MessageKey {
  return `tier.guide.rows.${tier}.cashback` as MessageKey;
}
