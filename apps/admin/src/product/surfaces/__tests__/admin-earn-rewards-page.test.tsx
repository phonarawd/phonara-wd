import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminEarnRewardsPage } from '@/product/surfaces/admin-earn-rewards-page';

vi.mock('@/hooks/admin/useAdminOperatorRbac', () => ({
  useAdminOperatorRbac: () => ({
    role: 'owner',
    can: () => true,
    setPreviewRole: vi.fn(),
    roleLabelKey: 'admin.access.role.owner.label',
  }),
}));

vi.mock('@/hooks/admin/useAdminRewardsDesk', () => ({
  useAdminRewardsDesk: () => ({
    users: [
      {
        id: 'u_8af201',
        emailMasked: 'ji***@nav.kr',
        displayName: 'Jihoon K.',
        kycTier: 'tier2',
        status: 'active',
        mfaEnabled: true,
        lastSessionAt: '2026-06-17T08:02:00.000Z',
        balanceCash: '1284500',
        balanceBonus: '32000',
        balanceLocked: '0',
        activeSessions: 2,
        riskFlagCount: 0,
      },
    ],
    filteredUsers: [
      {
        id: 'u_8af201',
        emailMasked: 'ji***@nav.kr',
        displayName: 'Jihoon K.',
        kycTier: 'tier2',
        status: 'active',
        mfaEnabled: true,
        lastSessionAt: '2026-06-17T08:02:00.000Z',
        balanceCash: '1284500',
        balanceBonus: '32000',
        balanceLocked: '0',
        activeSessions: 2,
        riskFlagCount: 0,
      },
    ],
    filters: { search: '' },
    setFilters: vi.fn(),
    recentAdjustments: [
      {
        id: 'adj_01',
        userMask: 'ji***@nav.kr',
        currency: 'PHON',
        amount: '50000.000000',
        direction: 'credit',
        reason: '이벤트 보상 지급',
        at: '2026-06-16T14:20:00.000Z',
      },
    ],
    manualAdjust: vi.fn(async () => true),
    audit: [],
    loading: false,
    isError: false,
    refresh: vi.fn(async () => undefined),
  }),
}));

describe('AdminEarnRewardsPage', () => {
  it('renders member list, adjustment history, and manual adjust entry', () => {
    render(
      <I18nProvider>
        <AdminEarnRewardsPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText('Jihoon K.')).toBeTruthy();
    expect(screen.getByText('이벤트 보상 지급')).toBeTruthy();
    expect(screen.getByText(/회원을 먼저 선택|Select a member first/i)).toBeTruthy();
  });
});
