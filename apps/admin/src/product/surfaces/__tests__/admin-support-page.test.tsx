import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminSupportPage } from '@/product/surfaces/admin-support-page';

const resolveTicket = vi.fn(async () => undefined);
const goTo = vi.fn();

const mockRbac = vi.hoisted(() => ({
  role: 'owner' as string,
}));

vi.mock('@/hooks/admin/useAdminOperatorRbac', () => ({
  useAdminOperatorRbac: () => ({
    role: mockRbac.role,
    serverRole: mockRbac.role,
    can: () => true,
    setPreviewRole: vi.fn(),
    previewEnabled: false,
    grantsStatus: 'success',
    roleLabelKey: 'admin.access.role.owner.label',
  }),
}));

vi.mock('@/lib/use-admin-route-navigate', () => ({
  useAdminRouteNavigate: () => goTo,
}));

vi.mock('@/hooks/admin/useAdminSupportDesk', () => ({
  useAdminSupportDesk: () => ({
    tickets: [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId: '11111111-1111-4111-8111-111111111111',
        category: 'wallet',
        subject: 'Deposit not showing',
        status: 'open',
        priority: 'high',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
        resolvedAt: null,
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        userId: '22222222-2222-4222-8222-222222222222',
        category: 'account',
        subject: 'Login help',
        status: 'resolved',
        priority: 'normal',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-02T00:00:00.000Z',
        resolvedAt: '2026-06-02T00:00:00.000Z',
      },
    ],
    filteredTickets: [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId: '11111111-1111-4111-8111-111111111111',
        category: 'wallet',
        subject: 'Deposit not showing',
        status: 'open',
        priority: 'high',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
        resolvedAt: null,
      },
    ],
    openQueueTickets: [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId: '11111111-1111-4111-8111-111111111111',
        category: 'wallet',
        subject: 'Deposit not showing',
        status: 'open',
        priority: 'high',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
        resolvedAt: null,
      },
    ],
    openCount: 1,
    highPriorityOpenCount: 1,
    filters: { search: '', status: 'open_queue', priority: 'all' },
    setFilters: vi.fn(),
    loading: false,
    isError: false,
    busy: false,
    auditEvents: [],
    refresh: vi.fn(async () => undefined),
    loadTicketDetail: vi.fn(async () => null),
    resolveTicket,
    canResolve: (row: { status: string }) => row.status === 'open' || row.status === 'in_progress',
  }),
}));

describe('AdminSupportPage', () => {
  beforeEach(() => {
    mockRbac.role = 'owner';
    resolveTicket.mockClear();
    goTo.mockClear();
  });

  it('renders open tickets with resolve action (§29.2 · beginner copy)', () => {
    render(
      <I18nProvider>
        <AdminSupportPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('admin-support-page')).toBeInTheDocument();
    expect(screen.getByText(/Deposit not showing/i)).toBeInTheDocument();
    expect(screen.getByTestId('admin-support-urgent')).toBeInTheDocument();
    expect(
      screen.getByTestId('admin-support-resolve-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
    ).toHaveTextContent(/답변 완료|Mark answered/i);
    expect(screen.queryByRole('button', { name: /rpc_|desk|queue/i })).not.toBeInTheDocument();
  });

  it('opens resolve dialog with summary before confirm', () => {
    render(
      <I18nProvider>
        <AdminSupportPage />
      </I18nProvider>,
    );

    fireEvent.click(
      screen.getByTestId('admin-support-resolve-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Deposit not showing/)).toBeInTheDocument();
  });

  it('links to queues for pending-work convergence', () => {
    render(
      <I18nProvider>
        <AdminSupportPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('admin-support-to-queues'));
    expect(goTo).toHaveBeenCalledWith('/queues');
  });

  it('forbids viewer role', () => {
    mockRbac.role = 'viewer';
    render(
      <I18nProvider>
        <AdminSupportPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('admin-support-page-forbidden')).toBeInTheDocument();
  });
});
