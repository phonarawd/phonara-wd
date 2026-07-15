import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminEarnPage } from '@/product/surfaces/admin-earn-page';

const approveSettlement = vi.fn(async () => true);

vi.mock('@/hooks/admin/useAdminOperatorRbac', () => ({
  useAdminOperatorRbac: () => ({
    role: 'owner',
    can: (action: string) => action === 'earn.settlement.approve',
    setPreviewRole: vi.fn(),
    roleLabelKey: 'admin.access.role.owner.label',
  }),
}));

vi.mock('@/hooks/admin/useAdminEarnDesk', () => ({
  useAdminEarnDesk: () => ({
    agents: [],
    filteredAgents: [],
    agentFilters: { search: '', tier: 'all', status: 'all' },
    setAgentFilters: vi.fn(),
    approveAgent: vi.fn(() => false),
    suspendAgent: vi.fn(() => false),
    setAgentTier: vi.fn(() => false),
    bulkApproveAgents: vi.fn(() => false),
    bulkSuspendAgents: vi.fn(() => false),
    agentTiers: ['bronze', 'silver', 'gold', 'platinum'],
    agentStatuses: ['pending', 'active', 'suspended'],
    settlements: [
      {
        id: 'stl_01',
        agentCode: 'PHN-A001',
        agentDisplayName: 'tier_gold',
        periodKey: '2026-06',
        amount: '8420.000000',
        currency: 'PHON',
        state: 'pending',
        createdAt: '2026-06-15T10:00:00.000Z',
      },
    ],
    filteredSettlements: [
      {
        id: 'stl_01',
        agentCode: 'PHN-A001',
        agentDisplayName: 'tier_gold',
        periodKey: '2026-06',
        amount: '8420.000000',
        currency: 'PHON',
        state: 'pending',
        createdAt: '2026-06-15T10:00:00.000Z',
      },
    ],
    settlementFilters: { search: '', state: 'all' },
    setSettlementFilters: vi.fn(),
    approveSettlement,
    markSettlementPaid: vi.fn(() => false),
    rejectSettlement: vi.fn(() => false),
    bulkApproveSettlements: vi.fn(() => false),
    bulkMarkSettlementsPaid: vi.fn(() => false),
    settlementStates: ['pending', 'approved', 'paid'],
    audit: [],
    loading: false,
    isError: false,
    refresh: vi.fn(async () => undefined),
    resetForTest: vi.fn(),
  }),
}));

vi.mock('@/lib/use-admin-route-navigate', () => ({
  useAdminRouteNavigate: () => vi.fn(),
}));

describe('AdminEarnPage', () => {
  it('opens reason dialog for settlement approve (H-08) · no agents tab (M-13)', () => {
    render(
      <I18nProvider>
        <AdminEarnPage />
      </I18nProvider>,
    );

    expect(screen.queryByRole('tab', { name: /에이전트|Agents/i })).toBeNull();
    expect(screen.getByText('8420 PHON')).toBeTruthy();
    fireEvent.click(screen.getByTestId('admin-earn-approve-stl_01'));
    expect(screen.getByRole('heading', { name: '정산 승인' })).toBeTruthy();
    expect(approveSettlement).not.toHaveBeenCalled();
  });
});
