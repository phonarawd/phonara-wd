import { render, screen } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';

import { AdminWithdrawalsPage } from '@/product/surfaces/admin-withdrawals-page';

vi.mock('@/hooks/admin/useAdminOperatorRbac', () => ({
  useAdminOperatorRbac: () => ({
    role: 'owner',
    can: () => true,
    setPreviewRole: vi.fn(),
    roleLabelKey: 'admin.access.role.owner.label',
  }),
}));

vi.mock('@/hooks/admin/useAdminWalletDesk', () => ({
  useAdminWalletDesk: () => ({
    withdrawals: [
      {
        id: 'wd-pending-1',

        userId: 'u_***c91',

        amount: '120000',

        currency: 'KRW',

        method: 'krw',

        status: 'pending',

        createdAt: '2026-07-04T09:00:00.000Z',

        slaDueAt: '2026-06-17T08:00:00.000Z',

        destinationSummary: '신한 110-***-4421',
      },

      {
        id: 'wd-pending-2',

        userId: 'u_***af2',

        amount: '350',

        currency: 'USDT',

        method: 'crypto',

        status: 'pending',

        createdAt: '2026-07-04T08:30:00.000Z',

        slaDueAt: '2026-07-04T10:30:00.000Z',

        destinationSummary: 'TRC20 T***k7Yp',
      },

      {
        id: 'wd-approved-1',

        userId: 'u_***e08',

        amount: '1500000',

        currency: 'KRW',

        method: 'krw',

        status: 'approved',

        createdAt: '2026-07-04T08:00:00.000Z',

        slaDueAt: '2026-07-04T10:00:00.000Z',

        destinationSummary: '우리 1002-***-7755',
      },
    ],

    filteredWithdrawals: [
      {
        id: 'wd-pending-1',

        userId: 'u_***c91',

        amount: '120000',

        currency: 'KRW',

        method: 'krw',

        status: 'pending',

        createdAt: '2026-07-04T09:00:00.000Z',

        slaDueAt: '2026-06-17T08:00:00.000Z',

        destinationSummary: '신한 110-***-4421',
      },

      {
        id: 'wd-pending-2',

        userId: 'u_***af2',

        amount: '350',

        currency: 'USDT',

        method: 'crypto',

        status: 'pending',

        createdAt: '2026-07-04T08:30:00.000Z',

        slaDueAt: '2026-07-04T10:30:00.000Z',

        destinationSummary: 'TRC20 T***k7Yp',
      },

      {
        id: 'wd-approved-1',

        userId: 'u_***e08',

        amount: '1500000',

        currency: 'KRW',

        method: 'krw',

        status: 'approved',

        createdAt: '2026-07-04T08:00:00.000Z',

        slaDueAt: '2026-07-04T10:00:00.000Z',

        destinationSummary: '우리 1002-***-7755',
      },
    ],

    withdrawFilters: { search: '', status: [], method: [] },

    setWithdrawFilters: vi.fn(),

    approveWithdraw: vi.fn(),

    rejectWithdraw: vi.fn(),

    markSent: vi.fn(),
  }),

  formatAmountString: (amount: string, currency: string) => `${amount} ${currency}`,

  isOverdueSla: () => true,
}));

function renderWithdrawals() {
  return render(
    <I18nProvider>
      <AdminWithdrawalsPage />
    </I18nProvider>,
  );
}

describe('AdminWithdrawalsPage', () => {
  it('renders §29.2 withdraw approve, reject, and mark-sent actions', () => {
    renderWithdrawals();

    expect(screen.getByRole('heading', { level: 2, name: '출금 보내기' })).toBeInTheDocument();

    expect(screen.getByText(/처리할 출금 3건/)).toBeInTheDocument();

    expect(screen.getAllByRole('button', { name: '출금 승인' }).length).toBeGreaterThan(0);

    expect(screen.getAllByRole('button', { name: '반려' }).length).toBeGreaterThan(0);

    expect(screen.getByRole('button', { name: '송금 완료 표시' })).toBeInTheDocument();
  });
});
