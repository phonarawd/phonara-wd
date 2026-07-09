import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminEarnMissionsPage } from '@/product/surfaces/admin-earn-missions-page';

vi.mock('@/hooks/admin/useAdminMissionsDesk', () => ({
  useAdminMissionsDesk: () => ({
    earnLimits: [
      {
        key: 'referral_qualified_reward_phon',
        labelKey: 'admin.missions.earn.referralQualified',
        value: '10000',
        description: 'Qualified referral reward',
      },
    ],
    viralMissions: [
      {
        id: 'share_referral_link',
        labelKey: 'admin.missions.viral.shareReferralLink',
        rewardPhon: '300',
        quota: '3',
        quotaPeriodKey: 'admin.missions.quota.perDay',
        extraValue: null,
        extraLabelKey: null,
        exposure: 'live',
      },
      {
        id: 'invite_friend_signup',
        labelKey: 'admin.missions.viral.inviteFriendSignup',
        rewardPhon: '10000',
        quota: '5',
        quotaPeriodKey: 'admin.missions.quota.perDay',
        extraValue: null,
        extraLabelKey: null,
        exposure: 'live',
      },
    ],
    isLoading: false,
    isError: false,
    refresh: vi.fn(async () => undefined),
  }),
}));

describe('AdminEarnMissionsPage', () => {
  it('renders viral mission rows and earn limit tab without write actions', () => {
    render(
      <I18nProvider>
        <AdminEarnMissionsPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText('300 PHON')).toBeTruthy();
    expect(screen.getByText('10000 PHON')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /저장|Save|수정|Edit/i })).toBeNull();
  });
});
