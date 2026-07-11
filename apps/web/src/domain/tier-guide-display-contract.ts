/**
 * `/tier` — public VIP tier guide marketing (P12).
 * ENGINE:exists display — `tier.guide.*` i18n ladder + optional `rpc_get_earn_hub_status` highlight.
 * No client XP/fee math — catalog + RPC tier highlight only.
 */

import type { MessageKey } from '@phonara/i18n';

import {
  buildTierBenefitsPreviewRow,
  type TierBenefitsPreviewRow,
} from './tier-me-display-contract';
import {
  EARN_HUB_STATUS_RPC,
  EARN_VIP_TIER_ORDER,
  TIER_GUIDE_ROUTE,
  type EarnVipTier,
} from './unified-tier-display-contract';

export { TIER_GUIDE_ROUTE };

export const TIER_GUIDE_HUB_STATUS_RPC = EARN_HUB_STATUS_RPC;

export const TIER_GUIDE_SEO_TITLE_KEY = 'seo.tier.title' as const satisfies MessageKey;
export const TIER_GUIDE_SEO_DESCRIPTION_KEY = 'seo.tier.description' as const satisfies MessageKey;

export const TIER_GUIDE_TITLE_KEY = 'tier.guide.title' as const satisfies MessageKey;
export const TIER_GUIDE_SUBTITLE_KEY = 'tier.guide.subtitle' as const satisfies MessageKey;

export const TIER_GUIDE_FAQ_IDS = ['q1', 'q2', 'q3'] as const;

export type TierGuideFaqId = (typeof TIER_GUIDE_FAQ_IDS)[number];

export const TIER_GUIDE_TABLE_COLUMNS = [
  'tier',
  'threshold',
  'cashback',
  'withdraw',
  'bonus',
  'support',
] as const;

export type TierGuideTableColumn = (typeof TIER_GUIDE_TABLE_COLUMNS)[number];

export function tierGuideFaqQuestionKey(id: TierGuideFaqId): MessageKey {
  return `tier.guide.faq.${id}` as MessageKey;
}

export function tierGuideFaqAnswerKey(id: TierGuideFaqId): MessageKey {
  return `tier.guide.faq.a${id.slice(1)}` as MessageKey;
}

export function tierGuideTableHeaderKey(column: TierGuideTableColumn): MessageKey {
  return `tier.guide.table.${column}` as MessageKey;
}

export function buildTierGuideRows(currentTier: EarnVipTier | null): TierBenefitsPreviewRow[] {
  const highlight = currentTier ?? 'bronze';
  return EARN_VIP_TIER_ORDER.map((tier) => buildTierBenefitsPreviewRow(tier, highlight)).map(
    (row) => ({
      ...row,
      current: currentTier != null && row.tier === currentTier,
    }),
  );
}

export function assertTierGuideContractSync(): void {
  if (TIER_GUIDE_ROUTE !== '/tier') {
    throw new Error('tier-guide: route drift');
  }
  if (TIER_GUIDE_FAQ_IDS.length !== 3) {
    throw new Error('tier-guide: FAQ count drift');
  }
  if (TIER_GUIDE_TABLE_COLUMNS.length !== 6) {
    throw new Error('tier-guide: table columns drift');
  }
}
