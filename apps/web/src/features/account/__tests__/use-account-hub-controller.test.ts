import { act, createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccountHubController } from '@/features/account/use-account-hub-controller';

const navigateMock = vi.fn();
const signOutMock = vi.hoisted(() => vi.fn());
const productToastShow = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());

const profileState = vi.hoisted(() => ({
  profile: {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    username: 'phonuser',
    display_name: 'Phon User',
    created_at: '2026-01-15T00:00:00.000Z',
    kyc_tier: 'email_verified',
  },
  loading: false,
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    session: {
      user: {
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        email: 'user@example.com',
      },
    },
    loading: false,
  }),
}));

vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => profileState,
}));

vi.mock('@/lib/auth', () => ({
  signOut: signOutMock,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastShow },
}));

describe('useAccountHubController', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    signOutMock.mockReset();
    productToastShow.mockReset();
    rpcMock.mockReset();
    window.localStorage.clear();
    rpcMock.mockResolvedValue({
      data: {
        tier: 'silver',
        xp: 12000,
        next_tier_xp: 25000,
        referral: {
          total_invited: 5,
          qualified_total: 2,
        },
      },
      error: null,
    });
  });

  it('loads hub snapshot and groups nav items', async () => {
    const { result } = renderHook(() => useAccountHubController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.displayLabel).toBe('Phon User');
    expect(result.current.avatarInitial).toBe('P');
    expect(result.current.tierProgress?.tier).toBe('silver');
    expect(result.current.qualifiedReferrals).toBe(2);
    expect(result.current.navByGroup.profile.some((item) => item.id === 'kyc')).toBe(true);
    expect(result.current.navByGroup.profile.some((item) => item.id === 'responsible-gaming')).toBe(
      true,
    );
  });

  it('signs out and navigates to login', async () => {
    signOutMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAccountHubController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(signOutMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith({ to: '/login', replace: true });
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'account.toast.logoutDone',
    });
  });

  it('submits account deletion when reason is valid', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('valid reason text');
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    const { result } = renderHook(() => useAccountHubController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleDeleteAccount();
    });

    expect(rpcMock).toHaveBeenCalledWith('rpc_request_account_deletion', {
      p_reason: 'valid reason text',
    });
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'account.delete.submitted',
    });

    promptSpy.mockRestore();
  });
});
