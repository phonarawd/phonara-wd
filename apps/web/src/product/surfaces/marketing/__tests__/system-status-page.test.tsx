import { render, screen } from '@testing-library/react';
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

describe('SystemStatusPage', () => {
  it('renders fail-closed unknown status — never operational without live health (C-02)', () => {
    render(
      <I18nProvider>
        <SystemStatusPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('system-status-page')).toBeInTheDocument();
    expect(screen.getByTestId('system-status-live')).toHaveAttribute(
      'data-status-mode',
      'fail-closed',
    );
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
