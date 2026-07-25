import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/product/i18n';
import { AdminCmsPage } from '@/product/surfaces/admin-cms-page';

vi.mock('@/hooks/admin/useAdminCmsDesk', () => ({
  useAdminCmsDesk: () => ({
    filteredPages: [
      {
        id: 'page-1',
        pageKey: 'home.hero',
        locale: 'ko',
        status: 'draft',
        updatedAt: '2026-07-12',
      },
    ],
    publishPage: vi.fn(async () => true),
    archivePage: vi.fn(async () => true),
    restorePageDraft: vi.fn(async () => true),
    audit: [
      {
        id: 'audit-1',
        at: '2026-07-12T10:00:00.000Z',
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.cms.pages.audit.publish',
        subject: 'home.hero',
        reason: 'publish draft page',
      },
    ],
    refresh: vi.fn(async () => undefined),
  }),
}));

describe('AdminCmsPage', () => {
  it('renders the page queue, publish control, and audit trail', () => {
    render(
      <I18nProvider>
        <AdminCmsPage />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByRole('button', { name: /발행|Publish/i })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: /감사|Audit/i })).toBeTruthy();
    expect(screen.getByText('publish draft page')).toBeTruthy();
  });
});
