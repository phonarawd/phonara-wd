import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { TermsPage } from '@/product/surfaces/legal/terms-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function renderTermsPage() {
  return render(
    <I18nProvider>
      <TermsPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('TermsPage', () => {
  it('renders title, effective date, and all terms sections', () => {
    renderTermsPage();

    expect(screen.getByTestId('legal-terms-page')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'PHONARA 서비스 이용약관' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/시행일: 2026-06-11/)).toBeInTheDocument();
    expect(screen.getByTestId('legal-body-terms')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '목적' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '문의' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '서비스의 제공' })).toBeInTheDocument();
  });

  it('marks terms nav active and links sibling legal routes', () => {
    renderTermsPage();

    expect(screen.getByTestId('legal-nav-terms')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('legal-nav-privacy')).toHaveAttribute('href', '/legal/privacy');
    expect(screen.getByTestId('legal-nav-rg')).toHaveAttribute('href', '/legal/responsible-gaming');
  });

  it('shows back-to-login and signup continue actions', () => {
    renderTermsPage();

    expect(screen.getByTestId('legal-back-login')).toHaveAttribute('href', '/login');
    expect(screen.getByTestId('terms-agree-continue')).toHaveAttribute('href', '/signup');
    expect(screen.getByTestId('terms-agree-continue')).toHaveTextContent('동의하고 계속');
  });
});
