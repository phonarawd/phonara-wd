import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminDepositsPage } from '@/product/surfaces/admin-deposits-page';

vi.mock('@/hooks/admin/useAdminWalletDesk', () => ({
  useAdminWalletDesk: () => ({
    deposits: [
      {
        id: 'dep-krw-1',
        userId: 'u_***c91',
        amount: '100000',
        method: 'krw',
        status: 'pending',
        createdAt: '2026-07-04T09:00:00.000Z',
        reference: '이체 홍길동',
      },
      {
        id: 'dep-crypto-1',
        userId: 'u_***af2',
        amount: '200',
        method: 'crypto',
        status: 'confirming',
        createdAt: '2026-07-04T08:30:00.000Z',
        reference: 'TRC20 tx 0x***f1e',
      },
      {
        id: 'dep-gift-1',
        userId: 'u_***b15',
        amount: '50000',
        method: 'giftcard',
        status: 'pending_review',
        createdAt: '2026-07-04T08:00:00.000Z',
        reference: 'HAPPY PIN ***8810',
      },
    ],
    filteredDeposits: [
      {
        id: 'dep-krw-1',
        userId: 'u_***c91',
        amount: '100000',
        method: 'krw',
        status: 'pending',
        createdAt: '2026-07-04T09:00:00.000Z',
        reference: '이체 홍길동',
      },
      {
        id: 'dep-crypto-1',
        userId: 'u_***af2',
        amount: '200',
        method: 'crypto',
        status: 'confirming',
        createdAt: '2026-07-04T08:30:00.000Z',
        reference: 'TRC20 tx 0x***f1e',
      },
      {
        id: 'dep-gift-1',
        userId: 'u_***b15',
        amount: '50000',
        method: 'giftcard',
        status: 'pending_review',
        createdAt: '2026-07-04T08:00:00.000Z',
        reference: 'HAPPY PIN ***8810',
      },
    ],
    depositFilters: { search: '', status: [], method: [] },
    setDepositFilters: vi.fn(),
    matchDeposit: vi.fn(),
    flagDeposit: vi.fn(),
  }),
  formatAmountString: (amount: string, currency: string) => `${amount} ${currency}`,
}));

function renderDeposits() {
  return render(
    <I18nProvider>
      <AdminDepositsPage />
    </I18nProvider>,
  );
}

describe('AdminDepositsPage', () => {
  it('renders §29.2 deposit match and flag actions', () => {
    renderDeposits();

    expect(screen.getByRole('heading', { level: 2, name: '입금 확인' })).toBeInTheDocument();
    expect(screen.getByText(/처리할 입금 3건/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'KRW 입금 확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '크립토 입금 확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '상품권 승인' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '이상 거래 표시' }).length).toBeGreaterThan(0);
  });
});
