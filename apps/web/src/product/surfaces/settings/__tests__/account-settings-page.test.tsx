import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettingsAccountControllerView } from '@/features/settings/use-settings-account-controller';
import { I18nProvider } from '@/product/i18n';
import { AccountSettingsPage } from '@/product/surfaces/settings/account-settings-page';

const useSettingsAccountControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/settings/use-settings-account-controller', () => ({
  useSettingsAccountController: useSettingsAccountControllerMock,
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
  overrides: Partial<SettingsAccountControllerView> = {},
): SettingsAccountControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    accountLocale: 'ko',
    timezone: 'Asia/Seoul',
    timezoneOptions: ['Asia/Seoul', 'UTC'],
    timezonePreview: '2026년 7월 5일 오후 9:00',
    setAccountLocale: vi.fn(),
    setTimezone: vi.fn(),
    localeBusy: false,
    ...overrides,
  };
}

describe('AccountSettingsPage', () => {
  beforeEach(() => {
    useSettingsAccountControllerMock.mockReset();
  });

  it('renders locale and timezone controls with back link', () => {
    useSettingsAccountControllerMock.mockReturnValue(makeEngine());

    render(
      <I18nProvider>
        <AccountSettingsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('settings-account-page')).toBeInTheDocument();
    expect(screen.getByTestId('settings-account-back')).toHaveAttribute('href', '/settings');
    expect(screen.getByTestId('settings-account-locale-card')).toBeInTheDocument();
    expect(screen.getByTestId('settings-account-timezone-card')).toBeInTheDocument();
    expect(screen.getByTestId('settings-account-timezone-preview')).toHaveTextContent(
      '2026년 7월 5일 오후 9:00',
    );
  });

  it('shows loading shell while engine is loading', () => {
    useSettingsAccountControllerMock.mockReturnValue(makeEngine({ loading: true }));

    render(
      <I18nProvider>
        <AccountSettingsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('settings-account-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-account-page')).not.toBeInTheDocument();
  });
});
