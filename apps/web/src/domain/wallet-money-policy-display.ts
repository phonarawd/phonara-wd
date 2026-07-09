/**
 * §31.3 Money policy display — deposit unlimited (operator RG excepted) · withdraw tier limits.
 * Limits copy is presentation-only; engine enforces via app_config + earn VIP tier.
 */
import type { MessageKey } from '@phonara/i18n';

import { EARN_VIP_TIER_ORDER, type EarnVipTier } from './unified-tier-display-contract';

export type WithdrawTierLimitsView = {
  currentTier: EarnVipTier;
  currentTierLabelKey: MessageKey;
  currentLimitLabelKey: MessageKey;
  nextTier: EarnVipTier | null;
  nextTierLabelKey: MessageKey | null;
  nextLimitLabelKey: MessageKey | null;
};

export function normalizeEarnVipTier(raw: string | null | undefined): EarnVipTier | null {
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) return null;
  return (EARN_VIP_TIER_ORDER as readonly string[]).includes(normalized)
    ? (normalized as EarnVipTier)
    : null;
}

export function nextEarnVipTier(tier: EarnVipTier): EarnVipTier | null {
  const index = EARN_VIP_TIER_ORDER.indexOf(tier);
  if (index < 0 || index >= EARN_VIP_TIER_ORDER.length - 1) return null;
  return EARN_VIP_TIER_ORDER[index + 1] ?? null;
}

export function earnVipTierLabelKey(tier: EarnVipTier): MessageKey {
  return `earn.tier.${tier}` as MessageKey;
}

/** Tier guide row — daily withdraw limit presentation (§31.3 · Option B pre-E4). */
export function earnVipWithdrawLimitLabelKey(tier: EarnVipTier): MessageKey {
  return `tier.guide.rows.${tier}.withdraw` as MessageKey;
}

export function buildWithdrawTierLimitsView(
  rawTier: string | null | undefined,
): WithdrawTierLimitsView {
  const currentTier = normalizeEarnVipTier(rawTier) ?? 'bronze';
  const nextTier = nextEarnVipTier(currentTier);

  return {
    currentTier,
    currentTierLabelKey: earnVipTierLabelKey(currentTier),
    currentLimitLabelKey: earnVipWithdrawLimitLabelKey(currentTier),
    nextTier,
    nextTierLabelKey: nextTier ? earnVipTierLabelKey(nextTier) : null,
    nextLimitLabelKey: nextTier ? earnVipWithdrawLimitLabelKey(nextTier) : null,
  };
}
