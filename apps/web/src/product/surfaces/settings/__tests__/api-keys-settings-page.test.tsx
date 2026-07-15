import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { SettingsApiKeysControllerView } from '@/features/settings/use-settings-api-keys-controller';
import { I18nProvider } from '@/product/i18n';
import { ApiKeysSettingsPage } from '@/product/surfaces/settings/api-keys-settings-page';

const useSettingsApiKeysControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/settings/use-settings-api-keys-controller', () => ({
  useSettingsApiKeysController: useSettingsApiKeysControllerMock,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
    'data-testid'?: string;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

function makeEngine(
  overrides: Partial<SettingsApiKeysControllerView> = {},
): SettingsApiKeysControllerView {
  return {
    t: (key: string) => key,
    route: '/settings/api-keys',
    pageExposure: 'live',
    hubExposure: 'live',
    canManageKeys: true,
    keys: [],
    keysLoading: false,
    refreshKeys: vi.fn(),
    keyName: '',
    setKeyName: vi.fn(),
    scopes: ['read'],
    toggleScope: vi.fn(),
    createOpen: false,
    openCreate: vi.fn(),
    closeCreate: vi.fn(),
    creating: false,
    createErrorKey: null,
    createdSecret: null,
    createKey: vi.fn(),
    acknowledgeSecret: vi.fn(),
    revokeTarget: null,
    openRevoke: vi.fn(),
    closeRevoke: vi.fn(),
    revoking: false,
    revokeErrorKey: null,
    revokeKey: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: SettingsApiKeysControllerView = makeEngine()) {
  useSettingsApiKeysControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <ApiKeysSettingsPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useSettingsApiKeysControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('ApiKeysSettingsPage', () => {
  it('renders live create control when manage is unlocked', () => {
    renderPage();
    expect(screen.getByTestId('settings-api-keys-page')).toBeInTheDocument();
    expect(screen.getByTestId('settings-api-keys-back')).toHaveAttribute('href', '/settings');
    expect(screen.getByTestId('settings-api-keys-empty')).toBeInTheDocument();
    expect(screen.getByTestId('settings-api-keys-create')).not.toBeDisabled();
  });

  it('shows secret once card after create', () => {
    renderPage(
      makeEngine({
        createdSecret: {
          ok: true,
          id: 'k1',
          name: 'bot',
          key_prefix: 'phon_live_abcd',
          api_key: 'phon_live_abcdSECRET',
          scopes: ['read'],
          secret_shown_once: true,
        },
      }),
    );
    expect(screen.getByTestId('settings-api-keys-secret-card')).toBeInTheDocument();
    expect(screen.getByTestId('settings-api-keys-secret-value')).toHaveTextContent(
      'phon_live_abcdSECRET',
    );
  });
});
