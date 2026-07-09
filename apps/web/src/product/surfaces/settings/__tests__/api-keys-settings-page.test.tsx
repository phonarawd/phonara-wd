import { render, screen } from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettingsApiKeysControllerView } from '@/features/settings/use-settings-api-keys-controller';

import { I18nProvider } from '@/product/i18n';

import { ApiKeysSettingsPage } from '@/product/surfaces/settings/api-keys-settings-page';

const useSettingsApiKeysControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/settings/use-settings-api-keys-controller', () => ({
  useSettingsApiKeysController: useSettingsApiKeysControllerMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();

  return {
    ...actual,

    Link: ({
      children,

      to,

      ...props
    }: {
      children: React.ReactNode;

      to: string;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function makeEngine(
  overrides: Partial<SettingsApiKeysControllerView> = {},
): SettingsApiKeysControllerView {
  return {
    t: (key: string) => key,

    route: '/settings/api-keys',

    pageExposure: 'live',

    hubExposure: 'built_hidden',

    canManageKeys: false,

    ...overrides,
  };
}

describe('ApiKeysSettingsPage', () => {
  beforeEach(() => {
    useSettingsApiKeysControllerMock.mockReset();
  });

  it('renders gap stub with back link and disabled create action', () => {
    useSettingsApiKeysControllerMock.mockReturnValue(makeEngine());

    render(
      <I18nProvider>
        <ApiKeysSettingsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('settings-api-keys-page')).toBeInTheDocument();

    expect(screen.getByTestId('settings-api-keys-back')).toHaveAttribute('href', '/settings');

    expect(screen.getByTestId('settings-api-keys-gap-card')).toBeInTheDocument();

    expect(screen.getByTestId('settings-api-keys-empty')).toBeInTheDocument();

    expect(screen.getByTestId('settings-api-keys-create')).toBeDisabled();

    expect(screen.getByText('settings.apiKeys.create.disabledHint')).toBeInTheDocument();
  });

  it('keeps create disabled when engine reports no manage capability', () => {
    useSettingsApiKeysControllerMock.mockReturnValue(makeEngine({ canManageKeys: false }));

    render(
      <I18nProvider>
        <ApiKeysSettingsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('settings-api-keys-create')).toBeDisabled();
  });
});
