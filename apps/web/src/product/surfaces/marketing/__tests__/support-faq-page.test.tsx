import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { SupportFaqPage } from '@/product/surfaces/marketing/support-faq-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('SupportFaqPage', () => {
  it('renders six FAQ items and support CTAs', () => {
    render(
      <I18nProvider>
        <SupportFaqPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('support-faq-page')).toBeInTheDocument();
    expect(screen.getByTestId('support-faq-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('support-faq-item-6')).toBeInTheDocument();
    expect(screen.getByTestId('support-faq-hub-cta')).toHaveAttribute('href', '/support');
    expect(screen.getByTestId('support-faq-feedback-cta')).toHaveAttribute('href', '/feedback');
  });
});
