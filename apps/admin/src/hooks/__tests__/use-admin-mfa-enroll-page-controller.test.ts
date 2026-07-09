import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdminMfaEnrollPageController } from '@/hooks/use-admin-mfa-enroll-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const signOutLocalMock = vi.hoisted(() => vi.fn());
const fetchProfileIsAdminMock = vi.hoisted(() => vi.fn());
const loadAdminMfaGateStateMock = vi.hoisted(() => vi.fn());
const enrollTotpFactorMock = vi.hoisted(() => vi.fn());
const challengeMfaFactorMock = vi.hoisted(() => vi.fn());
const verifyMfaFactorMock = vi.hoisted(() => vi.fn());
const waitForAdminAal2Mock = vi.hoisted(() => vi.fn());

const authState = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  loading: false,
  setAuthSession: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => authState,
}));

vi.mock('@/lib/auth', () => ({
  signOutLocal: signOutLocalMock,
}));

vi.mock('@/domain/admin-post-auth', () => ({
  fetchProfileIsAdmin: fetchProfileIsAdminMock,
}));

vi.mock('@/domain/admin-auth', () => ({
  loadAdminMfaGateState: loadAdminMfaGateStateMock,
  enrollTotpFactor: enrollTotpFactorMock,
  challengeMfaFactor: challengeMfaFactorMock,
  verifyMfaFactor: verifyMfaFactorMock,
  waitForAdminAal2: waitForAdminAal2Mock,
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

const enrollPayload = {
  factorId: 'factor-1',
  qrCode: 'data:image/svg+xml;base64,abc',
  secret: 'SECRET123',
};

beforeEach(() => {
  navigateMock.mockReset();
  signOutLocalMock.mockReset();
  fetchProfileIsAdminMock.mockReset();
  loadAdminMfaGateStateMock.mockReset();
  enrollTotpFactorMock.mockReset();
  challengeMfaFactorMock.mockReset();
  verifyMfaFactorMock.mockReset();
  waitForAdminAal2Mock.mockReset();
  authState.setAuthSession.mockReset();
  authState.session = null;
  authState.loading = false;
  fetchProfileIsAdminMock.mockResolvedValue(true);
  loadAdminMfaGateStateMock.mockResolvedValue({
    currentLevel: 'aal1',
    nextLevel: 'aal2',
    hasVerifiedTotp: false,
    verifiedTotpFactorId: null,
  });
  enrollTotpFactorMock.mockResolvedValue(enrollPayload);
});

describe('useAdminMfaEnrollPageController', () => {
  it('redirects unauthenticated users to login', async () => {
    renderHook(() => useAdminMfaEnrollPageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/login' });
    });
  });

  it('redirects admins who already reached aal2', async () => {
    authState.session = { user: { id: 'admin-1' } };
    loadAdminMfaGateStateMock.mockResolvedValue({
      currentLevel: 'aal2',
      nextLevel: 'aal2',
      hasVerifiedTotp: true,
      verifiedTotpFactorId: 'factor-1',
    });

    renderHook(() => useAdminMfaEnrollPageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
    });
    expect(enrollTotpFactorMock).not.toHaveBeenCalled();
  });

  it('redirects admins with verified TOTP to challenge', async () => {
    authState.session = { user: { id: 'admin-1' } };
    loadAdminMfaGateStateMock.mockResolvedValue({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      hasVerifiedTotp: true,
      verifiedTotpFactorId: 'factor-1',
    });

    renderHook(() => useAdminMfaEnrollPageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/mfa/challenge' });
    });
    expect(enrollTotpFactorMock).not.toHaveBeenCalled();
  });

  it('loads TOTP enrollment payload for eligible admins', async () => {
    authState.session = { user: { id: 'admin-1' } };

    const { result } = renderHook(() => useAdminMfaEnrollPageController());

    await waitFor(() => {
      expect(enrollTotpFactorMock).toHaveBeenCalled();
      expect(result.current.enroll).toEqual(enrollPayload);
      expect(result.current.loading).toBe(false);
    });
  });

  it('shows forbidden and clears session for non-admin profiles', async () => {
    authState.session = { user: { id: 'user-1' } };
    fetchProfileIsAdminMock.mockResolvedValue(false);

    const { result } = renderHook(() => useAdminMfaEnrollPageController());

    await waitFor(() => {
      expect(signOutLocalMock).toHaveBeenCalled();
      expect(authState.setAuthSession).toHaveBeenCalledWith(null);
      expect(result.current.forbidden).toBe(true);
    });
  });
});
