import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdminRouteGate } from '@/hooks/use-admin-route-gate';

const navigateMock = vi.hoisted(() => vi.fn());
const signOutLocalMock = vi.hoisted(() => vi.fn());
const resolveAdminDeskAccessMock = vi.hoisted(() => vi.fn());
const isAdminAuthSurfacePathMock = vi.hoisted(() => vi.fn());
const pathnameState = vi.hoisted(() => ({ value: '/queues' }));

const authState = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  loading: false,
  setAuthSession: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => unknown;
  }) => select({ location: { pathname: pathnameState.value } }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => authState,
}));

vi.mock('@/lib/auth', () => ({
  signOutLocal: signOutLocalMock,
}));

vi.mock('@/domain/admin-post-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/admin-post-auth')>();
  return {
    ...actual,
    isAdminAuthSurfacePath: isAdminAuthSurfacePathMock,
    resolveAdminDeskAccess: resolveAdminDeskAccessMock,
  };
});

beforeEach(() => {
  navigateMock.mockReset();
  signOutLocalMock.mockReset();
  resolveAdminDeskAccessMock.mockReset();
  isAdminAuthSurfacePathMock.mockReset();
  authState.setAuthSession.mockReset();
  authState.session = null;
  authState.loading = false;
  pathnameState.value = '/queues';
  isAdminAuthSurfacePathMock.mockImplementation(
    (path: string) => path === '/login' || path === '/mfa/enroll' || path === '/mfa/challenge',
  );
  resolveAdminDeskAccessMock.mockResolvedValue({ kind: 'allowed' });
});

describe('useAdminRouteGate', () => {
  it('passes through auth surfaces without desk checks', () => {
    pathnameState.value = '/login';
    isAdminAuthSurfacePathMock.mockReturnValue(true);

    const { result } = renderHook(() => useAdminRouteGate());

    expect(result.current).toEqual({ kind: 'auth-surface' });
    expect(resolveAdminDeskAccessMock).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated desk access to login', async () => {
    renderHook(() => useAdminRouteGate());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/login' });
    });
  });

  it('shows forbidden after non-admin desk access', async () => {
    authState.session = { user: { id: 'user-1' } };
    resolveAdminDeskAccessMock.mockResolvedValue({ kind: 'forbidden' });

    const { result } = renderHook(() => useAdminRouteGate());

    await waitFor(() => {
      expect(signOutLocalMock).toHaveBeenCalled();
      expect(authState.setAuthSession).toHaveBeenCalledWith(null);
      expect(result.current).toEqual({ kind: 'forbidden' });
    });
  });

  it('redirects admin desk access without aal2 to MFA challenge', async () => {
    authState.session = { user: { id: 'admin-1' } };
    resolveAdminDeskAccessMock.mockResolvedValue({ kind: 'mfa-challenge' });

    renderHook(() => useAdminRouteGate());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/mfa/challenge' });
    });
  });

  it('allows desk routes when admin session is aal2', async () => {
    authState.session = { user: { id: 'admin-1' } };

    const { result } = renderHook(() => useAdminRouteGate());

    await waitFor(() => {
      expect(result.current).toEqual({ kind: 'ready' });
    });
  });
});
