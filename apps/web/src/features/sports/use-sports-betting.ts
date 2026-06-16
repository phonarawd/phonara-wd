import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/auth-context';
import { supabase } from '../../lib/supabase';

export interface SportsFixtureSummary {
  readonly fixture_id: string;
  readonly league_code: string;
  readonly home_name: string;
  readonly away_name: string;
  readonly kickoff_at: string;
  readonly status: string;
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

export function useListSportsFixtures(league?: string, status?: string) {
  return useQuery({
    queryKey: ['sports', 'fixtures', league ?? 'all', status ?? 'all'],
    queryFn: async (): Promise<SportsFixtureSummary[]> => {
      return sportsRpc<SportsFixtureSummary[]>('rpc_list_sports_fixtures', {
        p_date: null,
        p_league: league ?? null,
        p_status: status ?? null,
      });
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export function useGetFixtureMarkets(fixtureId: string | undefined) {
  return useQuery({
    queryKey: ['sports', 'fixture-markets', fixtureId],
    enabled: Boolean(fixtureId),
    queryFn: async (): Promise<SportsMarketSummary[]> => {
      const payload = await sportsRpc<{
        markets?: SportsMarketSummary[];
      }>('rpc_get_fixture_markets', {
        p_fixture_id: fixtureId,
      });
      return payload?.markets ?? [];
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export function usePlaceSportsBet() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      legs: readonly SportsBetLegInput[];
      stake: string;
      currency: 'PHON' | 'USDT';
      idempotencyKey: string;
      deviceHash?: string;
      ipHash?: string;
    }) => {
      if (!session?.user) throw new Error('UNAUTHENTICATED');
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
    queryFn: async () => {
      return sportsRpc<unknown>('rpc_get_live_fixture_state', {
        p_fixture_id: fixtureId,
      });
    },
    refetchInterval: 15_000,
  });
}
