import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminStakingPage } from '@/product/surfaces/admin-staking-page';

const setPoolActive = vi.fn(async () => undefined);

vi.mock('@/hooks/admin/useAdminStakingDesk', () => ({
  useAdminStakingDesk: () => ({
    pools: [
      {
        id: 'pool-flexible',
        term: 'flexible',
        referenceAsset: 'PHON',
        stakeCurrency: 'PHON',
        estimatedApr: '8.50',
        lockDays: 0,
        isActive: true,
      },
      {
        id: 'pool-30d',
        term: 'days_30',
        referenceAsset: 'PHON',
        stakeCurrency: 'PHON',
        estimatedApr: '12.00',
        lockDays: 30,
        isActive: false,
      },
    ],
    loading: false,
    isError: false,
    busy: false,
    auditEvents: [],
    refresh: vi.fn(async () => undefined),
    setPoolActive,
  }),
}));

describe('AdminStakingPage', () => {
  it('renders pool list with activate/deactivate actions and no tier-cap controls (§29.2)', () => {
    render(
      <I18nProvider>
        <AdminStakingPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText(/스테이킹 풀 2개|2 staking pools/i)).toBeTruthy();
    expect(
      screen.getByText(/등급별 한도 설정은 지원하지 않습니다|Tier-cap settings are not supported/i),
    ).toBeTruthy();
    expect(screen.getByText(/30일 잠금|30-day lock/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /비활성화|Deactivate/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^활성화$|^Activate$/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /한도|tier.?cap/i })).toBeNull();
  });

  it('opens R3 dialog with irreversible notice before pool toggle', () => {
    render(
      <I18nProvider>
        <AdminStakingPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^활성화$|^Activate$/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText(/되돌릴 수 없|cannot be undone/i)).toBeTruthy();
    expect(within(dialog).getByText(/12\.00% APR/)).toBeTruthy();
  });
});
