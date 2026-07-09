import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useHomeMissionsReferralPageController } from '@/features/earn/use-home-missions-referral-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
const useViralMissionStatusMock = vi.hoisted(() => vi.fn());
const useViralMissionClaimMock = vi.hoisted(() => vi.fn());
const useRepeatableMissionStatusMock = vi.hoisted(() => vi.fn());
const useRepeatableMissionClaimMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
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

vi.mock('@/features/earn/use-viral-missions', () => ({
  useViralMissionStatus: () => useViralMissionStatusMock(),
  useViralMissionClaim: () => useViralMissionClaimMock(),
  viralMissionKeys: { status: (userId: string | null) => ['viral-mission-status', userId] },
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
    from: (...args: unknown[]) => fromMock(...args),
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

  useViralMissionStatusMock.mockReturnValue({
    status: {
      ok: true,
      missions: [
        {
          mission: 'affiliate_content_post',
          used: 0,
          max: 1,
          remaining: 1,
          reward_phon: '200.000000',
        },
      ],
      streak_days: 0,
      streak_target_days: 7,
    },
    loading: false,
    error: null,
  });

  useRepeatableMissionStatusMock.mockReturnValue({
    status: {
      ok: true,
      missions: [
        {
          mission: 'tier_reach_silver',
          used: 0,
          max: 1,
          remaining: 1,
          reward_phon: '5000.000000',
        },
        {
          mission: 'tier_reach_gold',
          used: 0,
          max: 1,
          remaining: 1,
          reward_phon: '15000.000000',
        },
      ],
    },
    loading: false,
    error: null,
  });

  useViralMissionClaimMock.mockReturnValue({
    claimViralMission: vi.fn().mockResolvedValue({ ok: true, phon_awarded: '200.000000' }),
    loading: false,
  });

  useRepeatableMissionClaimMock.mockReturnValue({
    claimMission: vi.fn().mockResolvedValue({ ok: true, phon_awarded: '5000.000000' }),
    loading: false,
  });

  rpcMock.mockImplementation((name: string) => {
    if (name === 'rpc_get_earn_hub_status') {
      return Promise.resolve({
        data: {
          tier: 'silver',
          referral: {
            total_invited: 4,
            qualified_total: 2,
            pending_review: 1,
            payout_today: { used: 1, max: 5, remaining: 4 },
            per_friend_bonus_multiplier: '1.25',
          },
        },
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });

  fromMock.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
});

describe('useHomeMissionsReferralPageController', () => {
  it('loads curated referral missions and hub snapshot', async () => {
    const { result } = renderHook(() => useHomeMissionsReferralPageController(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.referralHubRoute).toBe('/referral');
    expect(result.current.earnTier).toBe('silver');
    expect(result.current.missions.map((mission) => mission.id)).toEqual([
      'viral-partnerHubVisit',
      'tier-reachSilver',
      'tier-reachGold',
    ]);
    expect(result.current.hubReferral).toMatchObject({
      totalInvited: 4,
      qualifiedTotal: 2,
    });
  });

  it('claims viral partner hub mission by ui id', async () => {
    const claimViralMission = vi.fn().mockResolvedValue({ ok: true, phon_awarded: '200.000000' });
    useViralMissionClaimMock.mockReturnValue({ claimViralMission, loading: false });

    const { result } = renderHook(() => useHomeMissionsReferralPageController(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.claimMission('viral-partnerHubVisit');

    expect(claimViralMission).toHaveBeenCalledWith('affiliate_content_post', expect.any(String));
    expect(productToastShowMock).toHaveBeenCalled();
  });

  it('claims repeatable tier mission by ui id', async () => {
    const claimMission = vi.fn().mockResolvedValue({ ok: true, phon_awarded: '5000.000000' });
    useRepeatableMissionClaimMock.mockReturnValue({ claimMission, loading: false });

    const { result } = renderHook(() => useHomeMissionsReferralPageController(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.claimMission('tier-reachSilver');

    expect(claimMission).toHaveBeenCalledWith('tier_reach_silver', expect.any(String));
    expect(productToastShowMock).toHaveBeenCalled();
  });
});
