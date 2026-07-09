import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { ResponsibleGamingPage } from '@/product/surfaces/legal/responsible-gaming-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function renderResponsibleGamingPage() {
  return render(
    <I18nProvider>
      <ResponsibleGamingPage />
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

describe('ResponsibleGamingPage', () => {
  it('renders title, effective date, and all RG sections', () => {
    renderResponsibleGamingPage();

    expect(screen.getByTestId('legal-rg-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '책임게임 정책' })).toBeInTheDocument();
    expect(screen.getByText(/시행일: 2026-06-11/)).toBeInTheDocument();
    expect(screen.getByTestId('legal-body-rg')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '책임 있는 이용' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '도움 요청' })).toBeInTheDocument();
  });

  it('marks RG nav active and links sibling legal routes', () => {
    renderResponsibleGamingPage();

    expect(screen.getByTestId('legal-nav-rg')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('legal-nav-terms')).toHaveAttribute('href', '/legal/terms');
    expect(screen.getByTestId('legal-nav-privacy')).toHaveAttribute('href', '/legal/privacy');
  });

  it('shows back-to-login and signup continue actions', () => {
    renderResponsibleGamingPage();

    expect(screen.getByTestId('legal-back-login')).toHaveAttribute('href', '/login');
    expect(screen.getByTestId('rg-agree-continue')).toHaveAttribute('href', '/signup');
    expect(screen.getByTestId('rg-agree-continue')).toHaveTextContent('동의하고 계속');
  });
});
