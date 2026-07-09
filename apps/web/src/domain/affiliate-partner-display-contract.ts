/**
 * Affiliate / Partner — Phase 1 E11 discovery contract (placement + exposure).
 * Commission payouts and referral rewards are engine/RPC only; this module defines
 * route ownership, defer rules, and §7 Canary triggers when payout paths go user-facing live.
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E11
 */

export const REFERRAL_REGISTER_RPC = 'rpc_register_referral' as const;
export const AFFILIATE_RELATIONSHIP_RPC = 'rpc_register_affiliate_relationship' as const;
export const AFFILIATE_SETTLEMENTS_RUN_RPC = 'rpc_run_affiliate_settlements' as const;
export const AFFILIATE_APPROVAL_RPC = 'rpc_approve_affiliate_commission' as const;

/** Referral welcome-reward credit — server-triggered on qualification, not user-initiated. */
export const REFERRAL_QUALIFICATION_CREDIT_HELPER =
  '_referral_qualification_reward_internal' as const;

/** Affiliate batch payout — admin/cron via `_run_affiliate_settlements` → wallet credit. */
export const AFFILIATE_SETTLEMENT_PAYOUT_HELPER = '_pay_affiliate_settlement' as const;

export const REFERRAL_PRIMARY_ROUTE = '/referral' as const;
export const PARTNER_PRIMARY_ROUTE = '/partner' as const;
export const ADMIN_EARN_ROUTE = '/admin/earn' as const;

/** §7 Money Rollout wave id when affiliate/partner payout paths go user-facing live. */
export const AFFILIATE_PARTNER_CANARY_WAVE = 'phase8-affiliate-payout' as const;

export type AffiliatePartnerEngineBranch =
  | 'referral_register'
  | 'referral_dashboard_read'
  | 'referral_qualification_credit'
  | 'affiliate_relationship_register'
  | 'affiliate_settlements_read'
  | 'affiliate_settlement_payout'
  | 'affiliate_commission_approval'
  | 'affiliate_rank_leaderboard'
  | 'affiliate_daily_aggregates_read';

export type AffiliatePartnerBranchEngineStatus = 'exists' | 'partial' | 'missing';

export type AffiliatePartnerExposureMode = 'live' | 'built_hidden' | 'defer_stub';

export const AFFILIATE_PARTNER_ENGINE_BRANCHES: Readonly<
  Record<
    AffiliatePartnerEngineBranch,
    { engine: AffiliatePartnerBranchEngineStatus; rpc: string | null; moneyPath: boolean }
  >
> = {
  referral_register: { engine: 'exists', rpc: REFERRAL_REGISTER_RPC, moneyPath: false },
  referral_dashboard_read: { engine: 'exists', rpc: null, moneyPath: false },
  referral_qualification_credit: {
    engine: 'exists',
    rpc: REFERRAL_QUALIFICATION_CREDIT_HELPER,
    moneyPath: true,
  },
  affiliate_relationship_register: {
    engine: 'exists',
    rpc: AFFILIATE_RELATIONSHIP_RPC,
    moneyPath: false,
  },
  affiliate_settlements_read: { engine: 'exists', rpc: null, moneyPath: false },
  affiliate_settlement_payout: {
    engine: 'exists',
    rpc: AFFILIATE_SETTLEMENT_PAYOUT_HELPER,
    moneyPath: true,
  },
  affiliate_commission_approval: {
    engine: 'exists',
    rpc: AFFILIATE_APPROVAL_RPC,
    moneyPath: true,
  },
  affiliate_rank_leaderboard: { engine: 'missing', rpc: null, moneyPath: false },
  affiliate_daily_aggregates_read: { engine: 'partial', rpc: null, moneyPath: false },
};

export type AffiliatePartnerSurfaceRole =
  | 'referral_dashboard'
  | 'referral_fomo'
  | 'affiliate_commission_read'
  | 'settlement_approval_queue';

export type AffiliatePartnerSurfacePlacement = {
  route:
    | typeof REFERRAL_PRIMARY_ROUTE
    | typeof PARTNER_PRIMARY_ROUTE
    | typeof ADMIN_EARN_ROUTE
    | '/home';
  role: AffiliatePartnerSurfaceRole;
  hook:
    | 'useReferralPageController'
    | 'useHomeReferralDisplay'
    | 'usePartnerPageController'
    | 'useAdminEarnDesk';
};

export const AFFILIATE_PARTNER_PLACEMENT: Readonly<AffiliatePartnerSurfacePlacement[]> = [
  {
    route: REFERRAL_PRIMARY_ROUTE,
    role: 'referral_dashboard',
    hook: 'useReferralPageController',
  },
  {
    route: '/home',
    role: 'referral_fomo',
    hook: 'useHomeReferralDisplay',
  },
  {
    route: PARTNER_PRIMARY_ROUTE,
    role: 'affiliate_commission_read',
    hook: 'usePartnerPageController',
  },
  {
    route: ADMIN_EARN_ROUTE,
    role: 'settlement_approval_queue',
    hook: 'useAdminEarnDesk',
  },
];

/** Phase 1 audit (2026-07-02): referral wired; partner read wired when ungated; rank snapshot static. */
export const AFFILIATE_PARTNER_UI_WIRE_STATUS: Readonly<
  Record<
    typeof REFERRAL_PRIMARY_ROUTE | typeof PARTNER_PRIMARY_ROUTE | typeof ADMIN_EARN_ROUTE,
    'wired' | 'unwired' | 'gated_default'
  >
> = {
  '/referral': 'wired',
  '/partner': 'gated_default',
  '/admin/earn': 'wired',
};

export function resolveAffiliatePartnerBranchExposure(
  branch: AffiliatePartnerEngineBranch,
): AffiliatePartnerExposureMode {
  const row = AFFILIATE_PARTNER_ENGINE_BRANCHES[branch];
  if (row.engine === 'missing') return 'defer_stub';
  if (row.engine === 'partial') return 'built_hidden';
  if (branch === 'affiliate_rank_leaderboard') return 'defer_stub';
  if (branch === 'affiliate_settlements_read') return 'built_hidden';
  return 'live';
}

/** Branches that trigger §7 Canary (≥3d · ≥50 sessions · Σ=0) when user-facing payout/credit goes live. */
export function affiliatePartnerBranchRequiresCanary(
  branch: AffiliatePartnerEngineBranch,
): boolean {
  const row = AFFILIATE_PARTNER_ENGINE_BRANCHES[branch];
  if (!row.moneyPath) return false;
  return branch === 'affiliate_settlement_payout' || branch === 'referral_qualification_credit';
}

/**
 * Partner hub default gate — matches `apps/web/src/routes/partner.tsx`.
 * Default hidden until operator enables via `?partner=1` or `?partner=true`.
 */
export function resolvePartnerPageGated(searchPartner: unknown): boolean {
  if (searchPartner === undefined || searchPartner === null || searchPartner === '') return true;
  const s = String(searchPartner);
  return s !== '1' && s !== 'true';
}

/** Static `PARTNER_RANK_SNAPSHOT` on partner page — presentation only until engine leaderboard RPC. */
export function shouldDeferPartnerRankSnapshot(): boolean {
  return AFFILIATE_PARTNER_ENGINE_BRANCHES.affiliate_rank_leaderboard.engine !== 'exists';
}

/**
 * `/referral` defers user-facing payout CTAs until §7 Canary — dashboard may show
 * historical paid totals from `referrals` RLS read only (no client reward math).
 */
export function shouldDeferReferralPayoutCta(): boolean {
  return affiliatePartnerBranchRequiresCanary('referral_qualification_credit');
}

/** Forbidden: summing settlement JSONB client-side for wallet balance — use RPC/hook display only. */
export const AFFILIATE_COMMISSION_DISPLAY_IS_HOOK_AGGREGATE = true as const;
