import { render, screen, waitFor } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { SystemStatusPage } from '@/product/surfaces/marketing/system-status-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/marketing/use-system-status', () => ({
  fetchPublicPlatformStatus: vi.fn(async () => ({
    checkedAt: '2026-07-13T00:00:00.000Z',
    overall: 'unknown',
    source: 'fail-closed',
    lanes: [
      { id: 'earn', status: 'unknown', reasonCategory: 'unknown', checkedAt: '2026-07-13T00:00:00.000Z' },
      { id: 'wallet', status: 'unknown', reasonCategory: 'unknown', checkedAt: '2026-07-13T00:00:00.000Z' },
      { id: 'trade', status: 'unknown', reasonCategory: 'unknown', checkedAt: '2026-07-13T00:00:00.000Z' },
      { id: 'sports', status: 'unknown', reasonCategory: 'unknown', checkedAt: '2026-07-13T00:00:00.000Z' },
      { id: 'casino', status: 'unknown', reasonCategory: 'unknown', checkedAt: '2026-07-13T00:00:00.000Z' },
    ],
  })),
}));

describe('SystemStatusPage', () => {
  it('renders fail-closed unknown when public health feed is unavailable (C-02)', async () => {
    render(
      <I18nProvider>
        <SystemStatusPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('system-status-page')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('system-status-live')).toHaveAttribute(
        'data-status-mode',
        'fail-closed',
      );
    });
    expect(screen.getByTestId('system-status-component-earn')).toBeInTheDocument();
    expect(screen.getByTestId('system-status-announcements-cta')).toHaveAttribute(
      'href',
      '/announcements',
    );
    expect(screen.getAllByText('확인 중').length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText('상태 확인 중')).toBeInTheDocument();
    expect(screen.queryByText('정상')).not.toBeInTheDocument();
  });
});
