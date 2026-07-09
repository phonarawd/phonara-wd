import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useReferralInvitePageController } from '@/features/earn/use-referral-invite-page-controller';

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
          data: {
            referral: {
              total_invited: 1,
              qualified_total: 0,
              pending_review: 0,
              per_friend_bonus_multiplier: '1.00',
              payout_today: { used: 0, max: 3, remaining: 3 },
            },
          },
          error: null,
        });
      }
      if (name === 'rpc_get_viral_mission_status') {
        return Promise.resolve({
          data: {
            missions: [
              {
                mission: 'share_referral_link',
                used: 0,
                max: 3,
                remaining: 3,
                reward_phon: '25.000000',
              },
            ],
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  },
}));

describe('useReferralInvitePageController', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    claimViralMissionMock.mockReset();
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://phonara.net' },
      writable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it('loads invite snapshot with referral code and share mission', async () => {
    const { result } = renderHook(() => useReferralInvitePageController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.referralCode).toBe('phon_user');
    expect(result.current.inviteUrl).toBe('https://phonara.net/r/phon_user');
    expect(result.current.shareRewardLabel).toBe('+25P');
    expect(result.current.canClaimShareReward).toBe(true);
    expect(result.current.webShareAvailable).toBe(true);
  });

  it('claims share reward after successful web share', async () => {
    claimViralMissionMock.mockResolvedValue({
      ok: true,
      phon_awarded: '25.000000',
    });

    const { result } = renderHook(() => useReferralInvitePageController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.shareInvite();

    expect(navigator.share).toHaveBeenCalled();
    expect(claimViralMissionMock).toHaveBeenCalledWith('share_referral_link', expect.any(String));
  });
});
