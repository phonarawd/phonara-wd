import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminRiskPage } from '@/product/surfaces/admin-risk-page';

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock('@/hooks/admin/useAdminCompliance', () => ({
  useAdminCompliance: () => ({
    kyc: [{ id: 'kyc-1', status: 'pending' }],
    str: [
      {
        id: 'str-1',
        userId: 'u_***abc',
        caseType: 'structuring',
        status: 'open',
        triggerRef: 'wd-1',
        createdAt: '2026-07-04T10:00:00.000Z',
        slaDueAt: '2026-07-05T10:00:00.000Z',
        detailsSummary: 'rapid withdrawals',
      },
    ],
    risk: [
      {
        id: 'risk-1',
        userId: 'u_***def',
        flagType: 'fraud_pattern',
        status: 'active',
        createdAt: '2026-07-04T09:00:00.000Z',
        detailsSummary: 'velocity spike',
      },
    ],
    filteredRisk: [
      {
        id: 'risk-1',
        userId: 'u_***def',
        flagType: 'fraud_pattern',
        status: 'active',
        createdAt: '2026-07-04T09:00:00.000Z',
        detailsSummary: 'velocity spike',
      },
    ],
    filteredStr: [
      {
        id: 'str-1',
        userId: 'u_***abc',
        caseType: 'structuring',
        status: 'open',
        triggerRef: 'wd-1',
        createdAt: '2026-07-04T10:00:00.000Z',
        slaDueAt: '2026-07-05T10:00:00.000Z',
        detailsSummary: 'rapid withdrawals',
      },
    ],
    riskFilters: { search: '', status: [], flagType: [] },
    setRiskFilters: vi.fn(),
    strFilters: { search: '', status: [], caseType: [] },
    setStrFilters: vi.fn(),
    audit: [],
    clearRiskFlag: vi.fn(),
    flagStr: vi.fn(),
    fileStr: vi.fn(),
    dismissStr: vi.fn(),
  }),
}));

describe('AdminRiskPage', () => {
  it('renders compliance overview and §29.2 risk/STR actions without gap controls', () => {
    render(
      <I18nProvider>
        <AdminRiskPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText(/처리 대상 1건|1 risk items/i)).toBeTruthy();
    expect(screen.getByText(/제재 심사 큐는|sanctions screening queue/i)).toBeTruthy();

    expect(screen.getByRole('tab', { name: /위험 표시 \(1\)|Risk flags \(1\)/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^해제$|^Clear$/i })).toBeTruthy();

    expect(screen.getByRole('tab', { name: /의심거래 \(1\)|STR cases \(1\)/i })).toBeTruthy();

    const strPanel = screen.getByText('rapid withdrawals', { hidden: true }).closest('tr');
    expect(strPanel).toBeTruthy();
    expect(
      within(strPanel!).getByRole('button', { name: /^검토 시작$|^Start review$/i }),
    ).toBeTruthy();
    expect(within(strPanel!).getByRole('button', { name: /^신고 완료$|^File$/i })).toBeTruthy();
    expect(within(strPanel!).getByRole('button', { name: /^기각$|^Dismiss$/i })).toBeTruthy();

    expect(
      screen.queryByRole('button', {
        name: /제재 해제|Clear sanctions|쿨다운 적용|Apply cooldown|한도 오버라이드|Limit override/i,
      }),
    ).toBeNull();
  });
});
