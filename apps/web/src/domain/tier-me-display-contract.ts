/**
 * `/tier/me` — personal VIP tier · XP progress · decay UX (presentation until E1).
 * ENGINE:exists — `rpc_get_earn_hub_status` · `tier_keep_status` repeatable mission.
 */

import type { MessageKey } from '@phonara/i18n';

import { REFERRAL_HUB_ROUTE } from './referral-hub-display-contract';
import {
  EARN_HUB_STATUS_RPC,
  EARN_VIP_TIER_ORDER,
  EARN_VIP_XP_NEXT_TIER,
  normalizeEarnVipTier,
  type EarnVipTier,
} from './unified-tier-display-contract';

export { TIER_BENEFITS_ROUTE } from './tier-benefits-display-contract';

export const TIER_ME_ROUTE = '/tier/me' as const;
export const TIER_ME_HISTORY_ROUTE = '/tier/me/history' as const;
export const TIER_KEEP_STATUS_UI_ID = 'tier-keepStatus' as const;
export const TIER_KEEP_STATUS_RPC = 'tier_keep_status' as const;

/** Closed-beta policy — presentation until E1 `app_config` enforcement. */
export const TIER_DECAY_MAINTENANCE_WINDOW_DAYS = 45 as const;
export const TIER_DECAY_DIAMOND_GRACE_DAYS = 60 as const;

export const TIER_ME_SEO_TITLE_KEY = 'tier.me.head.title' as const satisfies MessageKey;
export const TIER_ME_SEO_DESCRIPTION_KEY = 'tier.me.head.desc' as const satisfies MessageKey;

export type EarnHubTierSnapshot = {
  tier: EarnVipTier;
  xp: number;
  nextTierXp: number | null;
};

export type EarnHubLimitTodayRow = {
  action: string;
  labelKey: MessageKey;
  used: number;
  max: number;
  remaining: number;
};

export type TierBenefitsPreviewRow = {
  tier: EarnVipTier;
  tierLabelKey: MessageKey;
  thresholdKey: MessageKey;
  cashbackKey: MessageKey;
  withdrawKey: MessageKey;
  bonusKey: MessageKey;
  supportKey: MessageKey;
  current: boolean;
};

export type TierDecayPanelView = {
  eligible: boolean;
  maintenanceWindowDays: number;
  maintenanceConditionKey: MessageKey;
  lowerTier: EarnVipTier | null;
  lowerTierLabelKey: MessageKey | null;
  impactRows: TierBenefitsPreviewRow[];
};

export type TierProgressView = {
  tier: EarnVipTier;
  xp: number;
  nextTier: EarnVipTier | null;
  nextTierXp: number | null;
  progressPercent: number;
  atMaxTier: boolean;
};

export function parseEarnHubTierSnapshot(
  payload: Record<string, unknown> | null | undefined,
): EarnHubTierSnapshot | null {
  if (!payload) return null;
  const tier = normalizeEarnVipTier(typeof payload['tier'] === 'string' ? payload['tier'] : null);
  const xp = Number(payload['xp'] ?? 0);
  const nextRaw = payload['next_tier_xp'];
  const nextTierXp = nextRaw == null || nextRaw === '' ? null : Number(nextRaw);
  return {
    tier,
    xp: Number.isFinite(xp) ? xp : 0,
    nextTierXp: nextTierXp != null && Number.isFinite(nextTierXp) ? nextTierXp : null,
  };
}

export function parseEarnHubLimitsToday(
  payload: Record<string, unknown> | null | undefined,
): EarnHubLimitTodayRow[] {
  const raw = payload?.['limits_today'];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;
      const labelKey = row['label_key'];
      if (typeof labelKey !== 'string' || !labelKey.trim()) return null;
      return {
        action: String(row['action'] ?? ''),
        labelKey: labelKey as MessageKey,
        used: Number(row['used'] ?? 0),
        max: Number(row['max'] ?? 0),
        remaining: Number(row['remaining'] ?? 0),
      };
    })
    .filter((row): row is EarnHubLimitTodayRow => Boolean(row));
}

export function resolveNextEarnVipTier(tier: EarnVipTier): EarnVipTier | null {
  const index = EARN_VIP_TIER_ORDER.indexOf(tier);
  if (index < 0 || index >= EARN_VIP_TIER_ORDER.length - 1) return null;
  return EARN_VIP_TIER_ORDER[index + 1] ?? null;
}

export function resolvePreviousEarnVipTier(tier: EarnVipTier): EarnVipTier | null {
  const index = EARN_VIP_TIER_ORDER.indexOf(tier);
  if (index <= 0) return null;
  return EARN_VIP_TIER_ORDER[index - 1] ?? null;
}

export function resolveTierFloorXp(tier: EarnVipTier): number {
  if (tier === 'bronze') return 0;
  const previous = resolvePreviousEarnVipTier(tier);
  if (!previous) return 0;
  return EARN_VIP_XP_NEXT_TIER[previous as Exclude<EarnVipTier, 'diamond'>];
}

export function computeTierXpProgressPercent(snapshot: EarnHubTierSnapshot): number {
  if (!snapshot.nextTierXp) return 100;
  const floor = resolveTierFloorXp(snapshot.tier);
  const span = snapshot.nextTierXp - floor;
  if (span <= 0) return 100;
  const progress = ((snapshot.xp - floor) / span) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

export function buildTierProgressView(snapshot: EarnHubTierSnapshot): TierProgressView {
  const nextTier = resolveNextEarnVipTier(snapshot.tier);
  return {
    tier: snapshot.tier,
    xp: snapshot.xp,
    nextTier,
    nextTierXp: snapshot.nextTierXp,
    progressPercent: computeTierXpProgressPercent(snapshot),
    atMaxTier: nextTier == null,
  };
}

export function resolveTierCssVar(tier: EarnVipTier): string {
  return `--ds-tier-${tier}`;
}

export function resolveTierMaintenanceConditionKey(tier: EarnVipTier): MessageKey {
  return `tier.guide.decay.${tier}.condition` as MessageKey;
}

export function isDecayPanelEligible(tier: EarnVipTier): boolean {
  return tier !== 'bronze';
}

export function resolveDecayMaintenanceWindowDays(tier: EarnVipTier): number {
  return tier === 'diamond' ? TIER_DECAY_DIAMOND_GRACE_DAYS : TIER_DECAY_MAINTENANCE_WINDOW_DAYS;
}

export function buildTierBenefitsPreviewRow(
  tier: EarnVipTier,
  currentTier: EarnVipTier,
): TierBenefitsPreviewRow {
  return {
    tier,
    tierLabelKey: `earn.tier.${tier}` as MessageKey,
    thresholdKey: `tier.guide.rows.${tier}.threshold` as MessageKey,
    cashbackKey: `tier.guide.rows.${tier}.cashback` as MessageKey,
    withdrawKey: `tier.guide.rows.${tier}.withdraw` as MessageKey,
    bonusKey: `tier.guide.rows.${tier}.bonus` as MessageKey,
    supportKey: `tier.guide.rows.${tier}.support` as MessageKey,
    current: tier === currentTier,
  };
}

export function buildTierDecayPanelView(tier: EarnVipTier): TierDecayPanelView {
  const eligible = isDecayPanelEligible(tier);
  const lowerTier = eligible ? resolvePreviousEarnVipTier(tier) : null;

  return {
    eligible,
    maintenanceWindowDays: resolveDecayMaintenanceWindowDays(tier),
    maintenanceConditionKey: resolveTierMaintenanceConditionKey(tier),
    lowerTier,
    lowerTierLabelKey: lowerTier ? (`earn.tier.${lowerTier}` as MessageKey) : null,
    impactRows: eligible
      ? [
          buildTierBenefitsPreviewRow(tier, tier),
          ...(lowerTier ? [buildTierBenefitsPreviewRow(lowerTier, tier)] : []),
        ]
      : [],
  };
}

export function resolveTierKeepMissionHubRoute(): string {
  return '/home/missions?tab=tier';
}

export function resolveTierDecayDepositRoute(): string {
  return '/wallet/deposit';
}

export function resolveTierDecayReferralRoute(): string {
  return REFERRAL_HUB_ROUTE;
}

export function tierMeUsesEngineRpc(): string {
  return EARN_HUB_STATUS_RPC;
}

/** Benefits mini-table — current tier always; includes lower tier when decay applies. */
export function buildTierMeBenefitsRows(tier: EarnVipTier): TierBenefitsPreviewRow[] {
  const panel = buildTierDecayPanelView(tier);
  if (panel.impactRows.length > 0) return panel.impactRows;
  return [buildTierBenefitsPreviewRow(tier, tier)];
}
