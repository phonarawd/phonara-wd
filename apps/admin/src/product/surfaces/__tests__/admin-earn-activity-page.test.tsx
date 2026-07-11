import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/product/i18n';
import { AdminEarnActivityPage } from '@/product/surfaces/admin-earn-activity-page';

vi.mock('@/hooks/admin/useAdminEarnActivityDesk', () => ({
  useAdminEarnActivityDesk: () => ({
    queueRows: [{ queueType: 'earn', openCount: 2, overdueCount: 1 }],
    alerts: { open: 2, critical: 1 },
    referralSnapshot: { total: 12, uniqueReferrers: 5, recent7d: 2 },
    missionClaimTotals: [{ mission: 'share_referral_link', claimCount: 4, phonAwardedTotal: '3' }],
    loading: false,
    error: false,
    refresh: vi.fn(async () => undefined),
  }),
}));

describe('AdminEarnActivityPage', () => {
  it('renders activity metrics and refresh control', () => {
    render(<I18nProvider><AdminEarnActivityPage /></I18nProvider>);
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByRole('button', { name: /새로고침|Refresh/i })).toBeTruthy();
  });
});
