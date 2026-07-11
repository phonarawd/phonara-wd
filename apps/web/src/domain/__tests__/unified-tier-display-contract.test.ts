import { describe, expect, it } from 'vitest';
import {
  AFFILIATE_TIER_ORDER,
  EARN_HUB_STATUS_RPC,
  EARN_VIP_TIER_ORDER,
  EARN_VIP_XP_NEXT_TIER,
  KYC_TIER_ORDER,
  PHON_HEURISTIC_VIP_CONSUMERS,
  PROPOSED_UNIFIED_TIER_SUMMARY_RPC,
  TIER_GATING_BY_DOMAIN,
  TIER_INTEGRATION_OPTION_A,
  TIER_INTEGRATION_OPTION_B,
  TIER_SOURCE_REGISTRY,
  UNIFIED_TIER_NET_NEW_RULES,
  UNIFIED_TIER_SURFACE_PLACEMENT,
  isEarnVipTier,
  isProposedUnifiedTierRpcRequired,
  isTierGuideSurfaceMockOnly,
  listTierGatingMissingEngine,
  listTierSurfacesUsingPhonHeuristic,
  normalizeEarnVipTier,
  resolveCanonicalVipTier,
  shouldForbidPhonHeuristicVipDisplay,
  shouldKeepAffiliateTierSeparateFromVipBadge,
  shouldKeepKycTierSeparateFromVipBadge,
} from '../unified-tier-display-contract';

describe('unified-tier-display-contract', () => {
  it('documents four dispersed tier sources (Phase 1 audit)', () => {
    expect(TIER_SOURCE_REGISTRY.earn_vip_engine.engine).toBe('exists');
    expect(TIER_SOURCE_REGISTRY.kyc_compliance.engine).toBe('exists');
    expect(TIER_SOURCE_REGISTRY.affiliate_partner.engine).toBe('exists');
    expect(TIER_SOURCE_REGISTRY.phon_heuristic_client.engine).toBe('missing');
    expect(TIER_SOURCE_REGISTRY.phon_heuristic_client.vipBadgeEligible).toBe(false);
  });

  it('locks Earn VIP enum order and XP next-tier thresholds from engine', () => {
    expect(EARN_VIP_TIER_ORDER).toEqual(['bronze', 'silver', 'gold', 'platinum', 'diamond']);
    expect(EARN_VIP_XP_NEXT_TIER.bronze).toBe(5000);
    expect(EARN_VIP_XP_NEXT_TIER.platinum).toBe(500000);
  });

  it('keeps KYC and affiliate lanes separate from VIP badge', () => {
    expect(KYC_TIER_ORDER).toContain('id_verified');
    expect(AFFILIATE_TIER_ORDER).toContain('elite');
    expect(AFFILIATE_TIER_ORDER).not.toContain('diamond');
    expect(shouldKeepKycTierSeparateFromVipBadge()).toBe(true);
    expect(shouldKeepAffiliateTierSeparateFromVipBadge()).toBe(true);
  });

  it('defines Option A (display unify) without new RPC', () => {
    expect(TIER_INTEGRATION_OPTION_A.engineChange).toBe(false);
    expect(TIER_INTEGRATION_OPTION_A.newRpcRequired).toBe(false);
    expect(UNIFIED_TIER_NET_NEW_RULES.canonicalVipSource).toBe(EARN_HUB_STATUS_RPC);
    expect(isProposedUnifiedTierRpcRequired('option_a_display_unify')).toBe(false);
  });

  it('defines Option B with HIGH-priority proposed rpc_get_user_tier_summary', () => {
    expect(TIER_INTEGRATION_OPTION_B.engineChange).toBe(true);
    expect(TIER_INTEGRATION_OPTION_B.newRpcRequired).toBe(true);
    expect(TIER_INTEGRATION_OPTION_B.priority).toBe('HIGH');
    expect(TIER_INTEGRATION_OPTION_B.proposedRpc).toBe(PROPOSED_UNIFIED_TIER_SUMMARY_RPC);
    expect(isProposedUnifiedTierRpcRequired('option_b_engine_unify')).toBe(true);
  });

  it('documents remaining PHON heuristic fallback consumers', () => {
    expect(PHON_HEURISTIC_VIP_CONSUMERS.length).toBeGreaterThanOrEqual(1);
    expect(shouldForbidPhonHeuristicVipDisplay()).toBe(true);
    const phonSurfaces = listTierSurfacesUsingPhonHeuristic();
    expect(phonSurfaces.some((row) => row.route === '/account')).toBe(false);
    expect(phonSurfaces.some((row) => row.route === '/dashboard')).toBe(false);
  });

  it('documents live Earn VIP wiring on account, dashboard, missions, and progress panel', () => {
    const liveRows = UNIFIED_TIER_SURFACE_PLACEMENT.filter((row) => row.wireStatus === 'live');
    expect(liveRows.some((row) => row.route === '/account')).toBe(true);
    expect(liveRows.some((row) => row.route === '/dashboard')).toBe(true);
    expect(liveRows.some((row) => row.hook.includes('EarnLimitsGuide'))).toBe(true);
    expect(liveRows.some((row) => row.hook.includes('TierProgressPanel'))).toBe(true);
  });

  it('wires /tier guide to earn VIP engine (P12 marketing hub)', () => {
    expect(isTierGuideSurfaceMockOnly()).toBe(false);
    const tierRow = UNIFIED_TIER_SURFACE_PLACEMENT.find((row) => row.route === '/tier');
    expect(tierRow?.vipDisplaySource).toBe('earn_vip_engine');
    expect(tierRow?.wireStatus).toBe('live');
  });

  it('marks platform-wide tier gating domains as engine MISSING (Option B backlog)', () => {
    expect(TIER_GATING_BY_DOMAIN.sports_bet_policy.engine).toBe('missing');
    expect(TIER_GATING_BY_DOMAIN.trade_leverage_cap.engine).toBe('missing');
    expect(TIER_GATING_BY_DOMAIN.casino_stake_cap.engine).toBe('missing');
    const missing = listTierGatingMissingEngine();
    expect(missing).toContain('sports_bet_policy');
    expect(missing).toContain('trade_leverage_cap');
    expect(missing).toContain('casino_stake_cap');
  });

  it('documents EXISTS earn gating (limits, golden earth, missions)', () => {
    expect(TIER_GATING_BY_DOMAIN.earn_daily_limits.engine).toBe('exists');
    expect(TIER_GATING_BY_DOMAIN.golden_earth_tap_cap.engine).toBe('exists');
    expect(TIER_GATING_BY_DOMAIN.mission_eligibility.engine).toBe('exists');
    expect(TIER_GATING_BY_DOMAIN.withdrawal_kyc_gate.engine).toBe('exists');
    expect(TIER_GATING_BY_DOMAIN.affiliate_commission_rate.engine).toBe('exists');
  });

  it('resolveCanonicalVipTier prefers earn hub tier and ignores PHON balance', () => {
    expect(resolveCanonicalVipTier({ earnHubTier: 'gold', authenticated: true })).toBe('gold');
    expect(resolveCanonicalVipTier({ earnHubTier: null, authenticated: true })).toBe('bronze');
    expect(resolveCanonicalVipTier({ earnHubTier: 'platinum', authenticated: false })).toBe(
      'bronze',
    );
    expect(normalizeEarnVipTier('GOLD')).toBe('gold');
    expect(isEarnVipTier('elite')).toBe(false);
  });
});
