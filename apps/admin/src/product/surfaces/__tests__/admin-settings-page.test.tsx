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

vi.mock('@/hooks/admin/useAdminOpsPush', () => ({
  useAdminOpsPush: () => ({
    status: 'off',
    supported: true,
    busy: false,
    enable: vi.fn(),
    disable: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/use-admin-route-navigate', () => ({
  useAdminRouteNavigate: () => vi.fn(),
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
    expect(screen.getByTestId('admin-settings-team-link')).toHaveTextContent(
      /직원 권한 관리로 가기|Go to staff access/i,
    );
  });

  it('renders ops Web Push CTA that deep-links to 처리 대기함 (§32.6 A-4)', () => {
    render(
      <I18nProvider>
        <AdminSettingsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('admin-settings-ops-push')).toBeTruthy();
    expect(screen.getByTestId('admin-settings-ops-push-enable')).toHaveTextContent(
      /알림 받기 켜기|Turn on alerts/i,
    );
    expect(screen.getByTestId('admin-settings-ops-push-status')).toHaveTextContent(
      /알림 꺼짐|Alerts off/i,
    );
    expect(screen.getByTestId('admin-settings-ops-push-queues')).toBeTruthy();
    expect(
      screen.getByText(/알림을 누르면 처리 대기함|Tapping an alert opens the work queue/i),
    ).toBeTruthy();
  });
});
