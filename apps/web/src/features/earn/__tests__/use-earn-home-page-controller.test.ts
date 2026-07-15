import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEarnHomePageController } from '@/features/earn/use-earn-home-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
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

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/features/earn/use-viral-missions', () => ({
  useViralMissionStatus: () => ({
    status: { missions: [], streak_days: 0, streak_target_days: 7 },
    loading: false,
  }),
}));

vi.mock('@/features/earn/use-repeatable-missions', () => ({
  useRepeatableMissionStatus: () => ({
    status: { missions: [] },
    loading: false,
  }),
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
  useAuthMock.mockReturnValue({
    session: { user: { id: 'user-1' } },
    loading: false,
  });

  rpcMock.mockImplementation((name: string) => {
    if (name === 'rpc_get_earn_hub_status') {
      return Promise.resolve({
        data: {
          tier: 'bronze',
          xp: 1200,
          next_tier_xp: 5000,
          attendance: {
            used: 0,
            max: 1,
            remaining: 1,
            cycle_day: 1,
            next_reward_phon: '1000.000000',
          },
          roulette: { used: 0, max: 2, remaining: 2 },
          season: { id: 1, percent: 62, days_left: 9 },
          launch_slots: { filled: 12, total: 1000 },
          wallet: { phon_balance: '2500.000000' },
          cooldown: { active: false, reason_key: null },
          limits_today: [
            {
              action: 'golden_earth_tap',
              used: 0,
              max: 5,
              remaining: 5,
            },
          ],
        },
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });

  fromMock.mockReturnValue({
    select: () => ({
      eq: () => Promise.resolve({ data: [], error: null }),
    }),
  });
});

describe('useEarnHomePageController', () => {
  it('builds tier progress, catalog label, and attendance next action', async () => {
    const { result } = renderHook(() => useEarnHomePageController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tierProgress?.tier).toBe('bronze');
    expect(result.current.catalogRewardsLabel).toMatch(/^\+[\d,]+P$/);
    expect(result.current.nextAction.kind).toBe('attendance');
    expect(result.current.missionPreviews.length).toBe(3);
    expect(result.current.useAmbientTicker).toBe(true);
    expect(result.current.wallet?.phonBalanceLabel).toBe('+2,500P');
  });
});
