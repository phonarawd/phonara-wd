import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminAuditPage } from '@/product/surfaces/admin-audit-page';

vi.mock('@/hooks/admin/useAdminAuditDesk', () => ({
  useAdminAuditDesk: () => ({
    auditFeed: [
      {
        id: 'af-1',
        at: '2026-07-04T10:00:00.000Z',
        actorKey: 'admin.primitive.audit.actor.system',
        domain: 'wallet',
        actionKey: 'admin.wallet.audit.withdrawApprove',
        subject: 'wd_7821',
        reason: 'kyc match',
      },
      {
        id: 'af-2',
        at: '2026-07-04T09:00:00.000Z',
        actorKey: 'admin.primitive.audit.actor.system',
        domain: 'users',
        actionKey: 'admin.users.audit.suspend',
        subject: 'u_3010',
        reason: 'rg cooldown',
      },
    ],
    filteredAuditFeed: [
      {
        id: 'af-1',
        at: '2026-07-04T10:00:00.000Z',
        actorKey: 'admin.primitive.audit.actor.system',
        domain: 'wallet',
        actionKey: 'admin.wallet.audit.withdrawApprove',
        subject: 'wd_7821',
        reason: 'kyc match',
      },
      {
        id: 'af-2',
        at: '2026-07-04T09:00:00.000Z',
        actorKey: 'admin.primitive.audit.actor.system',
        domain: 'users',
        actionKey: 'admin.users.audit.suspend',
        subject: 'u_3010',
        reason: 'rg cooldown',
      },
    ],
    auditFilters: { search: '', domains: [], datePreset: 'all' },
    setAuditFilters: vi.fn(),
    refreshAuditFeed: vi.fn(),
    auditDomains: ['wallet', 'compliance', 'users', 'sports', 'system'],
    isLoading: false,
    isError: false,
    isFetching: false,
  }),
}));

describe('AdminAuditPage', () => {
  it('renders read-only audit feed with filters and no action buttons (§29.2 R0)', () => {
    render(
      <I18nProvider>
        <AdminAuditPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText(/감사 기록 2건|2 audit entries/i)).toBeTruthy();
    expect(screen.getByText(/통합 감사 피드|Merged audit feed/i)).toBeTruthy();

    const walletRow = screen.getByText('wd_7821').closest('tr');
    expect(walletRow).toBeTruthy();
    expect(within(walletRow!).queryByRole('button', { name: /승인|approve/i })).toBeNull();

    fireEvent.click(walletRow!);
    expect(screen.getByRole('heading', { name: /감사 항목|Audit entry/i })).toBeTruthy();

    expect(screen.getByRole('button', { name: /최근 24시간|Last 24h/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /지갑|Wallet/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /새로고침|Refresh/i })).toBeTruthy();
  });
});
