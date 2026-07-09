import { act, createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccountProfileController } from '@/features/account/use-account-profile-controller';

const navigateMock = vi.fn();
const productToastShow = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());

const profileState = vi.hoisted(() => ({
  profile: {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    username: null as string | null,
    display_name: null as string | null,
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

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastShow },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: updateMock,
    })),
    rpc: rpcMock,
  },
}));

describe('useAccountProfileController', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    productToastShow.mockReset();
    updateMock.mockReset();
    rpcMock.mockReset();

    profileState.profile = {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      username: null,
      display_name: null,
      kyc_tier: 'email_verified',
    };
    profileState.loading = false;

    updateMock.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    rpcMock.mockResolvedValue({
      data: { tier: 'gold', xp: 12000, next_tier: 'platinum', next_xp: 100000 },
      error: null,
    });
  });

  it('loads tier snapshot and hydrates profile fields', async () => {
    profileState.profile.username = 'phon_user';
    profileState.profile.display_name = 'Operator';

    const { result } = renderHook(() => useAccountProfileController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tierProgress?.tier).toBe('gold');
    expect(result.current.username).toBe('phon_user');
    expect(result.current.displayName).toBe('Operator');
    expect(result.current.email).toBe('user@example.com');
    expect(result.current.profileComplete).toBe(true);
  });

  it('saves profile updates through profiles RLS update', async () => {
    const { result } = renderHook(() => useAccountProfileController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setUsername('phon_user');
      result.current.setDisplayName('Operator');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(updateMock).toHaveBeenCalledWith({
      username: 'phon_user',
      display_name: 'Operator',
    });
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'account.profile.saveOk',
    });
  });

  it('maps duplicate username errors to taken gate key', async () => {
    updateMock.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { code: '23505', message: 'duplicate' } }),
    });

    const { result } = renderHook(() => useAccountProfileController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setUsername('phon_user');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current.error).toBe('account.profile.usernameTaken');
  });
});
