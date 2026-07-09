import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminTiersPage } from '@/product/surfaces/admin-tiers-page';

vi.mock('@/hooks/admin/useAdminTiersDesk', () => ({
  useAdminTiersDesk: () => ({
    distribution: [
      { tier: 'bronze', labelKey: 'admin.tiers.tier.bronze', count: 2 },
      { tier: 'silver', labelKey: 'admin.tiers.tier.silver', count: 1 },
      { tier: 'gold', labelKey: 'admin.tiers.tier.gold', count: 1 },
      { tier: 'platinum', labelKey: 'admin.tiers.tier.platinum', count: 1 },
      { tier: 'diamond', labelKey: 'admin.tiers.tier.diamond', count: 1 },
    ],
    goldenEarthLimits: [
      {
        tier: 'bronze',
        labelKey: 'admin.tiers.tier.bronze',
        dailyTapCap: '1000',
        phonPerTap: '3.000000',
      },
    ],
    earnMissionLimits: [
      {
        tier: 'bronze',
        labelKey: 'admin.tiers.tier.bronze',
        attendance: '1',
        roulette: '1',
        referralPayout: '3',
        viralShare: '3',
        dailyQuiz: '1',
        referralMultiplier: '1.0',
      },
    ],
    decayPolicy: [
      {
        tier: 'bronze',
        labelKey: 'admin.tiers.tier.bronze',
        keepConditionKey: 'admin.tiers.decay.keep.bronze',
        downgradeTargetKey: null,
      },
    ],
    decayPhase: 'deferred',
    totalMembers: 6,
    isLoading: false,
    isError: false,
    refresh: vi.fn(async () => undefined),
  }),
}));

describe('AdminTiersPage', () => {
  it('renders tier distribution and decay monitor without write actions', () => {
    render(
      <I18nProvider>
        <AdminTiersPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /하락 모니터/i })).toBeTruthy();
    expect(screen.getByText(/수동 승급·편집은 지원하지 않습니다/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /승급|Upgrade|수동/i })).toBeNull();
  });
});
