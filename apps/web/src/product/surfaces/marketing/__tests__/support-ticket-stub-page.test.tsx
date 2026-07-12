import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { SupportTicketStubPage } from '@/product/surfaces/marketing/support-ticket-stub-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('SupportTicketStubPage', () => {
  it('renders E9 live stub markers', () => {
    render(
      <I18nProvider>
        <SupportTicketStubPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('support-ticket-stub-page')).toBeInTheDocument();
    expect(screen.getByTestId('support-ticket-stub')).toHaveAttribute(
      'data-engine-todo',
      'ew-e9-identity-wave',
    );
    expect(screen.getByTestId('support-ticket-stub')).toHaveAttribute('data-deferred', 'false');
    expect(screen.getByTestId('support-ticket-empty')).toBeInTheDocument();
  });
});
