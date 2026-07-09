import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useHomeMissionsPageController } from '@/features/earn/use-home-missions-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
const useViralMissionStatusMock = vi.hoisted(() => vi.fn());
const useViralMissionClaimMock = vi.hoisted(() => vi.fn());
const useRepeatableMissionStatusMock = vi.hoisted(() => vi.fn());
const useRepeatableMissionClaimMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());

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

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
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
          used: 0,
          max: 3,
          remaining: 3,
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
  useRepeatableMissionStatusMock.mockReturnValue({
    status: {
      ok: true,
      missions: [
        {
          mission: 'weekly_play5',
          progress: 2,
          target: 5,
          claimed: false,
          claimable: false,
          reward_phon: '2000.000000',
        },
      ],
    },
    loading: false,
    refetch: vi.fn(),
  });
  useRepeatableMissionClaimMock.mockReturnValue({
    claimMission: vi.fn(),
    loading: false,
    error: null,
  });

  fromMock.mockImplementation((table: string) => {
    if (table === 'missions') {
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({
              data: [{ mission: 'complete_profile', completed_at: '2026-07-01T00:00:00.000Z' }],
              error: null,
            }),
        }),
      };
    }
    if (table === 'welcome_bonuses') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { user_id: 'user-1' }, error: null }),
          }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };
  });
});

describe('useHomeMissionsPageController', () => {
  it('loads viral tab missions with RPC reward labels', async () => {
    const { result } = renderHook(() => useHomeMissionsPageController({ tab: 'viral' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activeTab).toBe('viral');
    const shareMission = result.current.missions.find(
      (mission) => mission.id === 'viral-shareLink',
    );
    expect(shareMission?.rewardLabel).toBe('+25P');
    expect(shareMission?.canClaim).toBe(true);
  });

  it('navigates tab changes via search params', async () => {
    const { result } = renderHook(() => useHomeMissionsPageController({ tab: 'viral' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    result.current.setActiveTab('weekly');
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/home/missions',
        search: { tab: 'weekly' },
      }),
    );
  });

  it('does not expose onboarding-only welcome claim rows', async () => {
    const { result } = renderHook(() => useHomeMissionsPageController({ tab: 'growth' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.missions.some((mission) => mission.id === 'welcome-bonus')).toBe(false);
  });
});
