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
  }),
}));

describe('AdminUserTierPage', () => {
  it('renders read-only earn tier snapshot for a member', () => {
    render(
      <I18nProvider>
        <AdminUserTierPage userId="user-1" />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2, name: '회원 등급' })).toBeTruthy();
    expect(screen.getByText('골드')).toBeTruthy();
    expect(screen.getByText('1200')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /승급|Upgrade|수동/i })).toBeNull();
  });
});
