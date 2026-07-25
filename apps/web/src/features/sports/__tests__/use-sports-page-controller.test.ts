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

vi.mock('@/features/responsible-gaming/use-rg-gate-policy', () => ({
  useRgGatePolicy: () => async () => null,
  rgReasonMessageKey: (reason: string) =>
    reason === 'self_exclusion'
      ? 'games.shared.rg.self_exclusion.title'
      : 'games.shared.rg.daily_loss_limit.title',
}));

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => useWalletMock(),
}));

vi.mock('@/features/wallet/use-phon-balance-breakdown', () => ({
  usePhonBalanceBreakdown: () => usePhonBalanceBreakdownMock(),
}));

const useGetFixtureMarketsMock = vi.hoisted(() => vi.fn());
const useLiveFixtureStateMock = vi.hoisted(() => vi.fn());
const useLiveFixtureStatesMock = vi.hoisted(() => vi.fn());
const useSportsRealtimeMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/sports/use-sports-betting', () => ({
  useListSportsFixtures: () => useListSportsFixturesMock(),
  useGetFixtureMarkets: (...args: unknown[]) => useGetFixtureMarketsMock(...args),
  useLiveFixtureState: (...args: unknown[]) => useLiveFixtureStateMock(...args),
  useLiveFixtureStates: (...args: unknown[]) => useLiveFixtureStatesMock(...args),
  useMySportsBets: () => useMySportsBetsMock(),
  usePlaceSportsBet: () => usePlaceSportsBetMock(),
}));

vi.mock('@/hooks/use-sports-realtime', () => ({
  useSportsRealtime: (...args: unknown[]) => useSportsRealtimeMock(...args),
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
  useLiveFixtureStateMock.mockReturnValue({
    data: null,
    isLoading: false,
    isFetching: false,
  });
  useLiveFixtureStatesMock.mockReturnValue({
    byFixtureId: new Map(),
    loading: false,
    isFetching: false,
    fixtureIds: [],
  });
  useSportsRealtimeMock.mockReturnValue({
    status: 'disabled',
    connected: false,
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
    oddsAcceptance: 'accept_better' as const,
    setOddsAcceptance: vi.fn(),
    oddsAcceptancePolicies: ['strict', 'accept_any', 'accept_better'] as const,
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

  it('SB-W3: exposes placeCtaExposure=live while ingest health blocks canPlaceBet', () => {
    expect(LAUNCH_GATES.sportsBetting).toBe(true);

    const { result } = renderHook(() => useSportsPageController());

    expect(result.current.placeCtaExposure).toBe('live');
    expect(result.current.canPlaceBet).toBe(false);
    expect(result.current.oddsIngestHealthGreen).toBe(false);
    expect(result.current.sportsBlocked).toBe(false);
  });

  it('keeps oddsIngestHealthGreen false for audit-era stale captured_at (H-05)', () => {
    useListSportsFixturesMock.mockReturnValue({
      data: [
        {
          fixture_id: 'fx-stale',
          league_code: 'epl',
          home_name: 'A',
          away_name: 'B',
          kickoff_at: '2026-07-11T12:00:00.000Z',
          status: 'scheduled',
          match_1x2: {
            home: {
              outcome_id: 'h',
              odds: '1.90',
              captured_at: '2026-06-16T04:43:29.944Z',
            },
          },
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useSportsPageController());

    expect(result.current.oddsIngestHealthGreen).toBe(false);
    expect(result.current.canPlaceBet).toBe(false);
  });

  it('keeps canPlaceBet false when kill-switch sportsBlocked even if launch gate is live', () => {
    seedSportsControllerMocks({ sportsBlocked: true });

    const { result } = renderHook(() => useSportsPageController());

    expect(result.current.placeCtaExposure).toBe('live');
    expect(result.current.sportsBlocked).toBe(true);
    expect(result.current.canPlaceBet).toBe(false);
  });

  it('blocks place when session missing (layered after launch gate)', () => {
    seedSportsControllerMocks({ session: null });

    const { result } = renderHook(() => useSportsPageController());

    expect(result.current.canPlaceBet).toBe(false);
  });

  it('passes visibleFixtureIds into sports realtime for odds INSERT scope', () => {
    useListSportsFixturesMock.mockReturnValue({
      data: [
        {
          fixture_id: 'fx-board',
          league_code: 'epl',
          home_name: 'A',
          away_name: 'B',
          kickoff_at: '2026-07-11T12:00:00.000Z',
          status: 'live',
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderHook(() => useSportsPageController('fixture', 'fx-detail'));

    expect(useSportsRealtimeMock).toHaveBeenCalled();
    const opts = useSportsRealtimeMock.mock.calls.at(-1)?.[0] as {
      enabled: boolean;
      visibleFixtureIds: Set<string>;
    };
    expect(opts.enabled).toBe(true);
    expect([...opts.visibleFixtureIds].sort()).toEqual(['fx-board', 'fx-detail']);
  });
});
