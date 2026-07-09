import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { AdminSettingsPage } from '@/product/surfaces/admin-settings-page';

vi.mock('@/hooks/admin/useAdminSettingsDesk', () => ({
  useAdminSettingsDesk: () => ({
    sections: [
      {
        id: 'features',
        titleKey: 'admin.settings.flags.title',
        descKey: 'admin.settings.flags.desc',
        rows: [
          {
            key: 'feature_spot_enabled',
            value: 'true',
            displayValue: 'on',
            labelKey: 'admin.operations.kill.label.feature_spot',
            kind: 'boolean',
          },
          {
            key: 'feature_game_enabled',
            value: 'false',
            displayValue: 'off',
            labelKey: 'admin.operations.kill.label.feature_game',
            kind: 'boolean',
          },
        ],
      },
      {
        id: 'limits',
        titleKey: 'admin.settings.limits.title',
        descKey: 'admin.settings.limits.desc',
        rows: [
          {
            key: 'withdrawal_daily_cap_krw',
            value: '5000000',
            displayValue: '5000000',
            labelKey: 'admin.settings.key.fallback',
            kind: 'numeric',
          },
        ],
      },
    ],
    entryCount: 3,
    search: '',
    setSearch: vi.fn(),
    isLoading: false,
    isError: false,
    isFetching: false,
    refresh: vi.fn(),
  }),
}));

describe('AdminSettingsPage', () => {
  it('renders read-only app_config desk with tabs and no write controls (§29.2 R0)', () => {
    render(
      <I18nProvider>
        <AdminSettingsPage />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByText(/설정 항목 3개|3 config entries/i)).toBeTruthy();
    expect(screen.getAllByText(/읽기 전용|read-only/i).length).toBeGreaterThan(0);

    expect(screen.getByRole('tab', { name: /기능 플래그|Feature flags/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /지갑·배팅 한도|Wallet & bet limits/i })).toBeTruthy();

    expect(screen.getByText(/현물 거래|Spot trading/i)).toBeTruthy();
    const spotRow = screen.getByText(/현물 거래|Spot trading/i).closest('tr');
    expect(spotRow).toBeTruthy();
    expect(within(spotRow!).getByText(/켜짐|On/i)).toBeTruthy();

    expect(screen.queryByRole('button', { name: /저장|save/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /끄기|disable/i })).toBeNull();
  });
});
