import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { FeaturesEarnPage } from '@/product/surfaces/marketing/features-earn-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('FeaturesEarnPage', () => {
  it('renders earn intro points and CTAs', () => {
    render(
      <I18nProvider>
        <FeaturesEarnPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('features-earn-page')).toBeInTheDocument();
    expect(screen.getByTestId('features-earn-points')).toBeInTheDocument();
    expect(screen.getByTestId('features-earn-home-cta')).toHaveAttribute('href', '/home');
  });
});
