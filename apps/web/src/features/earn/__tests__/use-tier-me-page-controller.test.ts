import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTierMePageController } from '@/features/earn/use-tier-me-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
const useRepeatableMissionStatusMock = vi.hoisted(() => vi.fn());
const useRepeatableMissionClaimMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const productToastShowMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/features/earn/use-repeatable-missions', () => ({
  useRepeatableMissionStatus: () => useRepeatableMissionStatusMock(),
  useRepeatableMissionClaim: () => useRepeatableMissionClaimMock(),
  repeatableMissionKeys: {
    status: (userId: string | null, lane: string) => ['repeatable-mission-status', userId, lane],
  },
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastShowMock },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  navigateMock.mockReset();
  productToastShowMock.mockReset();
  useAuthMock.mockReturnValue({
    session: { user: { id: 'user-1' } },
    loading: false,
  });

  useRepeatableMissionStatusMock.mockReturnValue({
    status: {
      ok: true,
      missions: [
        {
          mission: 'tier_keep_status',
          progress: 1,
          target: 1,
          claimed: false,
          claimable: true,
          reward_phon: '4000.000000',
        },
      ],
    },
    loading: false,
  });

  useRepeatableMissionClaimMock.mockReturnValue({
    claimMission: vi.fn().mockResolvedValue({ ok: true, phon_awarded: '4000.000000' }),
    loading: false,
  });

  rpcMock.mockImplementation((name: string) => {
    if (name === 'rpc_get_earn_hub_status') {
      return Promise.resolve({
        data: {
          tier: 'silver',
          xp: 12000,
          next_tier_xp: 25000,
          referral: {
            total_invited: 3,
            qualified_total: 1,
            pending_review: 0,
            payout_today: { used: 0, max: 5, remaining: 5 },
            per_friend_bonus_multiplier: '1.10',
          },
          limits_today: [
            {
              action: 'attendance',
              label_key: 'earn.limits.action.attendance',
              used: 1,
              max: 2,
              remaining: 1,
            },
          ],
        },
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
});

describe('useTierMePageController', () => {
  it('loads tier progress, limits, and decay panel for silver', async () => {
    const { result } = renderHook(() => useTierMePageController(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tierProgress).toMatchObject({
      tier: 'silver',
      xp: 12000,
      nextTier: 'gold',
      progressPercent: 35,
    });
    expect(result.current.limitsToday).toHaveLength(1);
    expect(result.current.decayPanel.eligible).toBe(true);
    expect(result.current.keepMission?.canClaim).toBe(false);
    expect(result.current.keepMission?.unavailableReasonKey).toBe(
      'earn.mission.unavailable.tierKeepStatus',
    );
    expect(result.current.qualifiedReferrals).toBe(1);
  });

  it('does not claim tier_keep_status while E1 engine is pending', async () => {
    const claimMission = vi.fn().mockResolvedValue({ ok: true, phon_awarded: '4000.000000' });
    useRepeatableMissionClaimMock.mockReturnValue({ claimMission, loading: false });

    const { result } = renderHook(() => useTierMePageController(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.claimKeepMission();

    expect(claimMission).not.toHaveBeenCalled();
  });

  it('redirects guests to login', async () => {
    useAuthMock.mockReturnValue({ session: null, loading: false });
    renderHook(() => useTierMePageController(), { wrapper });
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: '/login', replace: true }));
  });
});
