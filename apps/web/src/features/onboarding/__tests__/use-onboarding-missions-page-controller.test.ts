import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useOnboardingMissionsPageController } from '@/features/onboarding/use-onboarding-missions-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
const isOnboardingCompleteMock = vi.hoisted(() => vi.fn());
const markOnboardingCompleteMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: useAuthMock,
}));

vi.mock('@/lib/onboarding-funnel', () => ({
  isOnboardingComplete: isOnboardingCompleteMock,
  markOnboardingComplete: markOnboardingCompleteMock,
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
    useQuery: vi.fn(() => ({
      data: {
        welcomeClaimed: false,
        welcomeRewardPhon: null,
        profileComplete: false,
        profileRewardPhon: null,
        shareUsed: 0,
        shareRewardPhon: '25.000000',
      },
      isLoading: false,
      error: null,
    })),
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
  },
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: vi.fn() },
}));

beforeEach(() => {
  navigateMock.mockReset();
  useAuthMock.mockReset();
  isOnboardingCompleteMock.mockReset();
  markOnboardingCompleteMock.mockReset();
  invalidateQueriesMock.mockReset();
  rpcMock.mockReset();
  fromMock.mockReset();
  useAuthMock.mockReturnValue({
    session: { user: { id: 'user-1' } },
    loading: false,
  });
  isOnboardingCompleteMock.mockReturnValue(false);
});

describe('useOnboardingMissionsPageController', () => {
  it('redirects unauthenticated users to login', async () => {
    useAuthMock.mockReturnValue({ session: null, loading: false });

    renderHook(() => useOnboardingMissionsPageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/login', replace: true });
    });
  });

  it('redirects completed users to home', async () => {
    isOnboardingCompleteMock.mockReturnValue(true);

    renderHook(() => useOnboardingMissionsPageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/home', replace: true });
    });
  });

  it('claims welcome bonus via rpc_claim_welcome_bonus', async () => {
    rpcMock.mockResolvedValue({
      data: { already_claimed: false, phon_awarded: '10000.000000' },
      error: null,
    });

    const { result } = renderHook(() => useOnboardingMissionsPageController());

    await act(async () => {
      await result.current.claimWelcomeBonus();
    });

    expect(rpcMock).toHaveBeenCalledWith('rpc_claim_welcome_bonus', {
      p_idempotency_key: 'welcome:user-1',
    });
    expect(invalidateQueriesMock).toHaveBeenCalled();
  });

  it('marks onboarding complete on finish', () => {
    const { result } = renderHook(() => useOnboardingMissionsPageController());

    act(() => {
      result.current.finish();
    });

    expect(markOnboardingCompleteMock).toHaveBeenCalledWith('user-1');
    expect(navigateMock).toHaveBeenCalledWith({ to: '/home', replace: true });
  });
});
