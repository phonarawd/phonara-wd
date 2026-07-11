/**
 * E23 PF seed controls — get / set client seed / rotate server seed.
 * Gated by `LAUNCH_GATES.casinoLiveLive` (`ew-e23-ui-casino-live-unlocks`).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  EW_E23_GET_PF_STATE_RPC,
  EW_E23_ROTATE_SERVER_SEED_RPC,
  EW_E23_SET_CLIENT_SEED_RPC,
} from '@/domain/ew-e23-casino-live-display-contract';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { useAuth } from '@/contexts/auth-context';

import { casinoLiveRpc } from './casino-live-rpc';

export type GamePfState = {
  client_seed: string;
  next_nonce: number;
  server_seed_hash: string;
  previous_server_seed: string | null;
};

const PF_QUERY_KEY = ['casino', 'game-pf-state'] as const;

export function useGamePfState(enabled = true) {
  const { session } = useAuth();
  const live = LAUNCH_GATES.casinoLiveLive;

  return useQuery({
    queryKey: PF_QUERY_KEY,
    enabled: Boolean(session?.user && live && enabled),
    queryFn: async () => casinoLiveRpc<GamePfState>(EW_E23_GET_PF_STATE_RPC),
    staleTime: 10_000,
  });
}

export function useSetGameClientSeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientSeed: string) => {
      if (!LAUNCH_GATES.casinoLiveLive) {
        throw new Error('casino_live_ui_locked');
      }
      return casinoLiveRpc<GamePfState>(EW_E23_SET_CLIENT_SEED_RPC, {
        p_client_seed: clientSeed,
      });
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(PF_QUERY_KEY, data);
      await queryClient.invalidateQueries({ queryKey: PF_QUERY_KEY });
    },
  });
}

export function useRotateGameServerSeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newClientSeed?: string | null) => {
      if (!LAUNCH_GATES.casinoLiveLive) {
        throw new Error('casino_live_ui_locked');
      }
      return casinoLiveRpc<GamePfState>(EW_E23_ROTATE_SERVER_SEED_RPC, {
        p_new_client_seed: newClientSeed ?? null,
      });
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(PF_QUERY_KEY, data);
      await queryClient.invalidateQueries({ queryKey: PF_QUERY_KEY });
    },
  });
}
