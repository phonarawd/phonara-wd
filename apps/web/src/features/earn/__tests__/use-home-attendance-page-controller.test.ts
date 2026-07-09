import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useHomeAttendancePageController } from '@/features/earn/use-home-attendance-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
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

  rpcMock.mockImplementation((name: string) => {
    if (name === 'rpc_get_earn_hub_status') {
      return Promise.resolve({
        data: {
          attendance: {
            used: 0,
            max: 1,
            remaining: 1,
            cycle_day: 2,
            next_reward_phon: '1000.000000',
          },
          roulette: { remaining: 1 },
        },
        error: null,
      });
    }
    if (name === 'rpc_get_repeatable_mission_status') {
      return Promise.resolve({
        data: {
          ok: true,
          missions: [
            { mission: 'daily_quiz', claimable: true, claimed: false, progress: 0, target: 1 },
            { mission: 'weekly_play_5', claimable: false, claimed: false, progress: 1, target: 5 },
          ],
        },
        error: null,
      });
    }
    if (name === 'rpc_get_viral_mission_status') {
      return Promise.resolve({
        data: {
          ok: true,
          missions: [{ mission: 'share_referral_link', remaining: 2 }],
        },
        error: null,
      });
    }
    if (name === 'rpc_claim_daily_reward') {
      return Promise.resolve({
        data: {
          already_claimed: false,
          phon_awarded: '1000.000000',
          streak_day: 2,
          cycle_day: 2,
          next_day_preview: '1000.000000',
        },
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });

  fromMock.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({
            data: {
              current_streak: 1,
              longest_streak: 3,
              total_phon_earned: '2500.000000',
              last_claimed_date: '2026-07-04',
            },
            error: null,
          }),
      }),
    }),
  });
});

describe('useHomeAttendancePageController', () => {
  it('loads attendance snapshot from hub and streak reads', async () => {
    const { result } = renderHook(() => useHomeAttendancePageController(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.attendance?.remaining).toBe(1);
    expect(result.current.streak?.currentStreak).toBe(1);
    expect(result.current.claimState).toBe('reward_pending');
    expect(result.current.cycleDays).toHaveLength(7);
  });

  it('claims daily reward via rpc_claim_daily_reward and warm toast', async () => {
    const { result } = renderHook(() => useHomeAttendancePageController(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await result.current.claimAttendance();
    expect(rpcMock).toHaveBeenCalledWith('rpc_claim_daily_reward');
    expect(productToastShowMock).toHaveBeenCalledWith(
      expect.objectContaining({ zone: 'warm', key: 'earn.attendance.claimedToast' }),
    );
  });
});
