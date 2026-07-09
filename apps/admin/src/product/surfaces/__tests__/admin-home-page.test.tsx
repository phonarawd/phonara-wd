import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminHomePage } from '@/product/surfaces/admin-home-page';

vi.mock('@/hooks/admin/useAdminOverview', () => ({
  useAdminOverview: () => ({
    dashboard: {
      overallStatus: 'warning',
      fetchedAt: '2026-07-04T10:00:00.000Z',
      exceptionQueues: [{ queueType: 'withdrawal', openCount: 2, overdueCount: 0 }],
      opsAlerts: { open: 1, critical: 0 },
      healthChecks: [
        {
          id: 'pending_exceptions',
          status: 'warning',
          summary: '2 pending',
          observedAt: '2026-07-04T09:55:00.000Z',
          lastRunAt: null,
          lastSuccessfulAt: null,
          lastErrorAt: null,
          runbookKey: 'ops.pending',
        },
      ],
    },
    health: undefined,
    isLoading: false,
    isFetching: false,
    unresolvedAlerts: 1,
    refreshAll: vi.fn(),
    error: null,
    fallbackConfig: undefined,
  }),
}));

vi.mock('@/hooks/admin/useAdminAuditAlerts', () => ({
  useAdminAuditAlerts: () => ({
    alerts: [
      {
        id: 'alert-1',
        dedupeKey: 'check-1',
        sourceCheckId: 'pending_exceptions',
        severity: 'warning',
        status: 'open',
        summary: 'Pending exceptions detected',
        runbookKey: 'ops.pending',
        firstSeenAt: '2026-07-04T09:00:00.000Z',
        lastSeenAt: '2026-07-04T09:55:00.000Z',
        occurrenceCount: 1,
      },
    ],
    confirmAckAlert: vi.fn(),
  }),
}));

function renderHome() {
  return render(
    <I18nProvider>
      <AdminHomePage />
    </I18nProvider>,
  );
}

describe('AdminHomePage', () => {
  it('renders today summary and §29.2 alert action buttons', () => {
    renderHome();

    expect(screen.getByRole('heading', { name: '오늘 할 일' })).toBeInTheDocument();
    expect(screen.getByText(/지금 확인할 항목이 3건/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '요약 새로고침' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '알림 확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '알림 해결' })).toBeInTheDocument();
    expect(screen.getByText('출금 보내기')).toBeInTheDocument();
  });
});
