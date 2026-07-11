import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { SystemStatusStubPage } from '@/product/surfaces/marketing/system-status-stub-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('SystemStatusStubPage', () => {
  it('renders E10 defer stub markers', () => {
    render(
      <I18nProvider>
        <SystemStatusStubPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('system-status-stub-page')).toBeInTheDocument();
    expect(screen.getByTestId('system-status-stub')).toHaveAttribute(
      'data-engine-todo',
      'ew-e10-trust-support-ui',
    );
    expect(screen.getByTestId('system-status-stub')).toHaveAttribute('data-deferred', 'true');
    expect(screen.getByTestId('system-status-empty')).toBeInTheDocument();
  });
});
