import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useShareEarningsPageController } from '@/features/earn/use-share-earnings-page-controller';

const navigateMock = vi.fn();
const claimViralMissionMock = vi.fn();

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1' } },
    loading: false,
  }),
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string, params?: Record<string, string | number>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: vi.fn() },
}));

vi.mock('@/features/earn/use-viral-missions', () => ({
  useViralMissionStatus: () => ({
    status: {
      missions: [
        {
          mission: 'share_referral_link',
          used: 0,
          max: 3,
          remaining: 3,
          reward_phon: '25.000000',
        },
        {
          mission: 'viral_streak_share',
          used: 0,
          max: 1,
          remaining: 1,
          reward_phon: '75.000000',
        },
      ],
    },
    loading: false,
  }),
  useViralMissionClaim: () => ({
    claimViralMission: claimViralMissionMock,
    loading: false,
  }),
  viralMissionKeys: { status: (userId: string | null) => ['viral-mission-status', userId] },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { username: 'phon_user' }, error: null }),
        })),
      })),
    })),
    rpc: vi.fn((name: string) => {
      if (name === 'rpc_get_earn_hub_status') {
        return Promise.resolve({
          data: { tier: 'gold', xp: 30000, next_tier_xp: 100000 },
          error: null,
        });
      }
      if (name === 'rpc_get_golden_earth_status') {
        return Promise.resolve({
          data: { earned_phon_today: '120.000000', login_streak: 7 },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  },
}));

describe('useShareEarningsPageController', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    claimViralMissionMock.mockReset();
    claimViralMissionMock.mockResolvedValue({ ok: true, phon_awarded: '25.000000' });
    Object.assign(navigator, {
      share: vi.fn().mockResolvedValue(undefined),
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('loads earnings card snapshot from RPC payloads', async () => {
    const { result } = renderHook(() => useShareEarningsPageController(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.card?.earningsLabel).toBe('+120P');
    expect(result.current.card?.tier.tier).toBe('gold');
    expect(result.current.referralCode).toBe('phon_user');
    expect(result.current.canClaimShareReward).toBe(true);
    expect(result.current.canClaimStreakReward).toBe(true);
  });

  it('shares via Web Share and claims share_referral_link', async () => {
    const { result } = renderHook(() => useShareEarningsPageController(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.shareEarnings();

    expect(navigator.share).toHaveBeenCalled();
    expect(claimViralMissionMock).toHaveBeenCalledWith('share_referral_link', expect.any(String));
  });
});
