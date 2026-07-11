import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { TrustSecurityPage } from '@/product/surfaces/marketing/trust-security-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('TrustSecurityPage', () => {
  it('renders trust blocks with fairness link and deferred status', () => {
    render(
      <I18nProvider>
        <TrustSecurityPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('trust-security-page')).toBeInTheDocument();
    expect(screen.getByTestId('trust-hub-block-money')).toBeInTheDocument();
    expect(screen.getByTestId('trust-hub-link-fairness')).toHaveAttribute(
      'href',
      '/casino/fairness',
    );
    expect(screen.getByTestId('trust-hub-deferred-status')).toBeInTheDocument();
    expect(screen.queryByTestId('trust-hub-link-status')).not.toBeInTheDocument();
  });
});
