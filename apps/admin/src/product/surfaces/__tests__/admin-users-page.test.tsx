import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminUsersPage } from '@/product/surfaces/admin-users-page';

vi.mock('@/lib/use-admin-route-navigate', () => ({
  useAdminRouteNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/admin/useAdminUsersDesk', () => ({
  useAdminUsersDesk: () => ({
    users: [
      {
        id: 'u_active',
        emailMasked: 'ac***@nav.kr',
        displayName: 'Active User',
        kycTier: 'tier2',
        status: 'active',
        mfaEnabled: true,
        lastSessionAt: '2026-06-17T08:02:00.000Z',
        balanceCash: '1000',
        balanceBonus: '0',
        balanceLocked: '0',
        activeSessions: 1,
        riskFlagCount: 0,
      },
      {
        id: 'u_suspended',
        emailMasked: 'su***@nav.kr',
        displayName: 'Suspended User',
        kycTier: 'tier1',
        status: 'suspended',
        mfaEnabled: false,
        lastSessionAt: '2026-06-16T22:15:00.000Z',
        balanceCash: '500',
        balanceBonus: '0',
        balanceLocked: '500',
        activeSessions: 0,
        riskFlagCount: 1,
      },
    ],
    filteredUsers: [
      {
        id: 'u_active',
        emailMasked: 'ac***@nav.kr',
        displayName: 'Active User',
        kycTier: 'tier2',
        status: 'active',
        mfaEnabled: true,
        lastSessionAt: '2026-06-17T08:02:00.000Z',
        balanceCash: '1000',
        balanceBonus: '0',
        balanceLocked: '0',
        activeSessions: 1,
        riskFlagCount: 0,
      },
      {
        id: 'u_suspended',
        emailMasked: 'su***@nav.kr',
        displayName: 'Suspended User',
        kycTier: 'tier1',
        status: 'suspended',
        mfaEnabled: false,
        lastSessionAt: '2026-06-16T22:15:00.000Z',
        balanceCash: '500',
        balanceBonus: '0',
        balanceLocked: '500',
        activeSessions: 0,
        riskFlagCount: 1,
      },
    ],
    filters: { search: '', status: [], kyc: [] },
    setFilters: vi.fn(),
    audit: [],
    selfExclusionByUserId: new Map([
      [
        'u_suspended',
        {
          id: 'exc_suspended',
          userId: 'u_suspended',
          status: 'release_requested',
          excludedUntil: '2026-09-01T00:00:00.000Z',
        },
      ],
    ]),
    suspendUser: vi.fn(),
    unsuspendUser: vi.fn(),
    releaseSelfExclusion: vi.fn(),
    loading: false,
    isError: false,
    refresh: vi.fn(async () => undefined),
  }),
  userBalanceSummaryParts: (row: {
    balanceCash: string;
    balanceBonus: string;
    balanceLocked: string;
  }) => ({
    cash: row.balanceCash,
    bonus: row.balanceBonus,
    locked: row.balanceLocked,
  }),
}));

describe('AdminUsersPage', () => {
  it('renders member list and §29.2 actions without gap controls', () => {
    render(
      <I18nProvider>
        <AdminUsersPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText('Active User')).toBeTruthy();

    const activeRow = screen.getByText('Active User').closest('tr');
    const suspendedRow = screen.getByText('Suspended User').closest('tr');
    expect(activeRow).toBeTruthy();
    expect(suspendedRow).toBeTruthy();

    expect(within(activeRow!).getByRole('button', { name: /^정지$|^Suspend$/i })).toBeTruthy();
    expect(
      within(suspendedRow!).getByRole('button', { name: /^정지 해제$|^Unsuspend$/i }),
    ).toBeTruthy();
    expect(
      within(suspendedRow!).getByRole('button', {
        name: /^자기제한 해제$|^Release self-exclusion$/i,
      }),
    ).toBeTruthy();
    expect(within(activeRow!).queryByRole('button', { name: /^차단$|^Ban$/i })).toBeNull();
    expect(within(suspendedRow!).queryByRole('button', { name: /^차단$|^Ban$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /MFA|잔액 수동|Manual balance/i })).toBeNull();
    expect(screen.getByText(/MFA.*지원하지 않습니다|not available on this page/i)).toBeTruthy();
  });
});
