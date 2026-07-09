import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettingsHubControllerView } from '@/features/settings/use-settings-hub-controller';
import { I18nProvider } from '@/product/i18n';
import { SettingsHubPage } from '@/product/surfaces/settings/settings-hub-page';

const useSettingsHubControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/settings/use-settings-hub-controller', () => ({
  useSettingsHubController: useSettingsHubControllerMock,
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

function makeEngine(overrides: Partial<SettingsHubControllerView> = {}): SettingsHubControllerView {
  return {
    t: (key: string) => key,
    navByGroup: {
      account: [
        {
          id: 'security',
          route: '/settings/security',
          labelKey: 'account.menu.security',
          group: 'account',
        },
      ],
      alerts: [
        {
          id: 'notifications-prefs',
          route: '/settings/notifications',
          labelKey: 'settings.hub.link.notificationsDetail',
          group: 'alerts',
        },
        {
          id: 'notifications-inbox',
          route: '/notifications',
          labelKey: 'settings.hub.link.inbox',
          group: 'alerts',
        },
      ],
      display: [
        {
          id: 'preferences',
          route: '/settings/preferences',
          labelKey: 'settings.hub.link.preferences',
          group: 'display',
        },
      ],
    },
    notificationPrefs: {
      deposit: true,
      mission: true,
      priceAlert: true,
      referral: true,
      marketing: false,
    },
    casinoConfirm: false,
    tradeOneClick: false,
    tradeConfirm: true,
    setNotificationPref: vi.fn(),
    setCasinoConfirm: vi.fn(),
    setTradeOneClick: vi.fn(),
    setTradeConfirm: vi.fn(),
    ...overrides,
  };
}

describe('SettingsHubPage', () => {
  beforeEach(() => {
    useSettingsHubControllerMock.mockReset();
  });

  it('renders hub header, notification toggles, and nav links', () => {
    useSettingsHubControllerMock.mockReturnValue(makeEngine());

    render(
      <I18nProvider>
        <SettingsHubPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('settings-hub-page')).toBeInTheDocument();
    expect(screen.getByTestId('settings-hub-back')).toHaveAttribute('href', '/account');
    expect(screen.getByTestId('settings-hub-toggle-deposit')).toBeInTheDocument();
    expect(screen.getByTestId('settings-hub-link-security')).toHaveAttribute(
      'href',
      '/settings/security',
    );
    expect(screen.getByTestId('settings-hub-link-notifications-prefs')).toHaveAttribute(
      'href',
      '/settings/notifications',
    );
    expect(screen.getByTestId('settings-hub-link-notifications-inbox')).toHaveAttribute(
      'href',
      '/notifications',
    );
  });

  it('calls setNotificationPref when a toggle changes', () => {
    const setNotificationPref = vi.fn();
    useSettingsHubControllerMock.mockReturnValue(makeEngine({ setNotificationPref }));

    render(
      <I18nProvider>
        <SettingsHubPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'settings.notifications.marketing.label' }));
    expect(setNotificationPref).toHaveBeenCalledWith('marketing', true);
  });

  it('calls setCasinoConfirm from casino card', () => {
    const setCasinoConfirm = vi.fn();
    useSettingsHubControllerMock.mockReturnValue(makeEngine({ setCasinoConfirm }));

    render(
      <I18nProvider>
        <SettingsHubPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'settings.casino.confirmDialog.label' }));
    expect(setCasinoConfirm).toHaveBeenCalledWith(true);
  });

  it('calls setTradeOneClick and setTradeConfirm from trade card', () => {
    const setTradeOneClick = vi.fn();
    const setTradeConfirm = vi.fn();
    useSettingsHubControllerMock.mockReturnValue(makeEngine({ setTradeOneClick, setTradeConfirm }));

    render(
      <I18nProvider>
        <SettingsHubPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'settings.trade.oneClick.label' }));
    expect(setTradeOneClick).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('switch', { name: 'settings.trade.confirmDialog.label' }));
    expect(setTradeConfirm).toHaveBeenCalledWith(false);
  });
});
