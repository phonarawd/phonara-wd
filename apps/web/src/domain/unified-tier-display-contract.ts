/**
 * Unified user tier display — Phase 1 E20 discovery contract.
 * Maps four dispersed tier sources (Earn VIP, KYC, Affiliate, PHON heuristic)
 * to a single VIP display lane + separate compliance/partner lanes.
 * Proposes Option A (display unify) vs Option B (engine unified tier — HIGH RPC backlog).
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E20 · plan §18
 */

import type { Tier } from '@phonara/shared-types';

export const EARN_HUB_STATUS_RPC = 'rpc_get_earn_hub_status' as const;
export const GOLDEN_EARTH_STATUS_RPC = 'rpc_get_golden_earth_status' as const;

/** Proposed for Option B only — operator decision required (§18.1 · engine freeze). */
export const PROPOSED_UNIFIED_TIER_SUMMARY_RPC = 'rpc_get_user_tier_summary' as const;

export const EARN_VIP_TABLE = 'user_earn_vip' as const;
export const KYC_TIER_COLUMN = 'profiles.kyc_tier' as const;
export const AFFILIATE_TIER_CONFIGS_TABLE = 'affiliate_tier_configs' as const;
export const AFFILIATE_TIER_SNAPSHOTS_TABLE = 'affiliate_tier_snapshots' as const;

export const ACCOUNT_ROUTE = '/account' as const;
export const HOME_ROUTE = '/home' as const;
export const DASHBOARD_ROUTE = '/dashboard' as const;
export const TIER_GUIDE_ROUTE = '/tier' as const;
export const PARTNER_ROUTE = '/partner' as const;
export const WALLET_ROUTE = '/wallet' as const;

/** Phase 7 net-new owner for tier detail sub-tab (plan §20.1 Account tier tab). */
export const TIER_DETAIL_REBUILD_TODO = 'p7-route-account' as const;

/** Earn VIP enum — canonical VIP badge ladder (shared with Golden Earth). */
export const EARN_VIP_TIER_ORDER = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
] as const satisfies readonly Tier[];

export type EarnVipTier = (typeof EARN_VIP_TIER_ORDER)[number];

/** KYC compliance lane — not a VIP badge; gates withdrawal/KYC only. */
export const KYC_TIER_ORDER = [
  'anonymous',
  'email_verified',
  'phone_verified',
  'id_verified',
] as const;

export type KycTier = (typeof KYC_TIER_ORDER)[number];

/** Affiliate partner lane — commission rates only; distinct naming from Earn VIP. */
export const AFFILIATE_TIER_ORDER = ['standard', 'silver', 'gold', 'platinum', 'elite'] as const;

export type AffiliateTierCode = (typeof AFFILIATE_TIER_ORDER)[number];

/** Client-only PHON balance heuristic — forbidden as VIP display source in net-new UI. */
export const PHON_HEURISTIC_THRESHOLDS: Readonly<Record<Exclude<Tier, 'bronze'>, string>> = {
  silver: '1000',
  gold: '10000',
  platinum: '50000',
  diamond: '100000',
};

/** Engine XP thresholds for next Earn VIP tier (`rpc_get_earn_hub_status`). */
export const EARN_VIP_XP_NEXT_TIER: Readonly<Record<Exclude<Tier, 'diamond'>, number>> = {
  bronze: 5000,
  silver: 25000,
  gold: 100000,
  platinum: 500000,
};

export type TierSourceKind =
  | 'earn_vip_engine'
  | 'kyc_compliance'
  | 'affiliate_partner'
  | 'phon_heuristic_client';

export type TierEngineStatus = 'exists' | 'partial' | 'missing';

export type TierExposureMode =
  | 'live'
  | 'partial'
  | 'missing'
  | 'built_hidden'
  | 'defer_stub'
  | 'forbidden';

export type TierGatingDomain =
  | 'earn_daily_limits'
  | 'golden_earth_tap_cap'
  | 'mission_eligibility'
  | 'referral_payout_cap'
  | 'withdrawal_kyc_gate'
  | 'affiliate_commission_rate'
  | 'sports_bet_policy'
  | 'trade_leverage_cap'
  | 'casino_stake_cap';

export const TIER_SOURCE_REGISTRY: Readonly<
  Record<
    TierSourceKind,
    {
      engine: TierEngineStatus;
      storage: string;
      rpc: string | null;
      vipBadgeEligible: boolean;
      moneyPath: boolean;
    }
  >
> = {
  earn_vip_engine: {
    engine: 'exists',
    storage: `${EARN_VIP_TABLE}.tier · earn_vip_tier enum`,
    rpc: EARN_HUB_STATUS_RPC,
    vipBadgeEligible: true,
    moneyPath: false,
  },
  kyc_compliance: {
    engine: 'exists',
    storage: KYC_TIER_COLUMN,
    rpc: null,
    vipBadgeEligible: false,
    moneyPath: true,
  },
  affiliate_partner: {
    engine: 'exists',
    storage: `${AFFILIATE_TIER_SNAPSHOTS_TABLE}.tier_code · ${AFFILIATE_TIER_CONFIGS_TABLE}`,
    rpc: 'rpc_refresh_affiliate_tier_snapshots (cron) · affiliate_settlements read',
    vipBadgeEligible: false,
    moneyPath: true,
  },
  phon_heuristic_client: {
    engine: 'missing',
    storage: 'client tierFromPhon() — wallet.phon_available thresholds',
    rpc: null,
    vipBadgeEligible: false,
    moneyPath: false,
  },
};

export const TIER_GATING_BY_DOMAIN: Readonly<
  Record<
    TierGatingDomain,
    {
      tierSource: TierSourceKind;
      engine: TierEngineStatus;
      enforcedIn: string;
    }
  >
> = {
  earn_daily_limits: {
    tierSource: 'earn_vip_engine',
    engine: 'exists',
    enforcedIn: '_earn_limit_* · rpc_get_earn_hub_status.limits_today',
  },
  golden_earth_tap_cap: {
    tierSource: 'earn_vip_engine',
    engine: 'exists',
    enforcedIn: '_golden_earth_base_cap · rpc_golden_earth_tap',
  },
  mission_eligibility: {
    tierSource: 'earn_vip_engine',
    engine: 'exists',
    enforcedIn: '_earn_tier_index · mission RPC eligibility checks',
  },
  referral_payout_cap: {
    tierSource: 'earn_vip_engine',
    engine: 'exists',
    enforcedIn: '_earn_limit_referral_payout · rpc_get_earn_hub_status.referral',
  },
  withdrawal_kyc_gate: {
    tierSource: 'kyc_compliance',
    engine: 'exists',
    enforcedIn: 'profiles.kyc_tier · rpc_create_*_withdrawal · sanctions gates',
  },
  affiliate_commission_rate: {
    tierSource: 'affiliate_partner',
    engine: 'exists',
    enforcedIn: '_affiliate_tier_for_settlement · affiliate_tier_configs bps',
  },
  sports_bet_policy: {
    tierSource: 'earn_vip_engine',
    engine: 'missing',
    enforcedIn: '— (E20 Option B · ties §E15 tier_bet_policy)',
  },
  trade_leverage_cap: {
    tierSource: 'earn_vip_engine',
    engine: 'missing',
    enforcedIn: '— (E20 Option B engine backlog)',
  },
  casino_stake_cap: {
    tierSource: 'earn_vip_engine',
    engine: 'missing',
    enforcedIn: '— (E20 Option B engine backlog)',
  },
};

export type UnifiedTierIntegrationOption = 'option_a_display_unify' | 'option_b_engine_unify';

/**
 * Option A — net-new UI only: Earn VIP is the single VIP badge source.
 * Replace all tierFromPhon() consumers with rpc_get_earn_hub_status.tier.
 */
export const TIER_INTEGRATION_OPTION_A: Readonly<{
  id: UnifiedTierIntegrationOption;
  engineChange: false;
  newRpcRequired: false;
  summaryKey: 'tier.integration.optionA';
}> = {
  id: 'option_a_display_unify',
  engineChange: false,
  newRpcRequired: false,
  summaryKey: 'tier.integration.optionA',
};

/**
 * Option B — platform-wide VIP (Trade/Casino/Sports/withdraw limits tied to one tier).
 * Requires operator-approved engine design + new RPC (HIGH backlog).
 */
export const TIER_INTEGRATION_OPTION_B: Readonly<{
  id: UnifiedTierIntegrationOption;
  engineChange: true;
  newRpcRequired: true;
  proposedRpc: typeof PROPOSED_UNIFIED_TIER_SUMMARY_RPC;
  priority: 'HIGH';
  summaryKey: 'tier.integration.optionB';
}> = {
  id: 'option_b_engine_unify',
  engineChange: true,
  newRpcRequired: true,
  proposedRpc: PROPOSED_UNIFIED_TIER_SUMMARY_RPC,
  priority: 'HIGH',
  summaryKey: 'tier.integration.optionB',
};

export type TierSurfaceRole =
  | 'vip_badge_profile'
  | 'vip_progress_panel'
  | 'vip_limits_matrix'
  | 'kyc_compliance_strip'
  | 'affiliate_commission_tier'
  | 'tier_guide_marketing';

export type TierSurfacePlacement = {
  route: string;
  role: TierSurfaceRole;
  hook: string;
  vipDisplaySource: TierSourceKind | 'static_mock';
  wireStatus: 'live' | 'partial' | 'missing' | 'forbidden';
};

export const UNIFIED_TIER_SURFACE_PLACEMENT: Readonly<TierSurfacePlacement[]> = [
  {
    route: ACCOUNT_ROUTE,
    role: 'vip_badge_profile',
    hook: 'useAccountPageController',
    vipDisplaySource: 'earn_vip_engine',
    wireStatus: 'live',
  },
  {
    route: DASHBOARD_ROUTE,
    role: 'vip_badge_profile',
    hook: 'useDashboardPageController',
    vipDisplaySource: 'earn_vip_engine',
    wireStatus: 'live',
  },
  {
    route: HOME_ROUTE,
    role: 'vip_badge_profile',
    hook: 'HomeSideNav · earnTierToBadge',
    vipDisplaySource: 'earn_vip_engine',
    wireStatus: 'partial',
  },
  {
    route: `${HOME_ROUTE}/missions`,
    role: 'vip_limits_matrix',
    hook: 'useEarnHubStatus · EarnLimitsGuide',
    vipDisplaySource: 'earn_vip_engine',
    wireStatus: 'live',
  },
  {
    route: HOME_ROUTE,
    role: 'vip_progress_panel',
    hook: 'TierProgressPanel · useEarnHubStatus',
    vipDisplaySource: 'earn_vip_engine',
    wireStatus: 'live',
  },
  {
    route: TIER_GUIDE_ROUTE,
    role: 'tier_guide_marketing',
    hook: 'useTierGuidePageController · TierGuidePage',
    vipDisplaySource: 'earn_vip_engine',
    wireStatus: 'live',
  },
  {
    route: PARTNER_ROUTE,
    role: 'affiliate_commission_tier',
    hook: 'usePartnerPageController',
    vipDisplaySource: 'affiliate_partner',
    wireStatus: 'live',
  },
  {
    route: WALLET_ROUTE,
    role: 'kyc_compliance_strip',
    hook: 'wallet-desk-surface · profile.kyc_tier',
    vipDisplaySource: 'kyc_compliance',
    wireStatus: 'live',
  },
];

/** Files still using forbidden PHON heuristic for VIP badge (Phase 1 audit 2026-07-02). */
export const PHON_HEURISTIC_VIP_CONSUMERS = [
  'apps/web/src/components/home/HomeSideNav.tsx (fallback only)',
] as const;

export const UNIFIED_TIER_NET_NEW_RULES = {
  /** Single VIP badge source for Account/Home/Dashboard/shell chrome. */
  canonicalVipSource: EARN_HUB_STATUS_RPC,
  /** KYC tier shown as compliance status — never mapped to TierBadge. */
  kycSeparateLane: true,
  /** Affiliate tier shown only on /partner — never mapped to TierBadge. */
  affiliateSeparateLane: true,
  /** tierFromPhon and client balance thresholds forbidden in net-new surfaces. */
  phonHeuristicForbidden: true,
  /** Tier guide /tier must wire rpc_get_earn_hub_status before Phase 7 DONE. */
  tierGuideMustWireEngine: true,
} as const;

export function isEarnVipTier(value: string | null | undefined): value is EarnVipTier {
  if (!value) return false;
  return (EARN_VIP_TIER_ORDER as readonly string[]).includes(value.toLowerCase());
}

export function normalizeEarnVipTier(value: string | null | undefined): EarnVipTier {
  const lower = value?.toLowerCase();
  if (isEarnVipTier(lower)) return lower;
  return 'bronze';
}

/** Option A resolver — prefer engine tier; never compute from PHON balance. */
export function resolveCanonicalVipTier(params: {
  earnHubTier: string | null | undefined;
  authenticated: boolean;
}): EarnVipTier {
  if (!params.authenticated) return 'bronze';
  return normalizeEarnVipTier(params.earnHubTier);
}

export function shouldForbidPhonHeuristicVipDisplay(): boolean {
  return UNIFIED_TIER_NET_NEW_RULES.phonHeuristicForbidden;
}

export function isProposedUnifiedTierRpcRequired(option: UnifiedTierIntegrationOption): boolean {
  return option === 'option_b_engine_unify';
}

export function listTierSurfacesUsingPhonHeuristic(): TierSurfacePlacement[] {
  return UNIFIED_TIER_SURFACE_PLACEMENT.filter(
    (row) => row.vipDisplaySource === 'phon_heuristic_client',
  );
}

export function listTierGatingMissingEngine(): TierGatingDomain[] {
  return (
    Object.entries(TIER_GATING_BY_DOMAIN) as [
      TierGatingDomain,
      (typeof TIER_GATING_BY_DOMAIN)[TierGatingDomain],
    ][]
  )
    .filter(([, row]) => row.engine === 'missing')
    .map(([domain]) => domain);
}

/** Affiliate "silver/gold" must not be shown as user VIP tier — naming collision risk. */
export function shouldKeepAffiliateTierSeparateFromVipBadge(): boolean {
  return UNIFIED_TIER_NET_NEW_RULES.affiliateSeparateLane;
}

/** KYC id_verified is compliance — not VIP diamond/platinum. */
export function shouldKeepKycTierSeparateFromVipBadge(): boolean {
  return UNIFIED_TIER_NET_NEW_RULES.kycSeparateLane;
}

/** `/tier` guide is live when wired to earn VIP engine (P12). */
export function isTierGuideSurfaceMockOnly(): boolean {
  const row = UNIFIED_TIER_SURFACE_PLACEMENT.find((r) => r.route === TIER_GUIDE_ROUTE);
  return row?.vipDisplaySource === 'static_mock' || row?.wireStatus === 'missing';
}

/** Button gated by tier must expose unlock path (plan §18.1 · §16.2). */
export function tierGatedActionRequiresUnlockCopy(blocked: boolean): boolean {
  return blocked;
}
