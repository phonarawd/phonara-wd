import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/product/i18n';
import { AdminCmsPage } from '@/product/surfaces/admin-cms-page';

vi.mock('@/hooks/admin/useAdminCmsDesk', () => ({
  useAdminCmsDesk: () => ({
    filteredPages: [{ id: 'page-1', pageKey: 'home.hero', locale: 'ko', status: 'draft', updatedAt: '2026-07-12' }],
    publishPage: vi.fn(() => true),
    archivePage: vi.fn(() => true),
    restorePageDraft: vi.fn(() => true),
  }),
}));

describe('AdminCmsPage', () => {
  it('renders the page queue and publish control', () => {
    render(<I18nProvider><AdminCmsPage /></I18nProvider>);
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByRole('button', { name: /발행|Publish/i })).toBeTruthy();
  });
});
