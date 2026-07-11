import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminQueuesPage } from '@/product/surfaces/admin-queues-page';

vi.mock('@/hooks/admin/useAdminOperatorRbac', () => ({
  useAdminOperatorRbac: () => ({
    role: 'owner',
    can: () => true,
    setPreviewRole: vi.fn(),
    roleLabelKey: 'admin.access.role.owner.label',
  }),
}));

vi.mock('@/hooks/admin/useAdminExceptionQueueSummary', () => ({
  useAdminExceptionQueueSummary: () => ({
    autoOk: '12',
    manualRequired: '3',
    retryFailed: '1',
    onHold: '2',
    totalExceptions: '6',
    supportOpen: '0',
  }),
}));

vi.mock('@/hooks/admin/useAdminReviewQueue', () => ({
  useAdminReviewQueue: () => ({
    items: [
      {
        id: 'rq-1',
        itemType: 'deposit_exception',
        entityType: 'deposit',
        entityId: 'dep-1',
        userId: 'u_***abc',
        status: 'pending',
        reason: '입금 확인 필요',
        slaDueAt: '2026-07-04T12:00:00.000Z',
        createdAt: '2026-07-04T10:00:00.000Z',
      },
    ],
    isLoading: false,
    resolveItem: vi.fn(),
  }),
}));

vi.mock('@/hooks/admin/useAdminWalletDesk', () => ({
  useAdminWalletDesk: () => ({
    withdrawals: [
      {
        id: 'wd-1',
        userId: 'u_***c91',
        amount: '120000',
        currency: 'KRW',
        method: 'krw',
        status: 'pending',
        createdAt: '2026-07-04T09:00:00.000Z',
        slaDueAt: '2026-07-04T10:00:00.000Z',
        destinationSummary: '신한 110-***-4421',
      },
    ],
    approveWithdraw: vi.fn(),
    rejectWithdraw: vi.fn(),
    markSent: vi.fn(),
    withdrawFilters: { search: '', status: [], method: [] },
    setWithdrawFilters: vi.fn(),
  }),
  isOverdueSla: () => true,
}));

vi.mock('@/hooks/admin/useAdminCompliance', () => ({
  useAdminCompliance: () => ({
    kyc: [],
    str: [],
    risk: [],
    approveKyc: vi.fn(),
    rejectKyc: vi.fn(),
    reviewStr: vi.fn(),
    fileStr: vi.fn(),
    dismissStr: vi.fn(),
    clearRiskFlag: vi.fn(),
    kycFilters: { search: '', status: [], tier: [] },
    setKycFilters: vi.fn(),
    strFilters: { search: '', status: [], caseType: [] },
    setStrFilters: vi.fn(),
    riskFilters: { search: '', status: [], flagType: [] },
    setRiskFilters: vi.fn(),
  }),
  isKycOverdue: () => false,
}));

function renderQueues() {
  return render(
    <I18nProvider>
      <AdminQueuesPage />
    </I18nProvider>,
  );
}

describe('AdminQueuesPage', () => {
  it('renders summary metrics and §29.2 withdrawal actions', () => {
    renderQueues();

    expect(screen.getByRole('heading', { name: '처리 대기함' })).toBeInTheDocument();
    expect(screen.getByText(/처리할 항목 6건/)).toBeInTheDocument();
    expect(screen.getByText('수동 승인 필요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '승인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '거절' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /출금 \(1\)/ })).toBeInTheDocument();
  });
});
