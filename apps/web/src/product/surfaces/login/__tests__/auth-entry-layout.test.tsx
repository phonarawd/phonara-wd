import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { I18nProvider } from '@/product/i18n';

import { AuthEntryLayout } from '@/product/surfaces/login/auth-entry-layout';

describe('AuthEntryLayout', () => {
  it('renders §25.9 flat brand mark at 24px in the auth header', () => {
    render(
      <I18nProvider>
        <AuthEntryLayout title="Login" subtitle="Sign in to continue">
          <p>form</p>
        </AuthEntryLayout>
      </I18nProvider>,
    );

    const mark = screen.getByTestId('auth-brand-mark');
    expect(mark).toBeInTheDocument();
    expect(mark).toHaveStyle({ width: '24px', height: '24px' });
    expect(mark).toHaveAttribute('data-brand-asset', '/brand/logo-mono.svg');
  });
});
