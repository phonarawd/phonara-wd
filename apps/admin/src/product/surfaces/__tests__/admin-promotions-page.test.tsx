import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/product/i18n';
import { AdminPromotionsPage } from '@/product/surfaces/admin-promotions-page';

vi.mock('@/hooks/admin/useAdminCmsDesk', () => ({
  useAdminCmsDesk: () => ({
    filteredPromos: [{ id: 'promo-1', promoKey: 'home.banner', surface: 'home', status: 'draft', endsAt: '2026-07-12' }],
    activatePromo: vi.fn(() => true),
    endPromoEarly: vi.fn(() => true),
  }),
}));

describe('AdminPromotionsPage', () => {
  it('renders promotion queue and activation control', () => {
    render(<I18nProvider><AdminPromotionsPage /></I18nProvider>);
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByRole('button', { name: /활성|Activate/i })).toBeTruthy();
  });
});
