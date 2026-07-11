import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { CookiesPage } from '@/product/surfaces/legal/cookies-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function renderCookiesPage() {
  return render(
    <I18nProvider>
      <CookiesPage />
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

describe('CookiesPage', () => {
  it('renders title, effective date, and cookie sections', () => {
    renderCookiesPage();

    expect(screen.getByTestId('legal-cookies-page')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: '쿠키·픽셀 고지' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/시행일: 2026-06-11/)).toBeInTheDocument();
    expect(screen.getByTestId('legal-body-cookies')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '개요' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '광고·전환 측정 픽셀' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '문의' })).toBeInTheDocument();
  });

  it('marks cookies nav active and links sibling legal routes', () => {
    renderCookiesPage();

    expect(screen.getByTestId('legal-nav-cookies')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('legal-nav-privacy')).toHaveAttribute('href', '/legal/privacy');
    expect(screen.getByTestId('legal-nav-affiliate')).toHaveAttribute('href', '/legal/affiliate');
  });

  it('shows back-to-login and privacy CTA', () => {
    renderCookiesPage();

    expect(screen.getByTestId('legal-back-login')).toHaveAttribute('href', '/login');
    expect(screen.getByTestId('cookies-privacy-cta')).toHaveAttribute('href', '/legal/privacy');
    expect(screen.getByTestId('cookies-privacy-cta')).toHaveTextContent('개인정보 처리방침 보기');
  });
});
