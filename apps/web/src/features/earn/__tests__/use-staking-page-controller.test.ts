import { createElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useStakingPageController } from '@/features/earn/use-staking-page-controller';

const useAuthMock = vi.hoisted(() => vi.fn());
const useWalletMock = vi.hoisted(() => vi.fn());
const useStakingPoolsMock = vi.hoisted(() => vi.fn());
const useStakingPositionsMock = vi.hoisted(() => vi.fn());
const usePlatformGatesMock = vi.hoisted(() => vi.fn());
const useStakingActionsMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const claimMock = vi.hoisted(() => vi.fn());
const unstakeMock = vi.hoisted(() => vi.fn());
const stakePoolMock = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => useWalletMock(),
}));

vi.mock('@/hooks/use-trading', () => ({
  useStakingPools: () => useStakingPoolsMock(),
  useStakingPositions: () => useStakingPositionsMock(),
  useStakingActions: () => useStakingActionsMock(),
}));

vi.mock('@/hooks/use-platform-gates', () => ({
  usePlatformGates: () => usePlatformGatesMock(),
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/features/trading/trade-feedback-display', () => ({
  showTradeFeedback: vi.fn(),
  showTradeRpcErrorFeedback: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

function queryWrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

const mockPool = {
  id: 'pool-flex',
  reference_asset: 'PHON',
  stake_currency: 'PHON',
  term: 'flexible',
  lock_days: 0,
  estimated_apr: '0.030000',
  display_name: 'PHON Flexible',
  sort_order: 0,
  is_active: true,
};

const mockPosition = {
  id: 'pos-1',
  user_id: 'user-1',
  pool_id: 'pool-flex',
  reference_asset: 'PHON',
  stake_currency: 'PHON',
  term: 'flexible',
  principal: '100.000000',
  reward_claimed: '0.000000',
  apr_snapshot: '0.030000',
  status: 'active',
  locked_until: null,
  staked_at: '2026-01-01T00:00:00.000Z',
  unstaked_at: null,
};

function seedStakingMocks(
  tierRpc: 'ok' | 'fail',
  overrides?: {
    poolsError?: boolean;
    walletError?: boolean;
    positions?: (typeof mockPosition)[];
  },
) {
  useAuthMock.mockReturnValue({
    session: { user: { id: 'user-1' } },
    loading: false,
  });
  useWalletMock.mockReturnValue({
    wallet: overrides?.walletError
      ? null
      : {
          phon_available: '5000.000000',
          usdt_available: '8000.000000',
        },
    loading: false,
    error: overrides?.walletError ? 'wallet.loadError' : null,
    refetch: vi.fn(),
  });
  useStakingPoolsMock.mockReturnValue({
    pools: [mockPool],
    loading: false,
    isError: overrides?.poolsError ?? false,
    refetch: vi.fn(),
  });
  useStakingPositionsMock.mockReturnValue({
    positions: overrides?.positions ?? [mockPosition],
    loading: false,
    refresh: vi.fn(),
    isError: false,
  });
  usePlatformGatesMock.mockReturnValue({
    stakingBlocked: false,
    loading: false,
  });
  useStakingActionsMock.mockReturnValue({
    stakePool: stakePoolMock,
    unstake: unstakeMock,
    claim: claimMock,
    busy: false,
    error: null,
  });
  rpcMock.mockImplementation((name: string) => {
    if (name === 'rpc_get_earn_hub_status') {
      if (tierRpc === 'fail') {
        return Promise.resolve({ data: null, error: { message: 'tier unavailable' } });
      }
      return Promise.resolve({
        data: { tier: 'gold', xp: 5000 },
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
}

describe('useStakingPageController · renderHook · P1-E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports claimBlockedReason and disables position actions when tier RPC fails', async () => {
    seedStakingMocks('fail');

    const { result } = renderHook(() => useStakingPageController(), { wrapper: queryWrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tierError).toBe(true);
    expect(result.current.claimBlockedReason).toBe('staking.tier.loadErrorRetry');
    expect(result.current.positionActionsDisabled).toBe(true);

    await result.current.claimReward('pos-1');
    expect(claimMock).not.toHaveBeenCalled();

    await result.current.unstakePosition('pos-1');
    expect(unstakeMock).not.toHaveBeenCalled();
  });

  it('allows claim when tier RPC succeeds', async () => {
    seedStakingMocks('ok');
    claimMock.mockResolvedValue({ claimed: false });

    const { result } = renderHook(() => useStakingPageController(), { wrapper: queryWrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tierError).toBe(false);
    expect(result.current.claimBlockedReason).toBeNull();
    expect(result.current.positionActionsDisabled).toBe(false);
    expect(result.current.currentTier).toBe('gold');

    await result.current.claimReward('pos-1');
    expect(claimMock).toHaveBeenCalledWith('pos-1');
  });

  it('disables claim when pending reward is zero (P1-C)', async () => {
    seedStakingMocks('ok', {
      positions: [{ ...mockPosition, pending_reward: '0.000000' }],
    });

    const { result } = renderHook(() => useStakingPageController(), { wrapper: queryWrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.activePositions[0]?.pendingRewardDisplay).toBe('0.000000');
    expect(result.current.isPositionClaimDisabled(result.current.activePositions[0]!)).toBe(true);

    await result.current.claimReward('pos-1');
    expect(claimMock).not.toHaveBeenCalled();
  });

  it('surfaces poolsError from pools fetch failure', async () => {
    seedStakingMocks('ok', { poolsError: true });

    const { result } = renderHook(() => useStakingPageController(), { wrapper: queryWrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.poolsError).toBe(true);
  });

  it('hides wallet balances and blocks stake when wallet fetch fails', async () => {
    seedStakingMocks('ok', { walletError: true });

    const { result } = renderHook(() => useStakingPageController(), { wrapper: queryWrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.walletError).toBe(true);
    expect(result.current.phonAvailableDisplay).toBeNull();
    expect(result.current.usdtAvailableDisplay).toBeNull();
    expect(result.current.canStake).toBe(false);
  });

  it('sets insufficientAvail and blocks stake when amount exceeds balance', async () => {
    seedStakingMocks('ok');

    const { result } = renderHook(() => useStakingPageController(), { wrapper: queryWrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setStakeAmount('99999');
    });

    expect(result.current.insufficientAvail).toBe(true);
    expect(result.current.canStake).toBe(false);
    expect(result.current.submitDisabledReason).toBe('error.INSUFFICIENT_BALANCE');
  });

  it('auto-selects first pool and reference asset after load', async () => {
    seedStakingMocks('ok');

    const { result } = renderHook(() => useStakingPageController(), { wrapper: queryWrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.selectedReferenceAsset).toBe('PHON');
    expect(result.current.selectedPoolId).toBe('pool-flex');
  });
});
