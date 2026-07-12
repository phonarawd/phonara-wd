/**
 * E23 progressive rounds — mines / hilo / blackjack step + mid cash-out.
 * Gated by `LAUNCH_GATES.casinoLiveLive`.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@phonara/shared-types';

import {
  EW_E23_PROGRESSIVE_CASHOUT_RPC,
  EW_E23_PROGRESSIVE_START_RPC,
  EW_E23_PROGRESSIVE_STEP_RPC,
} from '@/domain/ew-e23-casino-live-display-contract';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { callRpc } from '@/lib/rpc';
import { useAuth } from '@/contexts/auth-context';

export type ProgressiveGame = 'mines' | 'hilo' | 'blackjack';

export type ProgressiveSessionPublic = {
  session_id: string;
  game: ProgressiveGame;
  status: string;
  currency: string;
  stake: string;
  current_multiplier: string;
  public_state: Record<string, unknown>;
  payout?: string;
  expires_at?: string;
};

function assertLive(): void {
  if (!LAUNCH_GATES.casinoLiveLive) {
    throw new Error('casino_live_ui_locked');
  }
}

export function useProgressiveStart() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      game: ProgressiveGame;
      currency: string;
      stake: string;
      init: Json;
      clientSeed: string;
      idempotencyKey: string;
      useAccountPf?: boolean;
    }) => {
      assertLive();
      if (!session?.user) throw new Error('UNAUTHENTICATED');
      return (await callRpc(EW_E23_PROGRESSIVE_START_RPC, {
        p_game: input.game,
        p_currency: input.currency,
        p_stake: input.stake,
        p_init: input.init,
        p_client_seed: input.clientSeed,
        p_idempotency_key: input.idempotencyKey,
        p_use_account_pf: input.useAccountPf ?? false,
      })) as ProgressiveSessionPublic;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useProgressiveStep() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { sessionId: string; action: Json; idempotencyKey: string }) => {
      assertLive();
      if (!session?.user) throw new Error('UNAUTHENTICATED');
      return (await callRpc(EW_E23_PROGRESSIVE_STEP_RPC, {
        p_session_id: input.sessionId,
        p_action: input.action,
        p_idempotency_key: input.idempotencyKey,
      })) as ProgressiveSessionPublic;
    },
    onSuccess: async (data) => {
      if (data.status !== 'active') {
        await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      }
    },
  });
}

export function useProgressiveCashout() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { sessionId: string; idempotencyKey: string }) => {
      assertLive();
      if (!session?.user) throw new Error('UNAUTHENTICATED');
      return (await callRpc(EW_E23_PROGRESSIVE_CASHOUT_RPC, {
        p_session_id: input.sessionId,
        p_idempotency_key: input.idempotencyKey,
      })) as ProgressiveSessionPublic;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
