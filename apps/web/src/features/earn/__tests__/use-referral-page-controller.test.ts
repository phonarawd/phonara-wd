import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useReferralPageController } from '@/features/earn/use-referral-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
const useViralMissionStatusMock = vi.hoisted(() => vi.fn());
const useViralMissionClaimMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());

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

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  navigateMock.mockReset();
  useAuthMock.mockReturnValue({
    session: { user: { id: 'user-1' } },
    loading: false,
  });
  useViralMissionStatusMock.mockReturnValue({
    status: {
      ok: true,
      missions: [
        {
          mission: 'share_referral_link',
          used: 1,
          max: 3,
          remaining: 2,
          window: 'day',
          reward_phon: '25.000000',
        },
      ],
      streak_days: 0,
      streak_target_days: 7,
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
  useViralMissionClaimMock.mockReturnValue({
    claimViralMission: vi.fn(),
    loading: false,
    result: null,
    error: null,
  });

  fromMock.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { username: 'phon_user' }, error: null }),
          }),
        }),
      };
    }
    if (table === 'referrals') {
      return {
        select: () => ({
          eq: () => ({
            order: async () => ({
              data: [
                {
                  id: 'ref-1',
                  referred_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                  referrer_phon: '1000.000000',
                  created_at: '2026-07-01T00:00:00.000Z',
                  rewarded_at: '2026-07-02T00:00:00.000Z',
                },
              ],
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === 'missions') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });

  rpcMock.mockResolvedValue({
    data: {
      referral: {
        total_invited: 1,
        qualified_total: 1,
        pending_review: 0,
        per_friend_bonus_multiplier: '1.10',
        payout_today: { used: 1, max: 3, remaining: 2 },
      },
    },
    error: null,
  });
});

describe('useReferralPageController', () => {
  it('loads referral dashboard snapshot and curated viral missions', async () => {
    const { result } = renderHook(() => useReferralPageController(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.referralCode).toBe('phon_user');
    expect(result.current.hubReferral?.totalInvited).toBe(1);
    expect(result.current.totalPaidRewardsLabel).toBe('+1,000P');
    expect(result.current.treeRows).toHaveLength(1);
    expect(result.current.missions.map((row) => row.id)).toEqual([
      'viral-shareLink',
      'viral-invite3',
      'viral-inviteWeekly',
    ]);
    expect(result.current.missions[0]?.rewardLabel).toBe('+25P');
  });
});
