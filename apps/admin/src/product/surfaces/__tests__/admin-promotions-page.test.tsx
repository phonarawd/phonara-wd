import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/product/i18n';
import { AdminPromotionsPage } from '@/product/surfaces/admin-promotions-page';

vi.mock('@/hooks/admin/useAdminCmsDesk', () => ({
  useAdminCmsDesk: () => ({
    filteredPromos: [
      {
        id: 'promo-1',
        promoKey: 'home.banner',
        surface: 'home',
        status: 'draft',
        endsAt: '2026-07-12',
      },
    ],
    activatePromo: vi.fn(async () => true),
    endPromoEarly: vi.fn(async () => true),
    audit: [
      {
        id: 'audit-1',
        at: '2026-07-12T10:00:00.000Z',
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.cms.promos.audit.activate',
        subject: 'home.banner',
        reason: 'activate weekend promo',
      },
    ],
    refresh: vi.fn(async () => undefined),
  }),
}));

describe('AdminPromotionsPage', () => {
  it('renders promotion queue, activation control, and audit trail', () => {
    render(
      <I18nProvider>
        <AdminPromotionsPage />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByRole('button', { name: /활성|Activate/i })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: /감사|Audit/i })).toBeTruthy();
    expect(screen.getByText('activate weekend promo')).toBeTruthy();
  });
});
