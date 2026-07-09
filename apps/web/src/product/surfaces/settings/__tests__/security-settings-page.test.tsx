import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettingsSecurityControllerView } from '@/features/auth/use-settings-security-controller';
import { I18nProvider } from '@/product/i18n';
import { SecuritySettingsPage } from '@/product/surfaces/settings/security-settings-page';

const useSettingsSecurityControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/auth/use-settings-security-controller', () => ({
  useSettingsSecurityController: useSettingsSecurityControllerMock,
}));

function makeEngine(
  overrides: Partial<SettingsSecurityControllerView> = {},
): SettingsSecurityControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    errorKey: null,
    security: {
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      hasVerifiedTotp: false,
      verifiedTotpFactorId: null,
      passkeyCount: 0,
    },
    passkeys: [],
    totpEnroll: null,
    totpCode: '',
    setTotpCode: vi.fn(),
    totpEnrolling: false,
    totpVerifyError: false,
    passkeyBusy: false,
    totpRemoveBusy: false,
    refresh: vi.fn(),
    handleRegisterPasskey: vi.fn(),
    handleDeletePasskey: vi.fn(),
    handleStartTotpEnroll: vi.fn(),
    handleVerifyTotpEnroll: vi.fn(),
    handleCancelTotpEnroll: vi.fn(),
    handleRemoveTotp: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: SettingsSecurityControllerView) {
  useSettingsSecurityControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <SecuritySettingsPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useSettingsSecurityControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('SecuritySettingsPage', () => {
  it('renders page header and back link to account', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('settings-security-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '보안 · 인증' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '계정으로' })).toHaveAttribute('href', '/account');
  });

  it('shows passkey empty state and add action', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('settings-security-passkey-empty')).toBeInTheDocument();
    expect(screen.getByTestId('settings-security-passkey-add')).toBeInTheDocument();
  });

  it('lists passkeys with remove actions', () => {
    const handleDeletePasskey = vi.fn();
    renderPage(
      makeEngine({
        passkeys: [{ id: 'pk-1', friendly_name: 'MacBook' }],
        handleDeletePasskey,
      }),
    );

    const list = screen.getByTestId('settings-security-passkey-list');
    expect(within(list).getByText('MacBook')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('settings-security-passkey-remove-pk-1'));
    expect(handleDeletePasskey).toHaveBeenCalledWith('pk-1');
  });

  it('shows TOTP start when not enrolled', () => {
    const handleStartTotpEnroll = vi.fn();
    renderPage(makeEngine({ handleStartTotpEnroll }));

    fireEvent.click(screen.getByTestId('settings-security-totp-start'));
    expect(handleStartTotpEnroll).toHaveBeenCalled();
  });

  it('shows TOTP active state when enrolled', () => {
    renderPage(
      makeEngine({
        security: {
          currentLevel: 'aal2',
          nextLevel: 'aal2',
          hasVerifiedTotp: true,
          verifiedTotpFactorId: 'factor-1',
          passkeyCount: 0,
        },
      }),
    );

    expect(screen.getByTestId('settings-security-totp-active')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-security-totp-start')).not.toBeInTheDocument();
  });

  it('renders TOTP enrollment form with QR and verify', async () => {
    const handleVerifyTotpEnroll = vi.fn();
    const setTotpCode = vi.fn();
    renderPage(
      makeEngine({
        totpEnroll: {
          factorId: 'factor-new',
          qrCode: 'data:image/svg+xml;base64,abc',
          secret: 'SECRET',
        },
        totpCode: '123456',
        setTotpCode,
        handleVerifyTotpEnroll,
      }),
    );

    expect(screen.getByTestId('settings-security-totp-qr')).toBeInTheDocument();
    expect(screen.getByTestId('settings-security-totp-secret')).toHaveValue('SECRET');
    fireEvent.submit(screen.getByTestId('settings-security-totp-enroll-form'));
    await waitFor(() => {
      expect(handleVerifyTotpEnroll).toHaveBeenCalled();
    });
  });

  it('shows error state with retry', () => {
    const refresh = vi.fn();
    renderPage(makeEngine({ errorKey: 'common.error.generic', refresh }));

    expect(screen.getByTestId('settings-security-error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(refresh).toHaveBeenCalled();
  });

  it('shows loading shell', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('settings-security-loading')).toBeInTheDocument();
  });
});
