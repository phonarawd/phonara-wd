/**
 * `/tier/me` — personal VIP tier · XP progress · E1 decay status.
 * ENGINE:exists — `rpc_get_earn_hub_status` · `rpc_get_tier_decay_status` · `tier_keep_status`.
 */

import type { MessageKey } from '@phonara/i18n';

import { REFERRAL_HUB_ROUTE } from './referral-hub-display-contract';
import { TIER_DECAY_STATUS_RPC as TIER_DECAY_STATUS_RPC_CANON } from './tier-decay-display-contract';
import {
  EARN_HUB_STATUS_RPC,
  EARN_VIP_TIER_ORDER,
  EARN_VIP_XP_NEXT_TIER,
  normalizeEarnVipTier,
  type EarnVipTier,
} from './unified-tier-display-contract';

export { TIER_BENEFITS_ROUTE } from './tier-benefits-display-contract';

export const TIER_ME_ROUTE = '/tier/me' as const;
/**
 * Reserved for a future dedicated tier/decay history page backed by
 * `tier_decay_events` — no route file exists yet (ZA-07). The page's
 * History CTA uses `resolveTierMeHistoryLinkRoute()` below instead.
 */
export const TIER_ME_HISTORY_ROUTE = '/tier/me/history' as const;
export const TIER_KEEP_STATUS_UI_ID = 'tier-keepStatus' as const;
export const TIER_KEEP_STATUS_RPC = 'tier_keep_status' as const;
/** Live decay countdown/status — E1 GATE unlock. */
export const TIER_DECAY_STATUS_RPC = TIER_DECAY_STATUS_RPC_CANON;

/** Closed-beta policy — enforced by E1 `app_config` + `rpc_get_tier_decay_status`. */
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

export type TierDecayStatusSnapshot = {
  tier: EarnVipTier;
  eligible: boolean;
  graceDays: number;
  daysLeft: number;
  meetsMaintenance: boolean;
  lowerTier: EarnVipTier | null;
  lastQualifyingAt: string | null;
  lastDecayAt: string | null;
};

export type TierDecayPanelView = {
  eligible: boolean;
  maintenanceWindowDays: number;
  maintenanceConditionKey: MessageKey;
  lowerTier: EarnVipTier | null;
  lowerTierLabelKey: MessageKey | null;
  impactRows: TierBenefitsPreviewRow[];
  /** Live from `rpc_get_tier_decay_status` after E1 GATE. */
  engineLive: boolean;
  daysLeft: number | null;
  meetsMaintenance: boolean | null;
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
  if (tier === 'diamond' || tier === 'prime_elite') return null;
  const index = EARN_VIP_TIER_ORDER.indexOf(tier);
  if (index < 0) return null;
  const next = EARN_VIP_TIER_ORDER[index + 1];
  if (!next || next === 'prime_elite') return null;
  return next;
}

export function resolvePreviousEarnVipTier(tier: EarnVipTier): EarnVipTier | null {
  const index = EARN_VIP_TIER_ORDER.indexOf(tier);
  if (index <= 0) return null;
  return EARN_VIP_TIER_ORDER[index - 1] ?? null;
}

export function resolveTierFloorXp(tier: EarnVipTier): number {
  if (tier === 'bronze') return 0;
  const previous = resolvePreviousEarnVipTier(tier);
  if (!previous || previous === 'prime_elite') return 0;
  if (previous === 'diamond') return EARN_VIP_XP_NEXT_TIER.platinum;
  return EARN_VIP_XP_NEXT_TIER[previous as Exclude<EarnVipTier, 'diamond' | 'prime_elite'>];
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

/**
 * SOT (ZA-08) — `tier.guide.rows.${tier}.cashback` is the single cashback i18n
 * key template shared by 4 surfaces: `/tier/me` (this file) · `/tier`
 * (tier-guide-display-contract.ts, reuses this function) · `/earn/cashback`
 * (earn-cashback-display-contract.ts, re-derives the same literal) · `/fees`
 * (fees-page-display-contract.ts, re-derives the same literal). The latter two
 * intentionally duplicate the string rather than import this function to keep
 * each domain module self-contained — `tier-cashback-key-single-source.test.ts`
 * is the drift guard: if this template ever changes, that test fails until all
 * 4 call sites are updated together.
 */
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

export function parseTierDecayStatusSnapshot(
  payload: Record<string, unknown> | null | undefined,
): TierDecayStatusSnapshot | null {
  if (!payload) return null;
  const tier = normalizeEarnVipTier(typeof payload['tier'] === 'string' ? payload['tier'] : null);
  const graceDays = Number(payload['grace_days'] ?? resolveDecayMaintenanceWindowDays(tier));
  const daysLeftRaw = Number(payload['days_left'] ?? 0);
  const lowerRaw = payload['lower_tier'];
  const lowerTier =
    typeof lowerRaw === 'string' && lowerRaw.trim() ? normalizeEarnVipTier(lowerRaw) : null;
  const lastQualifyingAt =
    typeof payload['last_qualifying_at'] === 'string' ? payload['last_qualifying_at'] : null;
  const lastDecayAt =
    typeof payload['last_decay_at'] === 'string' ? payload['last_decay_at'] : null;

  return {
    tier,
    eligible: payload['eligible'] === true || isDecayPanelEligible(tier),
    graceDays: Number.isFinite(graceDays) ? graceDays : resolveDecayMaintenanceWindowDays(tier),
    daysLeft: Number.isFinite(daysLeftRaw) ? Math.max(0, Math.floor(daysLeftRaw)) : 0,
    meetsMaintenance: payload['meets_maintenance'] === true,
    lowerTier: lowerTier && lowerTier !== tier ? lowerTier : resolvePreviousEarnVipTier(tier),
    lastQualifyingAt,
    lastDecayAt,
  };
}

export function buildTierDecayPanelView(
  tier: EarnVipTier,
  status: TierDecayStatusSnapshot | null = null,
): TierDecayPanelView {
  const effectiveTier = status?.tier ?? tier;
  const eligible = status?.eligible ?? isDecayPanelEligible(effectiveTier);
  const lowerTier =
    status?.lowerTier ?? (eligible ? resolvePreviousEarnVipTier(effectiveTier) : null);
  const maintenanceWindowDays =
    status?.graceDays ?? resolveDecayMaintenanceWindowDays(effectiveTier);

  return {
    eligible,
    maintenanceWindowDays,
    maintenanceConditionKey: resolveTierMaintenanceConditionKey(effectiveTier),
    lowerTier,
    lowerTierLabelKey: lowerTier ? (`earn.tier.${lowerTier}` as MessageKey) : null,
    impactRows: eligible
      ? [
          buildTierBenefitsPreviewRow(effectiveTier, effectiveTier),
          ...(lowerTier ? [buildTierBenefitsPreviewRow(lowerTier, effectiveTier)] : []),
        ]
      : [],
    engineLive: Boolean(status),
    daysLeft: status ? status.daysLeft : null,
    meetsMaintenance: status ? status.meetsMaintenance : null,
  };
}

export function resolveTierKeepMissionHubRoute(): string {
  return '/home/missions?tab=tier';
}

/**
 * `/tier/me` History CTA target (ZA-07). `TIER_ME_HISTORY_ROUTE` has no route
 * file, so the CTA links to the existing reward ledger history page instead
 * of a dead link. Swap this to `TIER_ME_HISTORY_ROUTE` once a dedicated
 * tier/decay history page ships behind `tier_decay_events`.
 */
export function resolveTierMeHistoryLinkRoute(): string {
  return '/rewards/history';
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

export function tierMeUsesDecayStatusRpc(): string {
  return TIER_DECAY_STATUS_RPC;
}

/** Benefits mini-table — current tier always; includes lower tier when decay applies. */
export function buildTierMeBenefitsRows(tier: EarnVipTier): TierBenefitsPreviewRow[] {
  const panel = buildTierDecayPanelView(tier);
  if (panel.impactRows.length > 0) return panel.impactRows;
  return [buildTierBenefitsPreviewRow(tier, tier)];
}
