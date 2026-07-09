import { describe, expect, it } from 'vitest';
import {
  AFFILIATE_PARTNER_CANARY_WAVE,
  AFFILIATE_PARTNER_ENGINE_BRANCHES,
  AFFILIATE_PARTNER_PLACEMENT,
  AFFILIATE_PARTNER_UI_WIRE_STATUS,
  AFFILIATE_SETTLEMENT_PAYOUT_HELPER,
  PARTNER_PRIMARY_ROUTE,
  REFERRAL_PRIMARY_ROUTE,
  REFERRAL_REGISTER_RPC,
  affiliatePartnerBranchRequiresCanary,
  resolveAffiliatePartnerBranchExposure,
  resolvePartnerPageGated,
  shouldDeferPartnerRankSnapshot,
  shouldDeferReferralPayoutCta,
} from '../affiliate-partner-display-contract';

describe('affiliate-partner-display-contract', () => {
  it('locks referral and partner to distinct canonical routes', () => {
    const routes = AFFILIATE_PARTNER_PLACEMENT.map((row) => row.route);
    expect(routes).toContain(REFERRAL_PRIMARY_ROUTE);
    expect(routes).toContain(PARTNER_PRIMARY_ROUTE);
    expect(routes.filter((r) => r === REFERRAL_PRIMARY_ROUTE)).toHaveLength(1);
    expect(routes.filter((r) => r === PARTNER_PRIMARY_ROUTE)).toHaveLength(1);
  });

  it('documents engine EXISTS for referral register and affiliate settlement payout (Phase 1 audit)', () => {
    expect(AFFILIATE_PARTNER_ENGINE_BRANCHES.referral_register).toEqual({
      engine: 'exists',
      rpc: REFERRAL_REGISTER_RPC,
      moneyPath: false,
    });
    expect(AFFILIATE_PARTNER_ENGINE_BRANCHES.affiliate_settlement_payout).toEqual({
      engine: 'exists',
      rpc: AFFILIATE_SETTLEMENT_PAYOUT_HELPER,
      moneyPath: true,
    });
  });

  it('defers partner rank snapshot until engine branch exists', () => {
    expect(AFFILIATE_PARTNER_ENGINE_BRANCHES.affiliate_rank_leaderboard.engine).toBe('missing');
    expect(shouldDeferPartnerRankSnapshot()).toBe(true);
    expect(resolveAffiliatePartnerBranchExposure('affiliate_rank_leaderboard')).toBe('defer_stub');
  });

  it('partner settlements read is built_hidden until partner gate lifted', () => {
    expect(resolveAffiliatePartnerBranchExposure('affiliate_settlements_read')).toBe(
      'built_hidden',
    );
    expect(AFFILIATE_PARTNER_UI_WIRE_STATUS['/partner']).toBe('gated_default');
  });

  it('money paths require §7 Canary when user-facing live', () => {
    expect(affiliatePartnerBranchRequiresCanary('affiliate_settlement_payout')).toBe(true);
    expect(affiliatePartnerBranchRequiresCanary('referral_qualification_credit')).toBe(true);
    expect(affiliatePartnerBranchRequiresCanary('referral_register')).toBe(false);
    expect(affiliatePartnerBranchRequiresCanary('affiliate_commission_approval')).toBe(false);
    expect(AFFILIATE_PARTNER_CANARY_WAVE).toBe('phase8-affiliate-payout');
  });

  it('defers referral payout CTA until canary (historical read OK)', () => {
    expect(shouldDeferReferralPayoutCta()).toBe(true);
    expect(resolveAffiliatePartnerBranchExposure('referral_dashboard_read')).toBe('live');
  });

  it('resolvePartnerPageGated matches route search contract', () => {
    expect(resolvePartnerPageGated(undefined)).toBe(true);
    expect(resolvePartnerPageGated(null)).toBe(true);
    expect(resolvePartnerPageGated('')).toBe(true);
    expect(resolvePartnerPageGated('1')).toBe(false);
    expect(resolvePartnerPageGated('true')).toBe(false);
    expect(resolvePartnerPageGated('0')).toBe(true);
  });

  it('records Phase 1 wired referral and gated-default partner', () => {
    expect(AFFILIATE_PARTNER_UI_WIRE_STATUS['/referral']).toBe('wired');
    expect(AFFILIATE_PARTNER_UI_WIRE_STATUS['/admin/earn']).toBe('wired');
  });
});
