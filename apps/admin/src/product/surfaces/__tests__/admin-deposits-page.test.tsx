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
        proofStatus: 'pending',
        proofPath: '00000000-0000-4000-8000-000000000001/proof.jpg',
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
        proofStatus: 'pending',
        proofPath: '00000000-0000-4000-8000-000000000001/proof.jpg',
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
    reviewKrwDepositProof: vi.fn(),
    getKrwDepositProofUrl: vi.fn().mockResolvedValue('https://example.invalid/proof.jpg'),
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
  it('renders §29.2 deposit match, flag, and KRW proof review actions', () => {
    renderDeposits();

    expect(screen.getByRole('heading', { level: 2, name: '입금 확인' })).toBeInTheDocument();
    expect(screen.getByText(/처리할 입금 3건/)).toBeInTheDocument();
    expect(screen.getByText(/증빙 확인 대기 1건/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '입금 증빙 사진 보기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '증빙 맞음 표시' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'KRW 입금 확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '크립토 입금 확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '상품권 승인' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '이상 거래 표시' }).length).toBeGreaterThan(0);
  });
});
