import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminNav } from '@/product/layout/admin-nav';

vi.mock('@/hooks/admin/useAdminOperatorRbac', () => ({
  useAdminOperatorRbac: () => ({
    role: 'owner',
    can: () => true,
    setPreviewRole: vi.fn(),
    roleLabelKey: 'admin.access.role.owner.label',
  }),
}));

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
    useRouterState: (opts?: { select?: (s: { location: { pathname: string } }) => unknown }) =>
      opts?.select?.({ location: { pathname: '/' } }) ?? { location: { pathname: '/' } },
  };
});

describe('AdminNav', () => {
  it('renders §6.1 primary destinations with operator-facing labels', () => {
    render(
      <I18nProvider>
        <AdminNav />
      </I18nProvider>,
    );

    expect(screen.getByRole('navigation', { name: '관리자 탐색' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '오늘 할 일' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '처리 대기함' })).toHaveAttribute('href', '/queues');
    expect(screen.getByRole('link', { name: '입금 확인' })).toHaveAttribute('href', '/deposits');
    expect(screen.getByRole('link', { name: '스포츠 정산' })).toHaveAttribute('href', '/sports');
    expect(screen.getByRole('link', { name: '부업·추천' })).toHaveAttribute('href', '/earn');
    expect(screen.getByRole('link', { name: '시스템 상태' })).toHaveAttribute('href', '/ops');
  });
});
