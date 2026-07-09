import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminMfaPolicyPage } from '@/product/surfaces/admin-mfa-policy-page';

const setMfaRequired = vi.fn(async () => undefined);

vi.mock('@/hooks/admin/useAdminMfaPolicyDesk', () => ({
  useAdminMfaPolicyDesk: () => ({
    policies: [
      {
        id: 'tier.gold',
        tierKey: 'tier.gold',
        mfaRequired: true,
        graceDays: '14',
        enrollRate: '61',
        updatedAt: '2026-06-04T00:00:00.000Z',
      },
      {
        id: 'tier.silver',
        tierKey: 'tier.silver',
        mfaRequired: false,
        graceDays: '30',
        enrollRate: '32',
        updatedAt: '2026-06-05T00:00:00.000Z',
      },
      {
        id: 'tier.admin',
        tierKey: 'tier.admin',
        mfaRequired: true,
        graceDays: '0',
        enrollRate: '100',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ],
    filteredPolicies: [
      {
        id: 'tier.gold',
        tierKey: 'tier.gold',
        mfaRequired: true,
        graceDays: '14',
        enrollRate: '61',
        updatedAt: '2026-06-04T00:00:00.000Z',
      },
      {
        id: 'tier.silver',
        tierKey: 'tier.silver',
        mfaRequired: false,
        graceDays: '30',
        enrollRate: '32',
        updatedAt: '2026-06-05T00:00:00.000Z',
      },
      {
        id: 'tier.admin',
        tierKey: 'tier.admin',
        mfaRequired: true,
        graceDays: '0',
        enrollRate: '100',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ],
    filters: { search: '', tierKey: 'all', required: 'all' },
    setFilters: vi.fn(),
    tierKeys: [
      'tier.admin',
      'tier.staff',
      'tier.platinum',
      'tier.gold',
      'tier.silver',
      'tier.bronze',
    ],
    loading: false,
    isError: false,
    busy: false,
    auditEvents: [],
    refresh: vi.fn(async () => undefined),
    setMfaRequired,
    canRelaxTier: (tierKey: string) => tierKey !== 'tier.admin',
  }),
}));

describe('AdminMfaPolicyPage', () => {
  it('renders MFA policy matrix with require/relax actions (§29.2)', () => {
    render(
      <I18nProvider>
        <AdminMfaPolicyPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('admin-mfa-policy-page')).toBeInTheDocument();
    expect(screen.getByText(/티어 정책 3개|3 tier policies/i)).toBeInTheDocument();
    expect(screen.getByTestId('admin-mfa-policy-require-tier.silver')).toHaveTextContent('필수화');
    expect(screen.getByTestId('admin-mfa-policy-relax-tier.gold')).toHaveTextContent('완화');
    expect(screen.queryByTestId('admin-mfa-policy-relax-tier.admin')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rpc_|desk|queue/i })).not.toBeInTheDocument();
  });

  it('opens R3 dialog with summary and irreversible notice before policy change', () => {
    render(
      <I18nProvider>
        <AdminMfaPolicyPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('admin-mfa-policy-require-tier.silver'));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/되돌릴 수 없|cannot be undone/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/실버|Silver/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/32%/)).toBeInTheDocument();
  });
});
