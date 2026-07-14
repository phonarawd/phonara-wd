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

  it('Phase 0B: form owns the dominant grid column, not the brand/trust aside (UX_REFERENCE_CANON.md §Login/Auth)', () => {
    render(
      <I18nProvider>
        <AuthEntryLayout testId="auth-layout" title="Login" subtitle="Sign in to continue">
          <p>form</p>
        </AuthEntryLayout>
      </I18nProvider>,
    );

    const layout = screen.getByTestId('auth-layout');
    // The narrow fixed track (minmax(280px,360px)) must come first so the
    // dominant 1fr track — the form <section>, which is the second grid
    // child in DOM order — is not squeezed into the narrow column.
    expect(layout.className).toContain('lg:grid-cols-[minmax(280px,360px),1fr]');
    expect(layout.className).not.toContain('lg:grid-cols-[1fr,minmax(280px,360px)]');
  });
});
