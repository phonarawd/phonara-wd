import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AnnouncementsPage } from '@/product/surfaces/marketing/announcements-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/use-cms-content', () => ({
  useCmsNotices: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}));

describe('AnnouncementsPage', () => {
  it('renders empty state when CMS has no notices', () => {
    render(
      <I18nProvider>
        <AnnouncementsPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('announcements-page')).toBeInTheDocument();
    expect(screen.getByTestId('announcements-empty')).toBeInTheDocument();
    expect(screen.getByTestId('announcements-support-cta')).toHaveAttribute('href', '/support');
  });
});
