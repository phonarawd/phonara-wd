import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { FeesPage } from '@/product/surfaces/marketing/fees-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('FeesPage', () => {
  it('renders fee categories and cashback matrix', () => {
    render(
      <I18nProvider>
        <FeesPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('fees-page')).toBeInTheDocument();
    expect(screen.getByTestId('fees-category-spot')).toBeInTheDocument();
    expect(screen.getByTestId('fees-cashback-gold')).toBeInTheDocument();
    expect(screen.getByTestId('fees-tier-cta')).toHaveAttribute('href', '/tier');
  });
});
