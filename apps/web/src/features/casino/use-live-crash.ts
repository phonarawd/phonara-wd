/**
 * E23 live crash — shared round get / place / mid-flight cash-out.
 * Gated by `LAUNCH_GATES.casinoLiveLive`. Scheduler advance stays service_role.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  EW_E23_LIVE_CRASH_CASHOUT_RPC,
  EW_E23_LIVE_CRASH_GET_RPC,
  EW_E23_LIVE_CRASH_PLACE_RPC,
} from '@/domain/ew-e23-casino-live-display-contract';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { callRpc } from '@/lib/rpc';
import { useAuth } from '@/contexts/auth-context';

export type LiveCrashRound = {
  id: string;
  status: 'betting' | 'flying' | 'crashed' | string;
  server_seed_hash: string;
  server_seed: string | null;
  crash_multiplier: string | null;
  current_multiplier: string | null;
  sequence_no: number;
  betting_closes_at: string | null;
  flew_at: string | null;
  crashed_at: string | null;
  created_at: string;
};

export type LiveCrashCurrent = {
  round: LiveCrashRound | null;
};

export type LiveCrashBetResult = {
  bet_id: string;
  round_id: string;
  status: string;
  stake: string;
  currency: string;
  auto_cashout: string;
  payout?: string;
  already_placed?: boolean;
  already_settled?: boolean;
};

function assertLive(): void {
  if (!LAUNCH_GATES.casinoLiveLive) {
    throw new Error('casino_live_ui_locked');
  }
}

export function useLiveCrashCurrent(enabled = true) {
  const live = LAUNCH_GATES.casinoLiveLive;

  return useQuery({
    queryKey: ['casino', 'live-crash', 'current'],
    enabled: live && enabled,
    queryFn: async () => (await callRpc(EW_E23_LIVE_CRASH_GET_RPC)) as LiveCrashCurrent,
    staleTime: 1_000,
    refetchInterval: (query) => {
      const status = query.state.data?.round?.status;
      if (status === 'betting' || status === 'flying') return 1_000;
      return 5_000;
    },
  });
}

export function useLiveCrashPlaceBet() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      currency: string;
      stake: string;
      autoCashout: string;
      clientSeed: string;
      idempotencyKey: string;
      useAccountPf?: boolean;
    }) => {
      assertLive();
      if (!session?.user) throw new Error('UNAUTHENTICATED');
      return (await callRpc(EW_E23_LIVE_CRASH_PLACE_RPC, {
        p_currency: input.currency,
        p_stake: input.stake,
        p_auto_cashout: input.autoCashout,
        p_client_seed: input.clientSeed,
        p_idempotency_key: input.idempotencyKey,
        p_use_account_pf: input.useAccountPf ?? false,
      })) as LiveCrashBetResult;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['casino', 'live-crash'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useLiveCrashCashout() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { betId: string; idempotencyKey: string }) => {
      assertLive();
      if (!session?.user) throw new Error('UNAUTHENTICATED');
      return (await callRpc(EW_E23_LIVE_CRASH_CASHOUT_RPC, {
        p_bet_id: input.betId,
        p_idempotency_key: input.idempotencyKey,
      })) as LiveCrashBetResult;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['casino', 'live-crash'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
