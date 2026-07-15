import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminUserTierPage } from '@/product/surfaces/admin-user-tier-page';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      className?: string;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/hooks/admin/useAdminOperatorRbac', () => ({
  useAdminOperatorRbac: () => ({
    role: 'owner',
    can: (action: string) => action === 'users.tier.write',
    setPreviewRole: vi.fn(),
    roleLabelKey: 'admin.access.role.owner.label',
  }),
}));

vi.mock('@/hooks/admin/useAdminUserTierDesk', () => ({
  useAdminUserTierDesk: () => ({
    snapshot: {
      userId: 'user-1',
      displayName: '테스트',
      emailMasked: 't***@example.com',
      tier: 'gold',
      tierLabelKey: 'admin.tiers.tier.gold',
      xp: 1200,
      updatedAt: '2026-07-04T09:00:00.000Z',
    },
    isLoading: false,
    isError: false,
    refresh: vi.fn(async () => undefined),
    isSaving: false,
    writeUiUnlocked: true,
    writePathReady: true,
    setUserTier: vi.fn(async () => undefined),
  }),
}));

describe('AdminUserTierPage', () => {
  it('renders tier snapshot and owner write controls when unlocked (M-12)', () => {
    render(
      <I18nProvider>
        <AdminUserTierPage userId="user-1" />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2, name: '회원 등급' })).toBeTruthy();
    expect(screen.getAllByText('골드').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1200')).toBeTruthy();
    expect(screen.getByTestId('admin-user-tier-write')).toBeTruthy();
    expect(screen.getByRole('button', { name: '등급 적용' })).toBeTruthy();
  });
});
