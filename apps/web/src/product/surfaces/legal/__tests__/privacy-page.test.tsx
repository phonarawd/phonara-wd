import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { PrivacyPage } from '@/product/surfaces/legal/privacy-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function renderPrivacyPage() {
  return render(
    <I18nProvider>
      <PrivacyPage />
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

describe('PrivacyPage', () => {
  it('renders title, effective date, and all privacy sections', () => {
    renderPrivacyPage();

    expect(screen.getByTestId('legal-privacy-page')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: '개인정보 처리방침' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/시행일: 2026-06-11/)).toBeInTheDocument();
    expect(screen.getByTestId('legal-body-privacy')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '개요' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '수집하는 개인정보 항목' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '마케팅·전환 측정 도구' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '문의 및 권리 행사' })).toBeInTheDocument();
  });

  it('marks privacy nav active and links sibling legal routes', () => {
    renderPrivacyPage();

    expect(screen.getByTestId('legal-nav-privacy')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('legal-nav-terms')).toHaveAttribute('href', '/legal/terms');
    expect(screen.getByTestId('legal-nav-rg')).toHaveAttribute('href', '/legal/responsible-gaming');
  });

  it('shows back-to-login and signup continue actions', () => {
    renderPrivacyPage();

    expect(screen.getByTestId('legal-back-login')).toHaveAttribute('href', '/login');
    expect(screen.getByTestId('privacy-agree-continue')).toHaveAttribute('href', '/signup');
    expect(screen.getByTestId('privacy-agree-continue')).toHaveTextContent('동의하고 계속');
  });
});
