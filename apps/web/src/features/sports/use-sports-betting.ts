import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  parseSportsLiveFixtureState,
  type SportsLiveFixtureState,
} from '@/domain/sports-live-surface-display-contract';

import { useAuth } from '../../contexts/auth-context';
import { supabase } from '../../lib/supabase';

export type { SportsLiveFixtureState };

function isVisualFixtureMode(): boolean {
  return false;
}

const VISUAL_FIXTURE = {
  oddsHome: '1.68',
  oddsDraw: '3.80',
  oddsAway: '4.75',
} as const;

export interface SportsFixtureSummary {
  readonly fixture_id: string;
  readonly league_code: string;
  readonly sport_code?: string;
  readonly home_name: string;
  readonly away_name: string;
  readonly kickoff_at: string;
  readonly status: string;
  /** Optional — patched from live-state / realtime (list RPC may omit). */
  readonly result_home_goals?: number | null;
  readonly result_away_goals?: number | null;
  readonly suspended_until?: string | null;
  readonly suspend_reason?: string | null;
  readonly match_1x2?: Readonly<
    Record<string, { outcome_id: string; odds: string; captured_at: string }>
  >;
}

export interface SportsMarketOutcome {
  readonly outcome_id: string;
  readonly selection: string;
  readonly line?: string | null;
  readonly odds?: string | null;
  readonly captured_at?: string | null;
}

export interface SportsMarketSummary {
  readonly market_id: string;
  readonly market_type: string;
  readonly status: string;
  readonly outcomes: readonly SportsMarketOutcome[];
}

export interface SportsBetLegInput {
  readonly outcome_id: string;
  readonly odds_at_bet: string;
}

async function sportsRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) throw error;
  return data as T;
}

const VISUAL_FIXTURE_FIXTURES: SportsFixtureSummary[] = [
  {
    fixture_id: 'visual-fixture-1',
    league_code: 'epl',
    home_name: 'Team A',
    away_name: 'Team B',
    kickoff_at: '2026-06-26T15:00:00.000Z',
    status: 'scheduled',
    match_1x2: {
      home: {
        outcome_id: 'visual-home',
        odds: VISUAL_FIXTURE.oddsHome,
        captured_at: '2026-06-26T12:00:00.000Z',
      },
      draw: {
        outcome_id: 'visual-draw',
        odds: '3.40',
        captured_at: '2026-06-26T12:00:00.000Z',
      },
      away: {
        outcome_id: 'visual-away',
        odds: VISUAL_FIXTURE.oddsAway,
        captured_at: '2026-06-26T12:00:00.000Z',
      },
    },
  },
];

export function useListSportsFixtures(league?: string, status?: string) {
  const fixture = isVisualFixtureMode();
  return useQuery({
    queryKey: ['sports', 'fixtures', league ?? 'all', status ?? 'all'],
    queryFn: async (): Promise<SportsFixtureSummary[]> => {
      if (fixture) return VISUAL_FIXTURE_FIXTURES;
      return sportsRpc<SportsFixtureSummary[]>('rpc_list_sports_fixtures', {
        p_date: null,
        p_league: league ?? null,
        p_status: status ?? null,
      });
    },
    staleTime: fixture ? Infinity : 5_000,
    refetchInterval: fixture ? false : 60_000,
  });
}

const VISUAL_FIXTURE_MARKETS: SportsMarketSummary[] = [
  {
    market_id: 'visual-market-1x2',
    market_type: 'match_1x2',
    status: 'open',
    outcomes: [
      {
        outcome_id: 'visual-home',
        selection: 'home',
        odds: VISUAL_FIXTURE.oddsHome,
        captured_at: '2026-06-26T12:00:00.000Z',
      },
      {
        outcome_id: 'visual-draw',
        selection: 'draw',
        odds: VISUAL_FIXTURE.oddsDraw,
        captured_at: '2026-06-26T12:00:00.000Z',
      },
      {
        outcome_id: 'visual-away',
        selection: 'away',
        odds: VISUAL_FIXTURE.oddsAway,
        captured_at: '2026-06-26T12:00:00.000Z',
      },
    ],
  },
  {
    market_id: 'visual-market-totals',
    market_type: 'totals',
    status: 'open',
    outcomes: [
      {
        outcome_id: 'visual-over',
        selection: 'over',
        line: '2.5',
        odds: '1.91',
        captured_at: '2026-06-26T12:00:00.000Z',
      },
      {
        outcome_id: 'visual-under',
        selection: 'under',
        line: '2.5',
        odds: '1.93',
        captured_at: '2026-06-26T12:00:00.000Z',
      },
    ],
  },
];

export function useGetFixtureMarkets(fixtureId: string | undefined) {
  const fixture = isVisualFixtureMode();
  return useQuery({
    queryKey: ['sports', 'fixture-markets', fixtureId],
    enabled: Boolean(fixtureId),
    queryFn: async (): Promise<SportsMarketSummary[]> => {
      if (fixture && fixtureId === 'visual-fixture-1') {
        return VISUAL_FIXTURE_MARKETS;
      }
      const payload = await sportsRpc<{
        markets?: SportsMarketSummary[];
      }>('rpc_get_fixture_markets', {
        p_fixture_id: fixtureId,
      });
      return payload?.markets ?? [];
    },
    staleTime: fixture ? Infinity : 5_000,
    refetchInterval: fixture ? false : 60_000,
  });
}

export type SportsBetKind = 'single' | 'combo' | 'sgp';

export function usePlaceSportsBet() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      legs: readonly SportsBetLegInput[];
      stake: string;
      currency: 'PHON' | 'USDT';
      idempotencyKey: string;
      betKind?: SportsBetKind;
      deviceHash?: string;
      ipHash?: string;
      /** E22 — strict | accept_any | accept_better (NULL → server default). */
      oddsAcceptance?: 'strict' | 'accept_any' | 'accept_better';
    }) => {
      if (!session?.user) throw new Error('UNAUTHENTICATED');
      const betKind =
        input.betKind ?? (input.legs.length > 1 ? ('combo' as const) : ('single' as const));
      return sportsRpc<{
        bet_id: string;
        status: string;
        combined_odds: string;
        potential_payout: string;
        already_placed: boolean;
      }>('rpc_place_sports_bet', {
        p_legs: input.legs,
        p_stake: input.stake,
        p_currency: input.currency,
        p_idempotency_key: input.idempotencyKey,
        p_bet_kind: betKind,
        p_device_hash: input.deviceHash ?? null,
        p_ip_hash: input.ipHash ?? null,
        p_odds_acceptance: input.oddsAcceptance ?? null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sports'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useMySportsBets(limit = 50) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['sports', 'my-bets', session?.user?.id, limit],
    enabled: Boolean(session?.user),
    queryFn: async () => {
      return sportsRpc<unknown[]>('rpc_list_my_sports_bets', { p_limit: limit });
    },
  });
}

export function useGetSportsBet(betId: string | undefined) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['sports', 'bet', betId],
    enabled: Boolean(session?.user && betId),
    queryFn: async () => {
      return sportsRpc<unknown>('rpc_get_sports_bet', { p_bet_id: betId });
    },
  });
}

export function useLiveFixtureState(fixtureId: string | undefined) {
  return useQuery({
    queryKey: ['sports', 'live-state', fixtureId],
    enabled: Boolean(fixtureId),
    queryFn: async (): Promise<SportsLiveFixtureState | null> => {
      const raw = await sportsRpc<unknown>('rpc_get_live_fixture_state', {
        p_fixture_id: fixtureId,
      });
      return parseSportsLiveFixtureState(raw);
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

/** Batch live-state for `/sports/live` board rows — one query path, no per-page forks. */
export function useLiveFixtureStates(fixtureIds: readonly string[]) {
  const uniqueIds = [...new Set(fixtureIds.filter(Boolean))];

  const queries = useQueries({
    queries: uniqueIds.map((fixtureId) => ({
      queryKey: ['sports', 'live-state', fixtureId] as const,
      queryFn: async (): Promise<SportsLiveFixtureState | null> => {
        const raw = await sportsRpc<unknown>('rpc_get_live_fixture_state', {
          p_fixture_id: fixtureId,
        });
        return parseSportsLiveFixtureState(raw);
      },
      staleTime: 5_000,
      refetchInterval: 15_000,
      enabled: Boolean(fixtureId),
    })),
  });

  const byFixtureId = new Map<string, SportsLiveFixtureState>();
  uniqueIds.forEach((id, index) => {
    const state = queries[index]?.data;
    if (state) byFixtureId.set(id, state);
  });

  return {
    byFixtureId,
    loading: queries.some((q) => q.isLoading),
    isFetching: queries.some((q) => q.isFetching),
    fixtureIds: uniqueIds,
  };
}

export function usePreviewSportsCashout(
  betId: string | undefined,
  options?: { liveRefresh?: boolean },
) {
  const { session } = useAuth();
  const liveRefresh = options?.liveRefresh ?? false;

  return useQuery({
    queryKey: ['sports', 'cashout-preview', betId],
    enabled: Boolean(session?.user && betId),
    queryFn: async () => {
      return sportsRpc<{
        bet_id: string;
        cashout_amount: string;
        currency: string;
        potential_payout: string;
      }>('rpc_preview_sports_cashout', { p_bet_id: betId });
    },
    staleTime: 5_000,
    refetchInterval: liveRefresh ? 15_000 : false,
  });
}

export function usePlaceSportsSystemBet() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      legs: readonly SportsBetLegInput[];
      systemSizes: readonly number[];
      stakePerLine: string;
      currency: 'PHON' | 'USDT';
      idempotencyKey: string;
      deviceHash?: string;
      ipHash?: string;
    }) => {
      if (!session?.user) throw new Error('UNAUTHENTICATED');
      return sportsRpc<{ lines: unknown[] }>('rpc_place_sports_system_bet', {
        p_legs: input.legs,
        p_system_sizes: input.systemSizes,
        p_stake_per_line: input.stakePerLine,
        p_currency: input.currency,
        p_idempotency_key: input.idempotencyKey,
        p_device_hash: input.deviceHash ?? null,
        p_ip_hash: input.ipHash ?? null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sports'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useCashoutSportsBet() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { betId: string; cashoutAmount: string; idempotencyKey: string }) => {
      if (!session?.user) throw new Error('UNAUTHENTICATED');
      return sportsRpc<{ bet_id: string; status: string; cashout_amount: string }>(
        'rpc_cashout_sports_bet',
        {
          p_bet_id: input.betId,
          p_cashout_amount: input.cashoutAmount,
          p_idempotency_key: input.idempotencyKey,
        },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sports'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function usePartialCashoutSportsBet() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      betId: string;
      stakePortion: string;
      cashoutAmount: string;
      idempotencyKey: string;
    }) => {
      if (!session?.user) throw new Error('UNAUTHENTICATED');
      return sportsRpc<{
        bet_id: string;
        status: string;
        cashout_amount: string;
        remaining_stake: string;
        partial: boolean;
      }>('rpc_partial_cashout_sports_bet', {
        p_bet_id: input.betId,
        p_stake_portion: input.stakePortion,
        p_cashout_amount: input.cashoutAmount,
        p_idempotency_key: input.idempotencyKey,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sports'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function usePreviewSportsPartialCashout(
  betId: string | undefined,
  stakePortion: string | undefined,
) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['sports', 'partial-cashout-preview', betId, stakePortion],
    enabled: Boolean(session?.user && betId && stakePortion),
    queryFn: async () => {
      return sportsRpc<{
        bet_id: string;
        stake_portion: string;
        cashout_amount: string;
        currency: string;
        remaining_stake: string;
        potential_payout: string;
      }>('rpc_preview_sports_partial_cashout', {
        p_bet_id: betId,
        p_stake_portion: stakePortion,
      });
    },
    staleTime: 5_000,
  });
}
