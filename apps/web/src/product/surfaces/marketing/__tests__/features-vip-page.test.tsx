import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { FeaturesVipPage } from '@/product/surfaces/marketing/features-vip-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('FeaturesVipPage', () => {
  it('renders VIP points and tier CTA', () => {
    render(
      <I18nProvider>
        <FeaturesVipPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('features-vip-page')).toBeInTheDocument();
    expect(screen.getByTestId('features-vip-points')).toBeInTheDocument();
    expect(screen.getByTestId('features-vip-tier-cta')).toHaveAttribute('href', '/tier');
  });
});
