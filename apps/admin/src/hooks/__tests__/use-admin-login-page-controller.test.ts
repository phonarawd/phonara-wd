import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdminLoginPageController } from '@/hooks/use-admin-login-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const signInWithPasswordMock = vi.hoisted(() => vi.fn());
const signOutLocalMock = vi.hoisted(() => vi.fn());
const fetchProfileIsAdminMock = vi.hoisted(() => vi.fn());
const resolveAdminPostLoginDestinationMock = vi.hoisted(() => vi.fn());

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
  signInWithPassword: signInWithPasswordMock,
  signOutLocal: signOutLocalMock,
}));

vi.mock('@/domain/admin-post-auth', () => ({
  fetchProfileIsAdmin: fetchProfileIsAdminMock,
  resolveAdminPostLoginDestination: resolveAdminPostLoginDestinationMock,
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

beforeEach(() => {
  navigateMock.mockReset();
  signInWithPasswordMock.mockReset();
  signOutLocalMock.mockReset();
  fetchProfileIsAdminMock.mockReset();
  resolveAdminPostLoginDestinationMock.mockReset();
  authState.setAuthSession.mockReset();
  authState.session = null;
  authState.loading = false;
  resolveAdminPostLoginDestinationMock.mockResolvedValue('/');
});

describe('useAdminLoginPageController', () => {
  it('redirects signed-in admins away from login', async () => {
    authState.session = { user: { id: 'admin-1' } };
    fetchProfileIsAdminMock.mockResolvedValue(true);

    renderHook(() => useAdminLoginPageController());

    await waitFor(() => {
      expect(fetchProfileIsAdminMock).toHaveBeenCalledWith('admin-1');
      expect(resolveAdminPostLoginDestinationMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
    });
  });

  it('shows forbidden and clears session for non-admin profiles', async () => {
    authState.session = { user: { id: 'user-1' } };
    fetchProfileIsAdminMock.mockResolvedValue(false);

    const { result } = renderHook(() => useAdminLoginPageController());

    await waitFor(() => {
      expect(signOutLocalMock).toHaveBeenCalled();
      expect(authState.setAuthSession).toHaveBeenCalledWith(null);
      expect(result.current.forbidden).toBe(true);
    });
  });
});
