import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { RiskDisclosurePage } from '@/product/surfaces/legal/risk-disclosure-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function renderRiskDisclosurePage() {
  return render(
    <I18nProvider>
      <RiskDisclosurePage />
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

describe('RiskDisclosurePage', () => {
  it('renders title, effective date, and all risk sections', () => {
    renderRiskDisclosurePage();

    expect(screen.getByTestId('legal-risk-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '리스크 안내' })).toBeInTheDocument();
    expect(screen.getByText(/시행일: 2026-06-11/)).toBeInTheDocument();
    expect(screen.getByTestId('legal-body-risk')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '거래 리스크' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '게임 리스크' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '기술 리스크' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '책임도박 정책' })).toBeInTheDocument();
  });

  it('marks risk nav active and links sibling legal routes', () => {
    renderRiskDisclosurePage();

    expect(screen.getByTestId('legal-nav-risk')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('legal-nav-terms')).toHaveAttribute('href', '/legal/terms');
    expect(screen.getByTestId('legal-nav-privacy')).toHaveAttribute('href', '/legal/privacy');
    expect(screen.getByTestId('legal-nav-rg')).toHaveAttribute('href', '/legal/responsible-gaming');
  });

  it('shows back-to-login, RG policy link, and signup continue actions', () => {
    renderRiskDisclosurePage();

    expect(screen.getByTestId('legal-back-login')).toHaveAttribute('href', '/login');
    expect(screen.getByTestId('risk-rg-policy-link')).toHaveAttribute(
      'href',
      '/legal/responsible-gaming',
    );
    expect(screen.getByTestId('risk-agree-continue')).toHaveAttribute('href', '/signup');
    expect(screen.getByTestId('risk-agree-continue')).toHaveTextContent('동의하고 계속');
  });
});
