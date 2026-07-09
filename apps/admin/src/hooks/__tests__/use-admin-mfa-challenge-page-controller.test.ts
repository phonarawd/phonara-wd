import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdminMfaChallengePageController } from '@/hooks/use-admin-mfa-challenge-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const signOutLocalMock = vi.hoisted(() => vi.fn());
const fetchProfileIsAdminMock = vi.hoisted(() => vi.fn());
const loadAdminMfaGateStateMock = vi.hoisted(() => vi.fn());
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
  challengeMfaFactor: challengeMfaFactorMock,
  verifyMfaFactor: verifyMfaFactorMock,
  waitForAdminAal2: waitForAdminAal2Mock,
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

beforeEach(() => {
  navigateMock.mockReset();
  signOutLocalMock.mockReset();
  fetchProfileIsAdminMock.mockReset();
  loadAdminMfaGateStateMock.mockReset();
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
    hasVerifiedTotp: true,
    verifiedTotpFactorId: 'factor-1',
  });
});

describe('useAdminMfaChallengePageController', () => {
  it('redirects unauthenticated users to login', async () => {
    renderHook(() => useAdminMfaChallengePageController());

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

    renderHook(() => useAdminMfaChallengePageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
    });
  });

  it('redirects admins without verified TOTP to enroll', async () => {
    authState.session = { user: { id: 'admin-1' } };
    loadAdminMfaGateStateMock.mockResolvedValue({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      hasVerifiedTotp: false,
      verifiedTotpFactorId: null,
    });

    renderHook(() => useAdminMfaChallengePageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/mfa/enroll' });
    });
  });

  it('enters ready state for admins needing step-up', async () => {
    authState.session = { user: { id: 'admin-1' } };

    const { result } = renderHook(() => useAdminMfaChallengePageController());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.setupError).toBe(false);
      expect(result.current.missingFactor).toBe(false);
    });
  });

  it('shows forbidden and clears session for non-admin profiles', async () => {
    authState.session = { user: { id: 'user-1' } };
    fetchProfileIsAdminMock.mockResolvedValue(false);

    const { result } = renderHook(() => useAdminMfaChallengePageController());

    await waitFor(() => {
      expect(signOutLocalMock).toHaveBeenCalled();
      expect(authState.setAuthSession).toHaveBeenCalledWith(null);
      expect(result.current.forbidden).toBe(true);
    });
  });

  it('shows missing-factor when verified TOTP id is absent', async () => {
    authState.session = { user: { id: 'admin-1' } };
    loadAdminMfaGateStateMock.mockResolvedValue({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      hasVerifiedTotp: true,
      verifiedTotpFactorId: null,
    });

    const { result } = renderHook(() => useAdminMfaChallengePageController());

    await waitFor(() => {
      expect(result.current.missingFactor).toBe(true);
    });
  });

  it('shows setup error when gate state cannot load', async () => {
    authState.session = { user: { id: 'admin-1' } };
    loadAdminMfaGateStateMock.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAdminMfaChallengePageController());

    await waitFor(() => {
      expect(result.current.setupError).toBe(true);
    });
  });
});
