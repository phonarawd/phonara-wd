import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminViralStatsPage } from '@/product/surfaces/admin-viral-stats-page';

vi.mock('@/hooks/admin/useAdminViralStatsDesk', () => ({
  useAdminViralStatsDesk: () => ({
    referralSnapshot: {
      totalLinks: 128,
      uniqueAffiliates: 42,
      recentLinks: 9,
    },
    missionClaims: [
      {
        mission: 'share_referral_link',
        labelKey: 'admin.missions.viral.shareReferralLink',
        claimCount: 24,
        phonAwardedTotal: '7200.000000',
      },
      {
        mission: 'invite_friend_signup',
        labelKey: 'admin.missions.viral.inviteFriendSignup',
        claimCount: 3,
        phonAwardedTotal: '30000.000000',
      },
    ],
    commissionAggregates: [
      {
        domain: 'game',
        currency: 'PHON',
        grossRevenueTotal: '450.250000',
        latestDate: '2026-07-03',
        rowCount: 12,
      },
    ],
    partialFlags: {
      relationshipsTruncated: false,
      claimsTruncated: false,
      commissionsTruncated: false,
    },
    shareEventsAvailable: false,
    isLoading: false,
    isError: false,
    refresh: vi.fn(async () => undefined),
  }),
}));

describe('AdminViralStatsPage', () => {
  it('renders referral metrics, mission claim aggregates, and share-events gap notice', () => {
    render(
      <I18nProvider>
        <AdminViralStatsPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getAllByText('128').length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: /바이럴 미션|Viral missions/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /공유 횟수|Share counts/i })).toBeTruthy();
  });
});
