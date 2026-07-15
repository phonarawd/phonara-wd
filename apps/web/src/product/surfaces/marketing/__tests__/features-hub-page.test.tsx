import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { FeaturesHubPage } from '@/product/surfaces/marketing/features-hub-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('FeaturesHubPage', () => {
  it('renders hub cards for earn vip tier fees security trade', () => {
    render(
      <I18nProvider>
        <FeaturesHubPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('features-hub-page')).toBeInTheDocument();
    expect(screen.getByTestId('features-hub-card-earn')).toHaveAttribute('href', '/features/earn');
    expect(screen.getByTestId('features-hub-card-vip')).toHaveAttribute('href', '/features/vip');
    expect(screen.getByTestId('features-hub-card-security')).toHaveAttribute('href', '/security');
  });
});
