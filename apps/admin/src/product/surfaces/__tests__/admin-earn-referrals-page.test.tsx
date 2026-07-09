import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminEarnReferralsPage } from '@/product/surfaces/admin-earn-referrals-page';

vi.mock('@/hooks/admin/useAdminReferralsDesk', () => ({
  useAdminReferralsDesk: () => ({
    pendingApprovals: [
      {
        id: 'ap_01',
        settlementId: 'st_01',
        affiliateMask: 'u_aur***park',
        periodKey: '2026-06-15',
        amount: '8420.000000',
        currency: 'USDT',
        state: 'pending',
        requestedAt: '2026-06-15T10:00:00.000Z',
      },
      {
        id: 'ap_02',
        settlementId: 'st_02',
        affiliateMask: 'u_bre***cole',
        periodKey: '2026-06-15',
        amount: '1200000.000000',
        currency: 'PHON',
        state: 'pending',
        requestedAt: '2026-06-15T10:05:00.000Z',
      },
    ],
    filteredApprovals: [
      {
        id: 'ap_01',
        settlementId: 'st_01',
        affiliateMask: 'u_aur***park',
        periodKey: '2026-06-15',
        amount: '8420.000000',
        currency: 'USDT',
        state: 'pending',
        requestedAt: '2026-06-15T10:00:00.000Z',
      },
      {
        id: 'ap_02',
        settlementId: 'st_02',
        affiliateMask: 'u_bre***cole',
        periodKey: '2026-06-15',
        amount: '1200000.000000',
        currency: 'PHON',
        state: 'pending',
        requestedAt: '2026-06-15T10:05:00.000Z',
      },
    ],
    filters: { search: '' },
    setFilters: vi.fn(),
    approveCommission: vi.fn(async () => true),
    runSettlements: vi.fn(async () => true),
    refresh: vi.fn(async () => undefined),
    approvals: [],
    audit: [],
    resetForTest: vi.fn(),
  }),
}));

describe('AdminEarnReferralsPage', () => {
  it('renders pending approval rows and settlement run action', () => {
    render(
      <I18nProvider>
        <AdminEarnReferralsPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText('u_aur***park')).toBeTruthy();
    expect(screen.getByText('u_bre***cole')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /승인|Approve/i }).length).toBeGreaterThan(0);
  });
});
