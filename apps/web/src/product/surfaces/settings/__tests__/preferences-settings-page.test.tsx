import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettingsPreferencesControllerView } from '@/features/settings/use-settings-preferences-controller';
import { I18nProvider } from '@/product/i18n';
import { PreferencesSettingsPage } from '@/product/surfaces/settings/preferences-settings-page';

const useSettingsPreferencesControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/settings/use-settings-preferences-controller', () => ({
  useSettingsPreferencesController: useSettingsPreferencesControllerMock,
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
  overrides: Partial<SettingsPreferencesControllerView> = {},
): SettingsPreferencesControllerView {
  return {
    t: (key: string) => key,
    displayLocale: 'ko',
    theme: 'dark',
    fiatHintEnabled: true,
    setDisplayLocale: vi.fn(),
    setTheme: vi.fn(),
    setFiatHintEnabled: vi.fn(),
    ...overrides,
  };
}

describe('PreferencesSettingsPage', () => {
  beforeEach(() => {
    useSettingsPreferencesControllerMock.mockReset();
  });

  it('renders locale and theme controls with back link', () => {
    useSettingsPreferencesControllerMock.mockReturnValue(makeEngine());

    render(
      <I18nProvider>
        <PreferencesSettingsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('settings-preferences-page')).toBeInTheDocument();
    expect(screen.getByTestId('settings-preferences-back')).toHaveAttribute('href', '/settings');
    expect(screen.getByTestId('settings-preferences-locale-card')).toBeInTheDocument();
    expect(screen.getByTestId('settings-preferences-theme-card')).toBeInTheDocument();
    expect(screen.getByTestId('settings-preferences-locale-select')).toBeInTheDocument();
    expect(screen.getByTestId('settings-preferences-theme-select')).toBeInTheDocument();
    expect(screen.getByTestId('settings-preferences-fiat-hint-card')).toBeInTheDocument();
    expect(screen.getByTestId('settings-preferences-fiat-hint-switch')).toBeInTheDocument();
  });
});
