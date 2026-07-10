import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSportsPageController } from '@/features/sports/use-sports-page-controller';
import { LAUNCH_GATES } from '@/lib/launch-gates';

const useAuthMock = vi.hoisted(() => vi.fn());
const usePlatformGatesMock = vi.hoisted(() => vi.fn());
const useClientGatePrechecksMock = vi.hoisted(() => vi.fn());
const useWalletMock = vi.hoisted(() => vi.fn());
const usePhonBalanceBreakdownMock = vi.hoisted(() => vi.fn());
const useListSportsFixturesMock = vi.hoisted(() => vi.fn());
const useMySportsBetsMock = vi.hoisted(() => vi.fn());
const usePlaceSportsBetMock = vi.hoisted(() => vi.fn());
const useSportsBetSlipStateMock = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/hooks/use-platform-gates', () => ({
  usePlatformGates: () => usePlatformGatesMock(),
}));

vi.mock('@/hooks/use-client-gate-prechecks', () => ({
  useClientGatePrechecks: () => useClientGatePrechecksMock(),
}));

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => useWalletMock(),
}));

vi.mock('@/features/wallet/use-phon-balance-breakdown', () => ({
  usePhonBalanceBreakdown: () => usePhonBalanceBreakdownMock(),
}));

const useGetFixtureMarketsMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/sports/use-sports-betting', () => ({
  useListSportsFixtures: () => useListSportsFixturesMock(),
  useGetFixtureMarkets: (...args: unknown[]) => useGetFixtureMarketsMock(...args),
  useMySportsBets: () => useMySportsBetsMock(),
  usePlaceSportsBet: () => usePlaceSportsBetMock(),
}));

vi.mock('@/features/sports/use-sports-bet-slip-state', () => ({
  useSportsBetSlipState: () => useSportsBetSlipStateMock(),
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: vi.fn() },
}));

function seedSportsControllerMocks(overrides?: {
  sportsBlocked?: boolean;
  consentBlocked?: boolean;
  session?: { user: { id: string } } | null;
  stake?: string;
  selections?: Array<{
    outcomeId: string;
    oddsAtBet: string;
    fixtureId: string;
    homeName: string;
    awayName: string;
    selection: string;
    marketType: string;
  }>;
}) {
  useAuthMock.mockReturnValue({
    session: overrides && 'session' in overrides ? overrides.session : { user: { id: 'user-1' } },
  });
  usePlatformGatesMock.mockReturnValue({
    sportsBlocked: overrides?.sportsBlocked ?? false,
    loading: false,
  });
  useClientGatePrechecksMock.mockReturnValue({
    consentBlocked: overrides?.consentBlocked ?? false,
    consentBlockedKey: 'sports.gate.login',
  });
  useWalletMock.mockReturnValue({
    wallet: {
      phon_available: '1000.000000',
      usdt_available: '250.000000',
    },
    loading: false,
  });
  usePhonBalanceBreakdownMock.mockReturnValue({
    breakdown: { phon_available: '1000.000000', phon_bonus_available: '50.000000' },
    loading: false,
  });
  useListSportsFixturesMock.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  useGetFixtureMarketsMock.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  useMySportsBetsMock.mockReturnValue({
    data: [],
    isLoading: false,
  });
  usePlaceSportsBetMock.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  });
  useSportsBetSlipStateMock.mockReturnValue({
    selections: overrides?.selections ?? [
      {
        outcomeId: 'out-1',
        oddsAtBet: '1.95',
        fixtureId: 'fx-1',
        homeName: 'Arsenal',
        awayName: 'Chelsea',
        selection: 'Home',
        marketType: '1x2',
      },
    ],
    stake: overrides?.stake ?? '10',
    setStake: vi.fn(),
    stakeCurrency: 'USDT' as const,
    setStakeCurrency: vi.fn(),
    toggleSelection: vi.fn(),
    removeSelection: vi.fn(),
    clearSlip: vi.fn(),
    combinedOddsDisplay: '1.95',
    potentialPayoutDisplay: '19.50',
    debitBucketKey: 'sports.slip.debit_bucket.usdt',
    legCount: 1,
  });
}

describe('useSportsPageController · LAUNCH_GATES.sportsBetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedSportsControllerMocks();
  });

  it('exposes placeCtaExposure=built_disabled while LAUNCH_GATES.sportsBetting is false', () => {
    expect(LAUNCH_GATES.sportsBetting).toBe(false);

    const { result } = renderHook(() => useSportsPageController());

    expect(result.current.placeCtaExposure).toBe('built_disabled');
    expect(result.current.canPlaceBet).toBe(false);
    expect(result.current.sportsBlocked).toBe(true);
    expect(result.current.sportsBlockedKey).toBe('sports.gate.feature_off');
  });

  it('keeps canPlaceBet false when kill-switch sportsBlocked even if slip is ready', () => {
    seedSportsControllerMocks({ sportsBlocked: true });

    const { result } = renderHook(() => useSportsPageController());

    expect(result.current.placeCtaExposure).toBe('built_disabled');
    expect(result.current.canPlaceBet).toBe(false);
  });

  it('blocks place when session missing (layered after launch gate)', () => {
    seedSportsControllerMocks({ session: null });

    const { result } = renderHook(() => useSportsPageController());

    expect(result.current.canPlaceBet).toBe(false);
  });
});
