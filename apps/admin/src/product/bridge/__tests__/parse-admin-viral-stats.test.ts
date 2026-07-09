import { describe, expect, it } from 'vitest';

import {
  buildPartialFlags,
  parseCommissionAggregates,
  parseReferralSnapshot,
  parseViralMissionClaimAggregates,
} from '@/product/bridge/parse-admin-viral-stats';

describe('parse-admin-viral-stats', () => {
  it('counts referral links and recent weekly joins', () => {
    const now = Date.now();
    const rows = [
      { parent_id: 'a', created_at: new Date(now - 86400000).toISOString() },
      { parent_id: 'a', created_at: new Date(now - 86400000 * 10).toISOString() },
      { parent_id: 'b', created_at: new Date(now - 86400000 * 2).toISOString() },
    ];

    const snapshot = parseReferralSnapshot(rows, 99);

    expect(snapshot).toMatchObject({
      totalLinks: 99,
      uniqueAffiliates: 2,
      recentLinks: 2,
    });
  });

  it('aggregates viral mission claims by mission code', () => {
    const rows = parseViralMissionClaimAggregates([
      { mission: 'share_referral_link', phon_awarded: '300.000000', claimed_at: '2026-07-01' },
      { mission: 'share_referral_link', phon_awarded: '300.000000', claimed_at: '2026-07-02' },
      { mission: 'invite_friend_signup', phon_awarded: '10000.000000', claimed_at: '2026-07-03' },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.mission === 'share_referral_link')).toMatchObject({
      claimCount: 2,
      phonAwardedTotal: '600.000000',
      labelKey: 'admin.missions.viral.shareReferralLink',
    });
  });

  it('rolls up commission aggregates by domain and currency', () => {
    const rows = parseCommissionAggregates([
      {
        domain: 'game',
        currency: 'PHON',
        gross_revenue: '10.000000',
        aggregate_date: '2026-07-01',
      },
      {
        domain: 'game',
        currency: 'PHON',
        gross_revenue: '5.500000',
        aggregate_date: '2026-07-03',
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      domain: 'game',
      currency: 'PHON',
      grossRevenueTotal: '15.500000',
      latestDate: '2026-07-03',
      rowCount: 2,
    });
  });

  it('flags partial samples when row limits are reached', () => {
    expect(
      buildPartialFlags({
        relationshipRows: 5000,
        relationshipLimit: 5000,
        claimRows: 100,
        claimLimit: 500,
        commissionRows: 200,
        commissionLimit: 200,
      }),
    ).toMatchObject({
      relationshipsTruncated: true,
      claimsTruncated: false,
      commissionsTruncated: true,
    });
  });
});
