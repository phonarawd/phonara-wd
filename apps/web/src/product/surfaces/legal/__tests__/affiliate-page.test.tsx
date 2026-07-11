import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AffiliatePage } from '@/product/surfaces/legal/affiliate-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function renderAffiliatePage() {
  return render(
    <I18nProvider>
      <AffiliatePage />
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

describe('AffiliatePage', () => {
  it('renders title, effective date, and affiliate sections', () => {
    renderAffiliatePage();

    expect(screen.getByTestId('legal-affiliate-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '추천·제휴 약관' })).toBeInTheDocument();
    expect(screen.getByText(/시행일: 2026-06-11/)).toBeInTheDocument();
    expect(screen.getByTestId('legal-body-affiliate')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '프로그램 개요' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '자격 충족(Qualified) 조건' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '문의' })).toBeInTheDocument();
  });

  it('marks affiliate nav active and links sibling legal routes', () => {
    renderAffiliatePage();

    expect(screen.getByTestId('legal-nav-affiliate')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('legal-nav-terms')).toHaveAttribute('href', '/legal/terms');
    expect(screen.getByTestId('legal-nav-cookies')).toHaveAttribute('href', '/legal/cookies');
  });

  it('shows back-to-login and referral hub CTA', () => {
    renderAffiliatePage();

    expect(screen.getByTestId('legal-back-login')).toHaveAttribute('href', '/login');
    expect(screen.getByTestId('affiliate-referral-cta')).toHaveAttribute('href', '/referral');
    expect(screen.getByTestId('affiliate-referral-cta')).toHaveTextContent('추천 허브로 이동');
  });
});
