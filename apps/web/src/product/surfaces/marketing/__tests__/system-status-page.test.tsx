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
  it('renders E10 live status components', () => {
    render(
      <I18nProvider>
        <SystemStatusPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('system-status-page')).toBeInTheDocument();
    expect(screen.getByTestId('system-status-live')).toBeInTheDocument();
    expect(screen.getByTestId('system-status-component-earn')).toBeInTheDocument();
    expect(screen.getByTestId('system-status-announcements-cta')).toHaveAttribute(
      'href',
      '/announcements',
    );
  });
});
