/**
 * `/tier/benefits` — unified VIP benefits matrix · decay policy · §3.5 narrative.
 * ENGINE:exists — `rpc_get_earn_hub_status` (current tier highlight only).
 * Gap benefits (fee tier · referral multiplier · Prime Elite) stay hidden — no "coming soon".
 */

import type { MessageKey } from '@phonara/i18n';

import { HOME_MISSIONS_ROUTE } from './home-missions-display-contract';
import { TIER_BENEFITS_NARRATIVE_KEY_PREFIX } from './platform-narrative-display-contract';
import { REFERRAL_HUB_ROUTE } from './referral-hub-display-contract';
import {
  buildTierBenefitsPreviewRow,
  type TierBenefitsPreviewRow,
} from './tier-me-display-contract';
import {
  EARN_HUB_STATUS_RPC,
  EARN_VIP_TIER_ORDER,
  type EarnVipTier,
} from './unified-tier-display-contract';

export const TIER_BENEFITS_ROUTE = '/tier/benefits' as const;

export const TIER_BENEFITS_SEO_TITLE_KEY = 'tier.benefits.head.title' as const satisfies MessageKey;
export const TIER_BENEFITS_SEO_DESCRIPTION_KEY =
  'tier.benefits.head.desc' as const satisfies MessageKey;

export type TierBenefitColumnId = 'threshold' | 'cashback' | 'withdraw' | 'bonus' | 'support';

export type TierBenefitColumnEngineStatus = 'exists' | 'gap';

export type TierBenefitColumnDef = {
  id: TierBenefitColumnId;
  engine: TierBenefitColumnEngineStatus;
  labelKey: MessageKey;
};

/** Columns backed by tier.guide i18n + earn limits — shown on `/tier/benefits`. */
export const TIER_BENEFIT_COLUMNS: readonly TierBenefitColumnDef[] = [
  { id: 'threshold', engine: 'exists', labelKey: 'tier.guide.table.threshold' },
  { id: 'cashback', engine: 'exists', labelKey: 'tier.guide.table.cashback' },
  { id: 'withdraw', engine: 'exists', labelKey: 'tier.guide.table.withdraw' },
  { id: 'bonus', engine: 'exists', labelKey: 'tier.guide.table.bonus' },
  { id: 'support', engine: 'exists', labelKey: 'tier.guide.table.support' },
] as const;

/** Engine-gap perks — hidden until E4/E-Wave (§3.5 · §17.3 · PLATFORM_NARRATIVE_CANON). */
export const TIER_BENEFIT_GAP_FEATURES = [
  'trade_fee_discount',
  'sports_fee_discount',
  'referral_tier_multiplier',
  'prime_elite_tier',
  'minigames_tier_bonus',
] as const;

export type TierBenefitGapFeature = (typeof TIER_BENEFIT_GAP_FEATURES)[number];

export type TierDecayPolicyRow = {
  tier: EarnVipTier;
  tierLabelKey: MessageKey;
  conditionKey: MessageKey;
  maintenanceWindowDays: number | null;
};

export type TierBenefitsNarrativeStepId = 'missions' | 'wallet' | 'referral';

export type TierBenefitsNarrativeStep = {
  readonly id: TierBenefitsNarrativeStepId;
  readonly titleKey: `tier.benefits.narrative.${TierBenefitsNarrativeStepId}.title`;
  readonly bodyKey: `tier.benefits.narrative.${TierBenefitsNarrativeStepId}.body`;
  readonly route: string;
};

/** §3.5 — PHON single wallet + missions + referral unified tier story. */
export const TIER_BENEFITS_NARRATIVE_STEPS: readonly TierBenefitsNarrativeStep[] = [
  {
    id: 'missions',
    titleKey: 'tier.benefits.narrative.missions.title',
    bodyKey: 'tier.benefits.narrative.missions.body',
    route: HOME_MISSIONS_ROUTE,
  },
  {
    id: 'wallet',
    titleKey: 'tier.benefits.narrative.wallet.title',
    bodyKey: 'tier.benefits.narrative.wallet.body',
    route: '/wallet',
  },
  {
    id: 'referral',
    titleKey: 'tier.benefits.narrative.referral.title',
    bodyKey: 'tier.benefits.narrative.referral.body',
    route: REFERRAL_HUB_ROUTE,
  },
] as const;

export const TIER_BENEFITS_NARRATIVE_HEADING_KEY =
  `${TIER_BENEFITS_NARRATIVE_KEY_PREFIX}.heading` as const satisfies MessageKey;
export const TIER_BENEFITS_NARRATIVE_LEAD_KEY =
  `${TIER_BENEFITS_NARRATIVE_KEY_PREFIX}.lead` as const satisfies MessageKey;
export const TIER_BENEFITS_NARRATIVE_BODY_KEY =
  `${TIER_BENEFITS_NARRATIVE_KEY_PREFIX}.body` as const satisfies MessageKey;
export const TIER_BENEFITS_NARRATIVE_CURRENT_TIER_KEY =
  `${TIER_BENEFITS_NARRATIVE_KEY_PREFIX}.currentTier` as const satisfies MessageKey;

export function listTierBenefitsNarrativeMessageKeys(): readonly MessageKey[] {
  const stepKeys = TIER_BENEFITS_NARRATIVE_STEPS.flatMap((step) => [step.titleKey, step.bodyKey]);
  return [
    TIER_BENEFITS_NARRATIVE_HEADING_KEY,
    TIER_BENEFITS_NARRATIVE_LEAD_KEY,
    TIER_BENEFITS_NARRATIVE_BODY_KEY,
    TIER_BENEFITS_NARRATIVE_CURRENT_TIER_KEY,
    ...stepKeys,
  ];
}

export const TIER_BENEFITS_FAQ_KEYS = [
  { q: 'tier.guide.faq.q1', a: 'tier.guide.faq.a1' },
  { q: 'tier.guide.faq.q2', a: 'tier.guide.faq.a2' },
  { q: 'tier.guide.faq.q3', a: 'tier.guide.faq.a3' },
] as const satisfies ReadonlyArray<{ q: MessageKey; a: MessageKey }>;

export function tierBenefitsUsesEngineRpc(): string {
  return EARN_HUB_STATUS_RPC;
}

export function listVisibleTierBenefitColumns(): readonly TierBenefitColumnDef[] {
  return TIER_BENEFIT_COLUMNS.filter((column) => column.engine === 'exists');
}

export function shouldExposeTierBenefitGap(feature: TierBenefitGapFeature): boolean {
  void feature;
  return false;
}

export function buildUnifiedTierBenefitsRows(currentTier: EarnVipTier): TierBenefitsPreviewRow[] {
  return EARN_VIP_TIER_ORDER.map((tier) => buildTierBenefitsPreviewRow(tier, currentTier));
}

export function resolveTierBenefitCellKey(
  row: TierBenefitsPreviewRow,
  columnId: TierBenefitColumnId,
): MessageKey {
  switch (columnId) {
    case 'threshold':
      return row.thresholdKey;
    case 'cashback':
      return row.cashbackKey;
    case 'withdraw':
      return row.withdrawKey;
    case 'bonus':
      return row.bonusKey;
    case 'support':
      return row.supportKey;
  }
}

export function buildTierDecayPolicyRows(): TierDecayPolicyRow[] {
  return EARN_VIP_TIER_ORDER.map((tier) => ({
    tier,
    tierLabelKey: `earn.tier.${tier}` as MessageKey,
    conditionKey: `tier.guide.decay.${tier}.condition` as MessageKey,
    maintenanceWindowDays: tier === 'bronze' ? null : tier === 'diamond' ? 60 : 45,
  }));
}

export function resolveTierBenefitsMeRoute(): string {
  return '/tier/me';
}
