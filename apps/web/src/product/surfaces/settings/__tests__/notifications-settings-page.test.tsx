import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettingsNotificationsControllerView } from '@/features/settings/use-settings-notifications-controller';
import { I18nProvider } from '@/product/i18n';
import { NotificationsSettingsPage } from '@/product/surfaces/settings/notifications-settings-page';

const useSettingsNotificationsControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/settings/use-settings-notifications-controller', () => ({
  useSettingsNotificationsController: useSettingsNotificationsControllerMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function makeEngine(
  overrides: Partial<SettingsNotificationsControllerView> = {},
): SettingsNotificationsControllerView {
  return {
    t: (key: string) => key,
    prefsByGroup: {
      money: ['deposit', 'priceAlert'],
      growth: ['mission', 'referral', 'tierUpgrade'],
      marketing: ['marketing'],
    },
    notificationPrefs: {
      deposit: true,
      priceAlert: true,
      mission: true,
      referral: true,
      tierUpgrade: true,
      tierDecayWarning: true,
      marketing: false,
    },
    isPartialEnginePref: (key) => key === 'mission' || key === 'referral' || key === 'tierUpgrade',
    setNotificationPref: vi.fn(),
    ...overrides,
  };
}

describe('NotificationsSettingsPage', () => {
  beforeEach(() => {
    useSettingsNotificationsControllerMock.mockReset();
  });

  it('renders grouped notification toggles and back link', () => {
    useSettingsNotificationsControllerMock.mockReturnValue(makeEngine());

    render(
      <I18nProvider>
        <NotificationsSettingsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('settings-notifications-page')).toBeInTheDocument();
    expect(screen.getByTestId('settings-notifications-back')).toHaveAttribute('href', '/settings');
    expect(screen.getByTestId('settings-notifications-group-money')).toBeInTheDocument();
    expect(screen.getByTestId('settings-notifications-group-growth')).toBeInTheDocument();
    expect(screen.getByTestId('settings-notifications-toggle-tierUpgrade')).toBeInTheDocument();
    expect(
      screen.queryByTestId('settings-notifications-toggle-tierDecayWarning'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('settings-notifications-partial-mission')).toBeInTheDocument();
  });

  it('calls setNotificationPref when a toggle changes', () => {
    const setNotificationPref = vi.fn();
    useSettingsNotificationsControllerMock.mockReturnValue(makeEngine({ setNotificationPref }));

    render(
      <I18nProvider>
        <NotificationsSettingsPage />
      </I18nProvider>,
    );

    fireEvent.click(
      screen.getByRole('switch', { name: 'settings.notifications.tierUpgrade.label' }),
    );
    expect(setNotificationPref).toHaveBeenCalledWith('tierUpgrade', false);
  });
});
