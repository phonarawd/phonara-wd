import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/product/i18n';
import { AdminTierBenefitsPage } from '@/product/surfaces/admin-tier-benefits-page';

vi.mock('@/hooks/admin/useAdminTierBenefitsDesk', () => ({
  useAdminTierBenefitsDesk: () => ({
    goldenEarthLimits: [{ tier: 'bronze', labelKey: 'admin.tiers.tier.bronze', dailyTapCap: '10', phonPerTap: '1' }],
    earnMissionLimits: [{ tier: 'bronze', labelKey: 'admin.tiers.tier.bronze', attendance: '1', roulette: '1', referralPayout: '3' }],
    isLoading: false,
    isError: false,
    refresh: vi.fn(async () => undefined),
  }),
}));

describe('AdminTierBenefitsPage', () => {
  it('renders read-only tier limit matrices', () => {
    render(<I18nProvider><AdminTierBenefitsPage /></I18nProvider>);
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByRole('button', { name: /새로고침|Refresh/i })).toBeTruthy();
  });
});
