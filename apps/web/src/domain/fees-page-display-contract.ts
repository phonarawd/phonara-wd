/**
 * `/fees` — public fee + side-income structure (P12 · ui_only).
 * Fee rows are i18n catalog labels only — no client fee math · settlement = server.
 * Tier cashback column reuses `tier.guide.rows.*.cashback` (same as cashback center).
 */

import type { MessageKey } from '@phonara/i18n';

import { EARN_VIP_TIER_ORDER, type EarnVipTier } from './unified-tier-display-contract';

export const FEES_PAGE_ROUTE = '/fees' as const;

export const FEES_SEO_TITLE_KEY = 'fees.page.head.title' as const satisfies MessageKey;
export const FEES_SEO_DESCRIPTION_KEY = 'fees.page.head.desc' as const satisfies MessageKey;

/** Fee category blocks — factual structure · rates from i18n catalog (not live RPC). */
export const FEES_CATEGORY_IDS = ['spot', 'futures', 'sports', 'casino', 'withdraw'] as const;

export type FeesCategoryId = (typeof FEES_CATEGORY_IDS)[number];

export function feesCategoryTitleKey(id: FeesCategoryId): MessageKey {
  return `fees.page.category.${id}.title` as MessageKey;
}

export function feesCategoryBodyKey(id: FeesCategoryId): MessageKey {
  return `fees.page.category.${id}.body` as MessageKey;
}

export type FeesCashbackRow = {
  readonly tier: EarnVipTier;
  readonly cashbackKey: MessageKey;
};

export function buildFeesCashbackRows(): FeesCashbackRow[] {
  return EARN_VIP_TIER_ORDER.map((tier) => ({
    tier,
    cashbackKey: `tier.guide.rows.${tier}.cashback` as MessageKey,
  }));
}

export const FEES_TIER_GUIDE_CTA_ROUTE = '/tier' as const;
export const FEES_CASHBACK_CTA_ROUTE = '/earn/cashback' as const;

export function assertFeesPageContractSync(): void {
  if (FEES_PAGE_ROUTE !== '/fees') {
    throw new Error('fees-page: route drift');
  }
  if (FEES_CATEGORY_IDS.length !== 5) {
    throw new Error('fees-page: category count drift');
  }
  if (buildFeesCashbackRows().length !== EARN_VIP_TIER_ORDER.length) {
    throw new Error('fees-page: cashback rows drift');
  }
}
