import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminEarnPage } from '@/product/surfaces/admin-earn-page';

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
      {
        id: 'stl_02',
        agentCode: 'PHN-A002',
        agentDisplayName: 'tier_silver',
        periodKey: '2026-05',
        amount: '1200.000000',
        currency: 'PHON',
        state: 'paid',
        createdAt: '2026-05-30T00:00:00.000Z',
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
      {
        id: 'stl_02',
        agentCode: 'PHN-A002',
        agentDisplayName: 'tier_silver',
        periodKey: '2026-05',
        amount: '1200.000000',
        currency: 'PHON',
        state: 'paid',
        createdAt: '2026-05-30T00:00:00.000Z',
      },
    ],
    settlementFilters: { search: '', state: 'all' },
    setSettlementFilters: vi.fn(),
    approveSettlement: vi.fn(() => true),
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

describe('AdminEarnPage', () => {
  it('renders earn desk settlements with approve action and deferred agent notice (§29.2)', () => {
    render(
      <I18nProvider>
        <AdminEarnPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText('PHN-A001')).toBeTruthy();
    expect(screen.getByText('PHN-A002')).toBeTruthy();
    expect(
      screen.getByText(
        /지급 처리·반려는 서버 API|Mark paid and reject settlement actions await server API/i,
      ),
    ).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^승인$|^Approve$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /열기|Open/i }).length).toBeGreaterThan(0);
  });
});
