import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminTeamPage } from '@/product/surfaces/admin-team-page';

const setRoleGrant = vi.fn(async () => undefined);

const mockRbac = vi.hoisted(() => ({
  role: 'owner' as string,
  canManage: true,
}));

vi.mock('@/hooks/admin/useAdminOperatorRbac', () => ({
  useAdminOperatorRbac: () => ({
    role: mockRbac.role,
    serverRole: mockRbac.role,
    can: (action: string) => mockRbac.canManage && action === 'access.rbac.manage',
    setPreviewRole: vi.fn(),
    previewEnabled: false,
    grantsStatus: 'success',
    roleLabelKey: 'admin.access.role.owner.label',
  }),
}));

vi.mock('@/hooks/admin/useAdminTeamDesk', () => ({
  useAdminTeamDesk: () => ({
    grants: [
      {
        id: 'u1:finance',
        userId: '11111111-1111-4111-8111-111111111111',
        email: 'finance@example.com',
        role: 'finance',
        enabled: true,
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'u2:owner',
        userId: '22222222-2222-4222-8222-222222222222',
        email: 'owner@example.com',
        role: 'owner',
        enabled: true,
        updatedAt: '2026-07-02T00:00:00.000Z',
      },
    ],
    filteredGrants: [
      {
        id: 'u1:finance',
        userId: '11111111-1111-4111-8111-111111111111',
        email: 'finance@example.com',
        role: 'finance',
        enabled: true,
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'u2:owner',
        userId: '22222222-2222-4222-8222-222222222222',
        email: 'owner@example.com',
        role: 'owner',
        enabled: true,
        updatedAt: '2026-07-02T00:00:00.000Z',
      },
    ],
    filters: { search: '', role: 'all', enabled: 'all' },
    setFilters: vi.fn(),
    grantableRoles: ['owner', 'finance', 'risk', 'support', 'viewer'],
    loading: false,
    isError: false,
    busy: false,
    auditEvents: [],
    refresh: vi.fn(async () => undefined),
    setRoleGrant,
    canRevoke: (row: { role: string; enabled: boolean }) => row.enabled && row.role !== 'owner',
    canChangeRole: (row: { role: string }) => row.role !== 'owner',
  }),
}));

describe('AdminTeamPage', () => {
  beforeEach(() => {
    mockRbac.role = 'owner';
    mockRbac.canManage = true;
    setRoleGrant.mockClear();
  });

  it('renders staff table with grant/revoke actions (§29.2 R3 · owner)', () => {
    render(
      <I18nProvider>
        <AdminTeamPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('admin-team-page')).toBeInTheDocument();
    expect(screen.getByText(/직원 2명|2 staff members/i)).toBeInTheDocument();
    expect(screen.getByText('finance@example.com')).toBeInTheDocument();
    expect(
      screen.getByTestId('admin-team-revoke-11111111-1111-4111-8111-111111111111'),
    ).toHaveTextContent(/권한 빼기|Remove access/i);
    expect(
      screen.queryByTestId('admin-team-revoke-22222222-2222-4222-8222-222222222222'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rpc_|desk|queue/i })).not.toBeInTheDocument();
  });

  it('opens R3 dialog with summary before revoke', () => {
    render(
      <I18nProvider>
        <AdminTeamPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('admin-team-revoke-11111111-1111-4111-8111-111111111111'));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/되돌릴 수 없|cannot be undone/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/finance@example.com/)).toBeInTheDocument();
  });

  it('shows forbidden empty state for finance role', () => {
    mockRbac.role = 'finance';
    mockRbac.canManage = false;

    render(
      <I18nProvider>
        <AdminTeamPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('admin-team-page-forbidden')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-team-grant-form')).not.toBeInTheDocument();
  });
});
