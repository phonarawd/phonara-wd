import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettingsSecurityController } from '@/features/auth/use-settings-security-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const loadUserSecurityStateMock = vi.hoisted(() => vi.fn());
const listPasskeysMock = vi.hoisted(() => vi.fn());
const registerPasskeyMock = vi.hoisted(() => vi.fn());
const deletePasskeyMock = vi.hoisted(() => vi.fn());
const enrollTotpFactorMock = vi.hoisted(() => vi.fn());
const challengeMfaFactorMock = vi.hoisted(() => vi.fn());
const verifyMfaFactorMock = vi.hoisted(() => vi.fn());
const unenrollTotpFactorMock = vi.hoisted(() => vi.fn());
const productToastShowMock = vi.hoisted(() => vi.fn());

const authState = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  loading: false,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => authState,
}));

vi.mock('@/domain/user-auth-security', () => ({
  loadUserSecurityState: loadUserSecurityStateMock,
  listPasskeys: listPasskeysMock,
  registerPasskey: registerPasskeyMock,
  deletePasskey: deletePasskeyMock,
  enrollTotpFactor: enrollTotpFactorMock,
  challengeMfaFactor: challengeMfaFactorMock,
  verifyMfaFactor: verifyMfaFactorMock,
  unenrollTotpFactor: unenrollTotpFactorMock,
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastShowMock },
}));

const baseSecurity = {
  currentLevel: 'aal1' as const,
  nextLevel: 'aal2' as const,
  hasVerifiedTotp: false,
  verifiedTotpFactorId: null,
  passkeyCount: 0,
};

const enrollPayload = {
  factorId: 'factor-1',
  qrCode: 'data:image/svg+xml;base64,abc',
  secret: 'SECRET123',
};

beforeEach(() => {
  navigateMock.mockReset();
  loadUserSecurityStateMock.mockReset();
  listPasskeysMock.mockReset();
  registerPasskeyMock.mockReset();
  deletePasskeyMock.mockReset();
  enrollTotpFactorMock.mockReset();
  challengeMfaFactorMock.mockReset();
  verifyMfaFactorMock.mockReset();
  unenrollTotpFactorMock.mockReset();
  productToastShowMock.mockReset();
  authState.session = null;
  authState.loading = false;
  loadUserSecurityStateMock.mockResolvedValue(baseSecurity);
  listPasskeysMock.mockResolvedValue([]);
});

describe('useSettingsSecurityController', () => {
  it('redirects unauthenticated users to login', async () => {
    renderHook(() => useSettingsSecurityController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/login', replace: true });
    });
  });

  it('loads security state and passkeys for signed-in users', async () => {
    authState.session = { user: { id: 'user-1' } };
    listPasskeysMock.mockResolvedValue([{ id: 'pk-1', friendly_name: 'Phone' }]);

    const { result } = renderHook(() => useSettingsSecurityController());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.security).toEqual(baseSecurity);
      expect(result.current.passkeys).toEqual([{ id: 'pk-1', friendly_name: 'Phone' }]);
    });
  });

  it('registers a passkey and refreshes list', async () => {
    authState.session = { user: { id: 'user-1' } };
    registerPasskeyMock.mockResolvedValue(undefined);
    listPasskeysMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'pk-new', friendly_name: null }]);

    const { result } = renderHook(() => useSettingsSecurityController());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleRegisterPasskey();
    });

    expect(registerPasskeyMock).toHaveBeenCalled();
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'security.passkey.registerOk',
    });
    expect(result.current.passkeys).toEqual([{ id: 'pk-new', friendly_name: null }]);
  });

  it('starts TOTP enrollment and exposes QR payload', async () => {
    authState.session = { user: { id: 'user-1' } };
    enrollTotpFactorMock.mockResolvedValue(enrollPayload);

    const { result } = renderHook(() => useSettingsSecurityController());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleStartTotpEnroll();
    });

    expect(enrollTotpFactorMock).toHaveBeenCalled();
    expect(result.current.totpEnroll).toEqual(enrollPayload);
  });

  it('verifies TOTP enrollment with challenge flow', async () => {
    authState.session = { user: { id: 'user-1' } };
    enrollTotpFactorMock.mockResolvedValue(enrollPayload);
    challengeMfaFactorMock.mockResolvedValue({ challengeId: 'challenge-1' });
    verifyMfaFactorMock.mockResolvedValue(undefined);
    loadUserSecurityStateMock.mockResolvedValueOnce(baseSecurity).mockResolvedValueOnce({
      ...baseSecurity,
      hasVerifiedTotp: true,
      verifiedTotpFactorId: 'factor-1',
      currentLevel: 'aal2',
      nextLevel: 'aal2',
    });

    const { result } = renderHook(() => useSettingsSecurityController());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleStartTotpEnroll();
    });

    act(() => {
      result.current.setTotpCode('123456');
    });

    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;
    await act(async () => {
      await result.current.handleVerifyTotpEnroll(event);
    });

    expect(challengeMfaFactorMock).toHaveBeenCalledWith('factor-1');
    expect(verifyMfaFactorMock).toHaveBeenCalledWith({
      factorId: 'factor-1',
      challengeId: 'challenge-1',
      code: '123456',
    });
    expect(result.current.totpEnroll).toBeNull();
    expect(result.current.security?.hasVerifiedTotp).toBe(true);
  });

  it('unenrolls verified TOTP factor', async () => {
    authState.session = { user: { id: 'user-1' } };
    loadUserSecurityStateMock.mockResolvedValue({
      ...baseSecurity,
      hasVerifiedTotp: true,
      verifiedTotpFactorId: 'factor-1',
    });
    unenrollTotpFactorMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSettingsSecurityController());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleRemoveTotp();
    });

    expect(unenrollTotpFactorMock).toHaveBeenCalledWith('factor-1');
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'security.totp.removeOk',
    });
  });
});
