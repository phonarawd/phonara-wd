import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { SupportHubPage } from '@/product/surfaces/marketing/support-hub-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('SupportHubPage', () => {
  it('renders mailto and FAQ/feedback/ticket links', () => {
    render(
      <I18nProvider>
        <SupportHubPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('support-hub-page')).toBeInTheDocument();
    expect(screen.getByTestId('support-hub-mailto')).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:support@phonara.net'),
    );
    expect(screen.getByTestId('support-hub-faq-link')).toHaveAttribute('href', '/support/faq');
    expect(screen.getByTestId('support-hub-feedback-link')).toHaveAttribute('href', '/feedback');
    expect(screen.getByTestId('support-hub-ticket-link')).toHaveAttribute('href', '/support/ticket');
    expect(screen.getByTestId('support-hub-ticket-link')).toHaveAttribute('data-deferred', 'true');
  });
});
