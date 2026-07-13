import { createElement, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseAffiliateRankLeaderboard } from '@/domain/referral-leaderboard-display-contract';
import { useReferralLeaderboardController } from '@/features/earn/use-referral-leaderboard-controller';

const callRpcMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/rpc', () => ({
  callRpc: (...args: unknown[]) => callRpcMock(...args),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

describe('useReferralLeaderboardController', () => {
  beforeEach(() => {
    callRpcMock.mockReset();
    useAuthMock.mockReturnValue({ session: { user: { id: 'user-1' } } });
    callRpcMock.mockResolvedValue({
      ok: true,
      window: 'all_time',
      limit: 50,
      entries: [],
      self: null,
    });
  });

  it('parses RPC payload via domain parser (no money columns)', () => {
    const raw = {
      ok: true,
      window: 'all_time',
      limit: 50,
      entries: [{ rank: 1, display_name: 'xy***', qualified_count: 4, is_self: true }],
      self: { rank: 1, display_name: 'xy***', qualified_count: 4, is_self: true },
    };
    const parsed = parseAffiliateRankLeaderboard(raw);
    expect(parsed?.entries[0]?.qualifiedCount).toBe(4);
    expect(JSON.stringify(parsed)).not.toMatch(/payout|reward_phon/i);
  });

  it('exposes live windows when GATE unlock is on', () => {
    const { result } = renderHook(() => useReferralLeaderboardController(), { wrapper });
    expect(result.current.live).toBe(true);
    expect(result.current.deferred).toBe(false);
    expect(result.current.windows).toEqual(['all_time', '30d', '7d']);
  });
});
