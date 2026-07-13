import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { FeedbackPage } from '@/product/surfaces/marketing/feedback-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('FeedbackPage', () => {
  it('renders general mailto feedback', () => {
    render(
      <I18nProvider>
        <FeedbackPage type="general" />
      </I18nProvider>,
    );
    expect(screen.getByTestId('feedback-page')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-general-card')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-mailto')).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:support@phonara.net'),
    );
    expect(screen.getByTestId('feedback-faq-cta')).toHaveAttribute('href', '/support/faq');
  });

  it('renders bug mode card', () => {
    render(
      <I18nProvider>
        <FeedbackPage type="bug" />
      </I18nProvider>,
    );
    expect(screen.getByTestId('feedback-bug-card')).toBeInTheDocument();
  });
});
